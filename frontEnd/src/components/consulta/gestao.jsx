import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "calendar-alt",
  title: "Gestão de Consultas",
  subtitle: "Listagem paginada de consultas",
};

const baseUrl = "http://localhost:4040/";
const controlers = {
  medicos: "medicos",
  agendaMedico: "agendaMedico",
  agenda: "AgendaCodigo",
  agendar: "agendarConsulta",
  atualizar: "atualizarDados",
  listarConsultas: "listarConsultas", // Adicione esta linha
};
const initialState = {
  med: { nomem: "", crm: "" },
  dadosAgenda: {
    codigo: "",
    data: "",
    horainic: "",
    horafim: "",
    idpaciente: "",
    idespecial: "",
    idmedico: "",
    valorpago: "",
    pagou: false,
    formapagamento: "",
  },
  list: [],
  consultas: [], // Adicione esta linha
  agendaOpen: false,
  agenda: <div></div>,
  horarios: [],

  consultas: [],
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 1,
  },
  filters: {
    codigo: "",
    nomePaciente: "",
    dataInicio: "",
    dataFim: "",
  },
  loading: false,
};
export default class RegisterMedico extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadConsultas();
  }

  loadConsultas = async (page = 1) => {
    this.setState({ loading: true });

    try {
      const { itemsPerPage } = this.state.pagination;
      const { filters } = this.state;

      const response = await axios.get(`${baseUrl}listarConsultas`, {
        params: {
          page,
          limit: itemsPerPage,
          ...filters,
        },
      });

      this.setState({
        consultas: response.data.data,
        pagination: {
          currentPage: response.data.page,
          itemsPerPage,
          totalItems: response.data.total,
          totalPages: response.data.totalPages,
        },
        loading: false,
      });
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      this.setState({ loading: false });
      alert("Erro ao carregar consultas. Verifique o console para detalhes.");
    }
  };

  handleFilterChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      filters: {
        ...prevState.filters,
        [name]: value,
      },
    }));
  };

  applyFilters = () => {

  this.setState({
         consultas: this.state.consultas.filter(x => x.nome_paciente === this.state.filters.nomePaciente),
         }
       );



  };

  resetFilters = () => {
    this.setState(
      {
        filters: {
          codigo: "",
          dataInicio: "",
          dataFim: "",
        },
      },
      () => this.loadConsultas(1)
    );
  };

  renderFilters() {
    const { filters } = this.state;

    return (
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Filtros</h5>
          <div className="row">
            <div className="col-md-3">
              <div className="form-group">
                <label>Nome do Paciente</label>
                <input
                  type="text"
                  className="form-control"
                  name="nomePaciente"
                  value={filters.nomePaciente}
                  onChange={this.handleFilterChange}
                  placeholder="nome do paciente"
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>Data Início</label>
                <input
                  type="date"
                  className="form-control"
                  name="dataInicio"
                  value={filters.dataInicio}
                  onChange={this.handleFilterChange}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>Data Fim</label>
                <input
                  type="date"
                  className="form-control"
                  name="dataFim"
                  value={filters.dataFim}
                  onChange={this.handleFilterChange}
                />
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-primary mr-2"
                onClick={this.applyFilters}
              >
                Aplicar
              </button>
              <button className="btn btn-secondary" onClick={this.resetFilters}>
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderPageSizeSelector() {
    const pageSizes = [10, 20, 50, 100];
    const { itemsPerPage } = this.state.pagination;

    return (
      <div className="mb-3 d-flex align-items-center">
        <label className="mr-2 mb-0">Itens por página:</label>
        <select
          className="form-control form-control-sm w-auto"
          value={itemsPerPage}
          onChange={(e) => {
            this.setState(
              {
                pagination: {
                  ...this.state.pagination,
                  itemsPerPage: parseInt(e.target.value),
                  currentPage: 1,
                },
              },
              () => this.loadConsultas(1)
            );
          }}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    );
  }
  componentDidMount() {
    this.loadConsultas();
    axios(baseUrl + controlers.medicos).then((resp) => {
      this.setState({ list: resp.data });
    });
  }

  generateTimeSlots(startTime, endTime, interval) {
    let timeSlots = [];
    let start = new Date(`1970-01-01T${startTime}:00`);
    let end = new Date(`1970-01-01T${endTime}:00`);

    while (start <= end) {
      let hours = start.getHours().toString().padStart(2, "0");
      let minutes = start.getMinutes().toString().padStart(2, "0");
      timeSlots.push(`${hours}:${minutes}:00`);
      start.setMinutes(start.getMinutes() + interval);
    }

    return timeSlots;
  }

  findHorarios() {
    const crm = this.state.dadosAgenda.crm;
    const method = "post";
    const url = baseUrl + controlers.agendaMedico;

    axios({
      method: method,
      url: url,
      data: { crm: crm },
    })
      .then((resp) => {
        this.setState({ horarios: resp.data });
        console.log(this.state.horarios);
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
      });
  }

  findAgenda() {
    const codigo = this.state.dadosAgenda.codigo;
    console.log("codigo; " + codigo);
    const method = "post";
    const url = baseUrl + controlers.agenda;

    console.log("url; " + url);
    axios({
      method: method,
      url: url,
      data: { codigo: codigo },
    })
      .then((resp) => {
        this.setState({ dadosAgenda: resp.data[0] });
        console.log("dados agenda");
        console.log(this.state.dadosAgenda);
        this.atualizarCadastro();

        //console.log(resp.data[0] );
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
      });
  }

  clear() {
    this.setState({ dadosAgenda: initialState.dadosAgenda });
    console.log(this.state.dadosAgenda);
    this.setState({ agendaOpen: false });
  }

  save() {
    const dadosAgenda = this.state.dadosAgenda;
    const method = "post";
    const url = baseUrl + controlers.atualizar;

    axios({
      method: method,
      url: url,
      data: { dadosAgenda: dadosAgenda },
    })
      .then((resp) => {
        console.log("resultado atualização");
        console.log(resp);
        alert("Consulta alterada com sucesso ");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
      });

    this.clear();
  }

  getUpdatedList(med, add = true) {
    const list = this.state.list.filter((u) => u.id !== med.id);
    if (add) list.unshift(med);
    return list;
  }

  updateField(event) {
    const med = { ...this.state.med };
    med[event.target.name] = event.target.value;
    this.setState({ med });
  }

  updateFieldAgenda(event) {
    const dadosAgenda = { ...this.state.dadosAgenda };
    dadosAgenda[event.target.name] = event.target.value;
    this.setState({ dadosAgenda });
    console.log(dadosAgenda);
  }

  renderForm() {
    return (
      <div>
        {this.formMedicoAgenda()}
        {this.state.agendaOpen && this.state.agenda}
      </div>
    );
  }
  loadConsulta(codigo) {
    this.setState(
      {
        dadosAgenda: { ...this.state.dadosAgenda, codigo: codigo },
        agendaOpen: false,
      },
      () => {
        this.findAgenda();
      }
    );
  }

  load(med) {
    this.setState({ med });
  }

  remove(med) {
    axios.delete(`${baseUrl}/${med.id}`).then((resp) => {
      const list = this.getUpdatedList(med, false);
      this.setState({ list });
    });
  }
  listMedicos() {
    return (
      <div>
        <h2>Selecione o Medico para consulta</h2>
        <div className="form-medico-Data"></div>
        <select
          className="form-control"
          onChange={(e) => this.atualizarAgenda(e.target.value)}
        >
          <option key={0} value={0}>
            Selecione
          </option>
          {this.state.list.map((med) => {
            let styles = {
              width: "35px",
            };
            return (
              <option key={med.crm} value={med.nomem}>
                {med.nomem}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  formMedicoAgenda() {
    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Codigo da consulta</label>
              <input
                type="text"
                className="form-control"
                name="codigo"
                onChange={(e) => this.updateFieldAgenda(e)}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={(e) => this.findAgenda(this.state.dadosAgenda.codigo)}
          >
            Buscar
          </button>
        </div>
      </div>
    );
  }

  formatDate(isoDate) {
    const date = new Date(isoDate);

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Os meses são baseados em zero,
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }
  async atualizarCadastro() {
    var listHorarios = this.generateTimeSlots("08:00", "18:00", 30);
    var dados = this.state.dadosAgenda;
    dados.data = this.formatDate(dados.data);

    this.setState({ agenda: this.formAgenda(listHorarios, dados) });

    this.setState({ agendaOpen: true });
    console.log(this.state.dadosAgenda);
  }
  formAgenda(listHorarios, dados) {
    return (
      <div>
        <div className="form">
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Data</label>
                <input
                  value={dados.data}
                  type="text"
                  className="form-control"
                  name="data"
                  onChange={(e) => this.updateFieldAgenda(e)}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Medico:</label>
                <select
                  value={dados.idmedico}
                  className="form-control"
                  name="crm"
                  onChange={(e) => this.updateFieldAgenda(e)}
                >
                  <option key={0} value={0}>
                    Selecione
                  </option>
                  {this.state.list.map((med) => {
                    let styles = {
                      width: "35px",
                    };
                    return (
                      <option key={med.crm} value={med.crm}>
                        {med.nomem}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <div className="form">
            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Codigo Paciente</label>
                  <input
                    value={dados.idpaciente}
                    type="text"
                    className="form-control"
                    name="idpaciente"
                    onChange={(e) => this.updateFieldAgenda(e)}
                    placeholder="Digite o nome..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Horario Inicio</label>
                  <select
                    className="form-control"
                    value={dados.horainic}
                    name="horainic"
                    onChange={(e) => this.updateFieldAgenda(e)}
                  >
                    <option key={0} value={0}>
                      Selecione
                    </option>
                    {listHorarios.map((hora) => {
                      let styles = {
                        width: "35px",
                      };
                      return (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Horario Fim</label>
                  <select
                    className="form-control"
                    value={dados.horafim}
                    name="horafim"
                    onChange={(e) => this.updateFieldAgenda(e)}
                  >
                    <option key={0} value={0}>
                      Selecione
                    </option>
                    {listHorarios.map((hora) => {
                      let styles = {
                        width: "35px",
                      };
                      return (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Codigo Especialidade</label>
                  <input
                    type="text"
                    value={dados.idespecial}
                    className="form-control"
                    name="idespecial"
                    onChange={(e) => this.updateFieldAgenda(e)}
                    placeholder="Digite o nome..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Valor pago</label>
                  <input
                    type="text"
                    value={dados.valorpago}
                    className="form-control"
                    name="valorpago"
                    onChange={(e) => this.updateFieldAgenda(e)}
                    placeholder="Digite o nome..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>pagou</label>
                  <select
                    className="form-control"
                    value={dados.pagou}
                    name="pagou"
                    onChange={(e) => this.updateFieldAgenda(e)}
                  >
                    <option key={0} value={0}>
                      Selecione
                    </option>
                    <option key={1} value={true}>
                      Sim
                    </option>
                    <option key={2} value={false}>
                      Não
                    </option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Forma de pagamento</label>
                  <input
                    value={dados.formapagamento}
                    type="text"
                    className="form-control"
                    name="formapagamento"
                    onChange={(e) => this.updateFieldAgenda(e)}
                    placeholder="Digite o forma de pagamento..."
                  />
                </div>
              </div>
            </div>

            <hr />
            <div className="row">
              <div className="col-12 d-flex justify-content-end">
                <button
                  className="btn btn-primary"
                  onClick={(e) => this.save(e)}
                >
                  Editar dados Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderPagination() {
    const { pagination } = this.state;
    const { currentPage, totalPages } = pagination;

    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="Navegação de páginas">
        <ul className="pagination justify-content-center mt-4">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => this.loadConsultas(1)}>
              Primeira
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => this.loadConsultas(currentPage - 1)}
            >
              Anterior
            </button>
          </li>

          {pageNumbers.map((number) => (
            <li
              key={number}
              className={`page-item ${currentPage === number ? "active" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => this.loadConsultas(number)}
              >
                {number}
              </button>
            </li>
          ))}

          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => this.loadConsultas(currentPage + 1)}
            >
              Próxima
            </button>
          </li>
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => this.loadConsultas(totalPages)}
            >
              Última
            </button>
          </li>
        </ul>
        <div className="text-center">
          <small className="text-muted">
            Página {currentPage} de {totalPages} | Total de{" "}
            {this.state.pagination.totalItems} consultas
          </small>
        </div>
      </nav>
    );
  }

  renderConsultaTable() {
    const { consultas, loading } = this.state;

    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="mt-2">Carregando consultas...</p>
        </div>
      );
    }

    if (consultas.length === 0) {
      return (
        <div className="alert alert-info mt-4">
          Nenhuma consulta encontrada com os filtros atuais
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="thead-dark">
            <tr>
              <th>Código</th>
              <th>Data</th>
              <th>Horário</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {consultas.map((consulta) => (
              <tr key={consulta.codigo}>
                <td>{consulta.codigo}</td>
                <td>{new Date(consulta.data).toLocaleDateString()}</td>
                <td>
                  {consulta.horainic} - {consulta.horafim}
                </td>
                <td>{consulta.nome_paciente}</td>
                <td>{consulta.nome_medico}</td>
                <td>
                  R${" "}
                  {consulta.valorpago != null
                    ? consulta.valorpago.toFixed(2)
                    : "0,00"}
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-primary mr-2"
                    onClick={() => this.handleEdit(consulta.codigo)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  runBenchmark = async () => {
    const where = this.state.benchmarkWhere;
    try {
      const response = await axios.get(`${baseUrl}benchmark/explain`, {
        params: { where },
      });
      this.setState({ benchmarkPlan: response.data.plan });
    } catch (err) {
      alert("Erro ao executar EXPLAIN");
    }
  };

  createIndex = async () => {
    try {
      await axios.post(`${baseUrl}benchmark/create-index`);
      alert("Índice criado com sucesso.");
    } catch (err) {
      alert("Erro ao criar índice");
    }
  };

  renderBenchmark() {
    return (
      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">Benchmark de Consulta SQL</h5>
          <div className="form-group">
            <label>Cláusula WHERE (ex: codigo = 30000)</label>
            <input
              type="text"
              className="form-control"
              value={this.state.benchmarkWhere}
              onChange={(e) =>
                this.setState({ benchmarkWhere: e.target.value })
              }
            />
          </div>
          <button className="btn btn-primary mr-2" onClick={this.runBenchmark}>
            Executar EXPLAIN
          </button>
          <button className="btn btn-secondary" onClick={this.createIndex}>
            Criar Índice em idmedico
          </button>

          {this.state.benchmarkPlan && (
            <pre className="mt-3 bg-light p-3">
              {JSON.stringify(this.state.benchmarkPlan, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Main {...headerProps}>
        {this.renderFilters()}
        {this.renderPageSizeSelector()}
        {this.renderConsultaTable()}
        {this.renderPagination()}
        {this.renderBenchmark()}
      </Main>
    );
  }
}
