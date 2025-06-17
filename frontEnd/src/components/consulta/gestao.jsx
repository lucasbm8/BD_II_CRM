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
  listarConsultas: "listarConsultas",
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
  consultas: [],
  agendaOpen: false,
  agenda: <div></div>,
  horarios: [],
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
  editMode: false, // Novo estado para controlar modo de edição
  benchmarkWhere: "",
  benchmarkPlan: null,
};

export default class RegisterMedico extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadConsultas();
    this.loadMedicos();
  }

  loadMedicos = () => {
    axios(baseUrl + controlers.medicos).then((resp) => {
      this.setState({ list: resp.data });
    });
  };

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

  // Nova função para deletar consulta
  handleDeleteConsulta = async (codigoConsulta) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a consulta ${codigoConsulta}?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}deletarConsulta/${codigoConsulta}`);
      alert("Consulta excluída com sucesso!");
      this.loadConsultas(this.state.pagination.currentPage); // Recarregar a página atual
    } catch (error) {
      console.error("Erro ao deletar consulta:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "Erro ao deletar consulta. Verifique o console para detalhes.";
      alert(errorMessage);
    }
  };

  applyFilters = () => {
    this.loadConsultas(1); // Recarregar da primeira página com filtros
  };

  resetFilters = () => {
    this.setState(
      {
        filters: {
          codigo: "",
          nomePaciente: "",
          dataInicio: "",
          dataFim: "",
        },
      },
      () => this.loadConsultas(1)
    );
  };

  // FUNÇÃO DE EDIÇÃO: Pega os dados diretamente da tabela
  handleEdit = (consulta) => {
    // Calcular dia da semana (0 = domingo, 1 = segunda, etc.)
    const dataConsulta = new Date(consulta.data);
    const diasemana = dataConsulta.getDay();
    console.log("Editando consulta:", consulta);

    // Converter os dados da consulta para o formato do dadosAgenda
    const dadosConsulta = {
      codigo: consulta.codigo,
      data: consulta.data,
      horainic: consulta.horainic,
      horafim: consulta.horafim,
      idpaciente: consulta.idpaciente,
      idespecial: consulta.idespecial,
      idmedico: consulta.idmedico,
      valorpago: consulta.valorpago,
      pagou: consulta.pagou,
      formapagamento: consulta.formapagamento,
      diasemana: diasemana, // ← Adicionar o dia da semana
    };

    this.setState({
      dadosAgenda: dadosConsulta,
      editMode: true,
      agendaOpen: true,
      agenda: <div></div>, // ← Remover a renderização fixa
    });
  };

  // FUNÇÃO CORRIGIDA: cancelEdit
  cancelEdit = () => {
    this.clear();
  };

  // FUNÇÃO CORRIGIDA: clear
  clear = () => {
    this.setState({
      dadosAgenda: initialState.dadosAgenda,
      agendaOpen: false,
      editMode: false,
    });
  };

  // FUNÇÃO CORRIGIDA: save
  save = () => {
    const dadosAgenda = this.state.dadosAgenda;

    // Validações básicas
    if (!dadosAgenda.codigo) {
      alert("Código da consulta é obrigatório");
      return;
    }

    if (!dadosAgenda.idpaciente || !dadosAgenda.idmedico) {
      alert("Paciente e médico são obrigatórios");
      return;
    }

    if (!dadosAgenda.data || !dadosAgenda.horainic || !dadosAgenda.horafim) {
      alert("Data e horários são obrigatórios");
      return;
    }

    const method = "post";
    const url = baseUrl + controlers.atualizar;

    console.log("Salvando dados:", dadosAgenda);

    axios({
      method: method,
      url: url,
      data: { dadosAgenda: dadosAgenda },
    })
      .then((resp) => {
        console.log("Resultado da atualização:", resp);
        alert("Consulta alterada com sucesso!");
        this.clear();
        this.loadConsultas(this.state.pagination.currentPage); // Recarregar a página atual
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
        alert("Erro ao atualizar consulta. Verifique o console para detalhes.");
      });
  };

  updateFieldAgenda = (event) => {
    const dadosAgenda = { ...this.state.dadosAgenda };
    const { name, value } = event.target;

    // Tratar conversões de tipo adequadamente
    if (name === "pagou") {
      dadosAgenda[name] =
        value === "true" ? true : value === "false" ? false : value;
    } else if (name === "valorpago") {
      dadosAgenda[name] = value === "" ? "" : parseFloat(value) || 0;
    } else {
      dadosAgenda[name] = value;
    }

    // Se a data mudou, recalcular o dia da semana
    if (name === "data" && value) {
      const dataConsulta = new Date(value);
      dadosAgenda.diasemana = dataConsulta.getDay();
    }

    this.setState({ dadosAgenda });
  };

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

  formatDate(isoDate) {
    if (!isoDate) return "";

    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDateForInput(isoDate) {
    if (!isoDate) return "";

    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

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
                  placeholder="Nome do paciente"
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

  formMedicoAgenda() {
    if (this.state.editMode) return null; // Não mostrar busca quando em modo de edição

    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Código da consulta</label>
              <input
                type="text"
                className="form-control"
                name="codigo"
                value={this.state.dadosAgenda.codigo}
                onChange={this.updateFieldAgenda}
                placeholder="Digite o código da consulta"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex align-items-end">
            <button
              className="btn btn-primary"
              onClick={() => this.findAgenda()}
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    );
  }

  formAgenda(listHorarios, dados) {
    return (
      <div className="card mt-4">
        <div className="card-header">
          <h5>Editando Consulta - Código: {dados.codigo}</h5>
        </div>
        <div className="card-body">
          <div className="form">
            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    value={this.formatDateForInput(dados.data)}
                    type="date"
                    className="form-control"
                    name="data"
                    onChange={this.updateFieldAgenda}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Médico:</label>
                  <select
                    value={dados.idmedico || ""}
                    className="form-control"
                    name="idmedico"
                    onChange={this.updateFieldAgenda}
                  >
                    <option value="">Selecione</option>
                    {this.state.list.map((med) => (
                      <option key={med.crm} value={med.crm}>
                        {med.nomem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Código Paciente</label>
                  <input
                    value={dados.idpaciente || ""}
                    type="text"
                    className="form-control"
                    name="idpaciente"
                    onChange={this.updateFieldAgenda}
                    placeholder="Digite o código do paciente..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Horário Início</label>
                  <select
                    className="form-control"
                    value={dados.horainic || ""}
                    name="horainic"
                    onChange={this.updateFieldAgenda}
                  >
                    <option value="">Selecione</option>
                    {listHorarios.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Horário Fim</label>
                  <select
                    className="form-control"
                    value={dados.horafim || ""}
                    name="horafim"
                    onChange={this.updateFieldAgenda}
                  >
                    <option value="">Selecione</option>
                    {listHorarios.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Código Especialidade</label>
                  <input
                    type="text"
                    value={dados.idespecial || ""}
                    className="form-control"
                    name="idespecial"
                    onChange={this.updateFieldAgenda}
                    placeholder="Digite o código da especialidade..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Valor Pago</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dados.valorpago || ""}
                    className="form-control"
                    name="valorpago"
                    onChange={this.updateFieldAgenda}
                    placeholder="Digite o valor..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Pagou</label>
                  <select
                    className="form-control"
                    value={dados.pagou !== undefined ? dados.pagou : ""}
                    name="pagou"
                    onChange={this.updateFieldAgenda}
                  >
                    <option value="">Selecione</option>
                    <option value={true}>Sim</option>
                    <option value={false}>Não</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <input
                    value={dados.formapagamento || ""}
                    type="text"
                    className="form-control"
                    name="formapagamento"
                    onChange={this.updateFieldAgenda}
                    placeholder="Digite a forma de pagamento..."
                  />
                </div>
              </div>
            </div>

            <hr />
            <div className="row">
              <div className="col-12 d-flex justify-content-end">
                <button
                  className="btn btn-secondary mr-2"
                  onClick={this.cancelEdit}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={this.save}>
                  Salvar Alterações
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
              <th>Status Pagamento</th>
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
                  <span
                    className={`badge ${
                      consulta.pagou ? "badge-success" : "badge-warning"
                    }`}
                  >
                    {consulta.pagou ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary mr-2" // Adicionado mr-2 para espaçamento
                    onClick={() => this.handleEdit(consulta)}
                    disabled={this.state.agendaOpen}
                  >
                    <i className="fa fa-edit"></i> Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger" // Botão de deletar
                    onClick={() => this.handleDeleteConsulta(consulta.codigo)}
                  >
                    <i className="fa fa-trash"></i> Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
              value={this.state.benchmarkWhere || ""}
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

  render() {
    return (
      <Main {...headerProps}>
        {!this.state.agendaOpen && (
          <div>
            {this.renderFilters()}
            {this.renderPageSizeSelector()}
            {this.renderConsultaTable()}
            {this.renderPagination()}
          </div>
        )}

        {/* Formulário de edição */}
        {this.state.agendaOpen &&
          this.formAgenda(
            this.generateTimeSlots("08:00", "18:00", 30),
            this.state.dadosAgenda // ← Usar o estado atual
          )}

        {!this.state.agendaOpen && this.renderBenchmark()}
      </Main>
    );
  }
}
