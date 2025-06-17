import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "calendar-alt",
  title: "Gestão de Consultas",
  subtitle: "Listagem paginada de consultas",
};

// Base URL para as consultas
const baseUrl = "http://localhost:4040/"; // Deixamos assim para compatibilidade com outras rotas como benchmark/explain-query

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
    diasemana: null, // Certifique-se que existe para atualização
  },
  list: [], // Lista de médicos (para o select)
  consultas: [], // Consultas listadas na tabela
  agendaOpen: false, // Controla a exibição do formulário de edição
  horarios: [], // Horários disponíveis para seleção
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
  loading: false, // Estado geral de carregamento
  editMode: false, // Controla se está editando uma consulta existente

  // ==============================
  // ESTADOS PARA BENCHMARK
  // ==============================
  benchmarkQueryInput:
    "SELECT * FROM Consulta WHERE idMedico = [CRM_DO_MEDICO_AQUI];", // Campo para a query
  benchmarkPlan: null, // Resultado do EXPLAIN
  benchmarkLoading: false, // Loading específico para benchmark
  benchmarkResults: {
    // Para armazenar tempos antes e depois
    indexMedico: { before: null, after: null },
    indexData: { before: null, after: null },
    // Adicionar outros benchmarks aqui
  },
};

export default class Gestao extends Component {
  // Renomeado de RegisterMedico para Gestao
  state = { ...initialState };

  componentDidMount() {
    this.loadConsultas();
    this.loadMedicos(); // Carrega lista de médicos para o select do formAgenda
  }

  // NOVA FUNÇÃO: Load médicos para o select de edição
  loadMedicos = async () => {
    try {
      const response = await axios.get(`${baseUrl}medicos`); // Usa a rota /medicos
      this.setState({ list: response.data }); // list agora contém os médicos
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
    }
  };

  loadConsultas = async (page = this.state.pagination.currentPage) => {
    this.setState({ loading: true });

    try {
      const { itemsPerPage, filters } = this.state.pagination; // 'filters' está no estado principal, não em pagination
      const actualFilters = this.state.filters; // Use o objeto filters do estado

      const response = await axios.get(`${baseUrl}consultas`, {
        // MUDANÇA: Usar '/consultas'
        params: {
          page,
          limit: this.state.pagination.itemsPerPage, // Usa itemsPerPage do estado
          ...actualFilters, // Passa os filtros
        },
      });

      this.setState({
        consultas: response.data.data,
        pagination: {
          currentPage: response.data.page,
          itemsPerPage: response.data.itemsPerPage, // Pega o valor real da API
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

  handleDeleteConsulta = async (codigoConsulta) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a consulta ${codigoConsulta}?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}consultas/${codigoConsulta}`); // MUDANÇA: Usar '/consultas/:codigo'
      alert("Consulta excluída com sucesso!");
      this.loadConsultas(this.state.pagination.currentPage);
    } catch (error) {
      console.error("Erro ao deletar consulta:", error);
      const errorMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Erro ao deletar consulta. Verifique o console para detalhes.";
      alert(errorMessage);
    }
  };

  applyFilters = () => {
    this.loadConsultas(1);
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

  handleEdit = (consulta) => {
    const dataConsulta = new Date(consulta.data);
    const diasemana = dataConsulta.getDay();

    const dadosConsulta = {
      codigo: consulta.codigo,
      data: this.formatDateForInput(consulta.data), // Formatar para input de data
      horainic: consulta.horainic,
      horafim: consulta.horafim,
      idpaciente: consulta.idpaciente,
      idespecial: consulta.idespecial,
      idmedico: consulta.idmedico,
      valorpago: consulta.valorpago,
      pagou: consulta.pagou,
      formapagamento: consulta.formapagamento,
      diasemana: diasemana,
    };

    this.setState({
      dadosAgenda: dadosConsulta,
      editMode: true, // Ativa o modo de edição
      agendaOpen: true, // Abre o formulário de edição
    });
  };

  cancelEdit = () => {
    this.clear();
  };

  clear = () => {
    this.setState({
      dadosAgenda: initialState.dadosAgenda,
      agendaOpen: false,
      editMode: false,
    });
  };

  save = async () => {
    // Usar async/await
    const dadosAgenda = this.state.dadosAgenda;

    // Validações básicas
    if (!dadosAgenda.codigo) {
      alert("Código da consulta é obrigatório.");
      return;
    }
    if (!dadosAgenda.idpaciente || !dadosAgenda.idmedico) {
      alert("Paciente e médico são obrigatórios.");
      return;
    }
    if (!dadosAgenda.data || !dadosAgenda.horainic || !dadosAgenda.horafim) {
      alert("Data e horários são obrigatórios.");
      return;
    }

    // MUDANÇA: Usar PUT para atualização, a rota é /consultas/:codigo
    const url = `${baseUrl}consultas/${dadosAgenda.codigo}`;
    const method = "put"; // Sempre PUT para salvar edições aqui

    try {
      const resp = await axios({
        method: method,
        url: url,
        data: dadosAgenda, // Envia dadosAgenda diretamente, sem 'dadosAgenda:' aninhado
      });
      console.log("Resultado da atualização:", resp.data);
      alert("Consulta alterada com sucesso!");
      this.clear();
      this.loadConsultas(this.state.pagination.currentPage);
    } catch (error) {
      console.error(
        "Erro na requisição:",
        (error.response && error.response.data) || error.message
      );
      const errorMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Erro ao atualizar consulta. Verifique o console para detalhes.";
      alert(`Erro: ${errorMessage}`);
    }
  };

  updateFieldAgenda = (event) => {
    const dadosAgenda = { ...this.state.dadosAgenda };
    const { name, value } = event.target;

    if (name === "pagou") {
      dadosAgenda[name] = value === "true"; // Converte para boolean
    } else if (name === "valorpago") {
      dadosAgenda[name] = value === "" ? "" : parseFloat(value) || 0;
    } else {
      dadosAgenda[name] = value;
    }

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
                <label>Código da Consulta</label>{" "}
                {/* Adicionado filtro por código */}
                <input
                  type="number"
                  className="form-control"
                  name="codigo"
                  value={filters.codigo}
                  onChange={this.handleFilterChange}
                  placeholder="Código da consulta"
                />
              </div>
            </div>
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

            <div className="col-md-12 d-flex align-items-end justify-content-end">
              {" "}
              {/* Ajustado para botões à direita */}
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
              (prevState) => ({
                // Usar prevState para setState aninhado
                pagination: {
                  ...prevState.pagination,
                  itemsPerPage: parseInt(e.target.value, 10), // Garante que é um número
                  currentPage: 1,
                },
              }),
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

  // formMedicoAgenda() { foi removido, pois a edição agora é direta da tabela }

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
                    {this.state.list.map(
                      (
                        med // this.state.list deve ter os médicos
                      ) => (
                        <option key={med.crm} value={med.crm}>
                          {med.nomem}
                        </option>
                      )
                    )}
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
                    type="number" // Código do paciente deve ser número
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
                    type="number" // Código da especialidade deve ser número
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
                    value={
                      dados.pagou !== undefined ? dados.pagou.toString() : ""
                    } // Converte boolean para string
                    name="pagou"
                    onChange={this.updateFieldAgenda}
                  >
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
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
                    className="btn btn-sm btn-primary mr-2"
                    onClick={() => this.handleEdit(consulta)}
                    disabled={this.state.agendaOpen}
                  >
                    <i className="fa fa-edit"></i> Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
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

  // NOVO MÉTODO PARA RENDERIZAR BENCHMARKS ESPECÍFICOS
  renderSpecificBenchmark(
    title,
    description,
    queryTemplate,
    indexCreationEndpoint,
    benchmarkResultKey,
    placeholderValue
  ) {
    const { benchmarkLoading, benchmarkResults } = this.state;
    const currentResult = benchmarkResults[benchmarkResultKey];
    // console.log para debug: console.log(`currentResult para ${benchmarkResultKey}:`, currentResult);

    const { before, after } = currentResult || { before: null, after: null };

    return (
      <div className="card mt-3">
        <div className="card-body">
          <h5 className="card-title">{title}</h5>
          <p className="card-text">{description}</p>
          <div className="form-group">
            <label>Valor para a consulta (ex: CRM do médico)</label>
            <input
              type="text"
              className="form-control"
              value={this.state[`${benchmarkResultKey}Value`] || ""}
              onChange={(e) =>
                this.setState({
                  [`${benchmarkResultKey}Value`]: e.target.value,
                })
              }
              placeholder={placeholderValue}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button
                className="btn btn-info mr-2"
                onClick={() =>
                  this.runSpecificBenchmark(
                    queryTemplate,
                    benchmarkResultKey,
                    "before"
                  )
                }
                disabled={benchmarkLoading}
              >
                EXPLAIN (Sem Índice)
              </button>
              <button
                className="btn btn-success"
                onClick={() =>
                  this.createSpecificIndex(
                    indexCreationEndpoint,
                    benchmarkResultKey
                  )
                }
                disabled={benchmarkLoading}
              >
                Criar Índice
              </button>
            </div>
            <div>
              <button
                className="btn btn-warning"
                onClick={() =>
                  this.runSpecificBenchmark(
                    queryTemplate,
                    benchmarkResultKey,
                    "after"
                  )
                }
                // ALTERAÇÃO AQUI: Substitua `?.` por `&&`
                disabled={
                  benchmarkLoading || !(currentResult && currentResult.after)
                }
              >
                EXPLAIN (Com Índice)
              </button>
            </div>
          </div>

          {benchmarkLoading && (
            <div className="text-center mt-3">
              <div
                className="spinner-border spinner-border-sm text-secondary"
                role="status"
              >
                <span className="sr-only">Carregando...</span>
              </div>
              <small className="ml-2">Executando benchmark...</small>
            </div>
          )}

          {before && (
            <div className="mt-3">
              <h6>Resultado Sem Índice:</h6>
              <pre className="bg-light p-2 small">
                Execution Time: {before.executionTime} ms
                <br />
                Planning Time: {before.planningTime} ms
                {/* ALTERAÇÃO AQUI: Substitua `?.` por `&&` */}
                <br />
                Nodes:{" "}
                {(before && before.Plan && before.Plan["Node Type"]) || "N/A"}
              </pre>
            </div>
          )}
          {after && (
            <div className="mt-3">
              <h6>Resultado Com Índice:</h6>
              <pre className="bg-light p-2 small">
                Execution Time: {after.executionTime} ms
                <br />
                Planning Time: {after.planningTime} ms
                {/* ALTERAÇÃO AQUI: Substitua `?.` por `&&` */}
                <br />
                Nodes:{" "}
                {(after && after.Plan && after.Plan["Node Type"]) || "N/A"}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Função genérica para executar benchmarks específicos
  runSpecificBenchmark = async (queryTemplate, benchmarkResultKey, type) => {
    this.setState({ benchmarkLoading: true });
    const value = this.state[`${benchmarkResultKey}Value`];
    if (!value) {
      alert(
        `Por favor, insira um valor para a consulta de ${benchmarkResultKey}.`
      );
      this.setState({ benchmarkLoading: false });
      return;
    }

    const query = queryTemplate.replace("[VALUE]", value);

    try {
      const response = await axios.get(`${baseUrl}benchmark/explain-query`, {
        params: { query },
      });
      const plan = response.data.plan;

      const executionTime = plan["Execution Time"] || 0;
      const planningTime = plan["Planning Time"] || 0;

      this.setState((prevState) => ({
        benchmarkResults: {
          ...prevState.benchmarkResults,
          [benchmarkResultKey]: {
            ...prevState.benchmarkResults[benchmarkResultKey],
            [type]: {
              ...plan, // Armazena o plano completo se quiser exibir mais detalhes
              executionTime,
              planningTime,
            },
          },
        },
        benchmarkLoading: false,
      }));
      alert(
        `Benchmark '${type}' para ${benchmarkResultKey} executado com sucesso!`
      );
    } catch (err) {
      console.error(
        `Erro ao executar benchmark para ${benchmarkResultKey} (${type}):`,
        // ALTERAÇÃO AQUI: Substitua `?.` por `&&`
        (err.response && err.response.data) || err.message
      );
      alert(
        `Erro ao executar benchmark para ${benchmarkResultKey}. Verifique o console para detalhes.`
      );
      this.setState({ benchmarkLoading: false });
    }
  };
  // Função genérica para criar índices específicos
  createSpecificIndex = async (indexCreationEndpoint, benchmarkResultKey) => {
    this.setState({ benchmarkLoading: true });
    try {
      await axios.post(`${baseUrl}${indexCreationEndpoint}`);
      alert(`Índice para ${benchmarkResultKey} criado com sucesso!`);
      this.setState({ benchmarkLoading: false });
    } catch (err) {
      console.error(
        `Erro ao criar índice para ${benchmarkResultKey}:`,
        (err.response && err.response.data) || err.message
      );
      alert(
        `Erro ao criar índice para ${benchmarkResultKey}. Verifique o console para detalhes.`
      );
      this.setState({ benchmarkLoading: false });
    }
  };

  renderBenchmarkSection() {
    return (
      <div className="card mt-5">
        <div className="card-header">
          <h5>Demonstrações de Otimização e Performance</h5>
          <p className="text-muted">
            Utilize as ferramentas abaixo para observar o impacto de índices e a
            paginação.
          </p>
        </div>
        <div className="card-body">
          {/* Benchmark de Paginação (referente à tabela principal de consultas) */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">
                Custo da Paginação vs. Carregamento Completo
              </h5>
              <p className="card-text">
                A tabela acima já utiliza paginação. Para demonstrar o ganho,
                clique em "Carregar Tudo" (não recomendado para muitos
                registros) e compare com o carregamento paginado.
              </p>
              <button
                className="btn btn-info mr-2"
                onClick={() => this.loadConsultas(1)}
                disabled={this.state.loading}
              >
                Recarregar Páginado
              </button>
              <button
                className="btn btn-warning"
                onClick={this.loadAllConsultasForBenchmark}
                disabled={this.state.loading}
              >
                Carregar Tudo (para Benchmark)
              </button>
              {this.state.loading && (
                <div className="text-center mt-3">
                  <div
                    className="spinner-border spinner-border-sm text-secondary"
                    role="status"
                  >
                    <span className="sr-only">Carregando...</span>
                  </div>
                  <small className="ml-2">
                    Executando carregamento completo...
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Chamada para o benchmark do idMedico */}
          {this.renderSpecificBenchmark(
            "Otimização por ID do Médico",
            "Compara o desempenho de buscar consultas por ID do Médico antes e depois de criar um índice em 'idMedico'.",
            "SELECT * FROM Consulta WHERE idMedico = [VALUE];",
            "benchmark/create-index-medico",
            "indexMedico",
            "Ex: CRM de um médico com muitas consultas"
          )}

          {/* Chamada para o benchmark de Data */}
          {this.renderSpecificBenchmark(
            "Otimização por Data da Consulta",
            "Compara o desempenho de buscar consultas por Data antes e depois de criar um índice em 'DATA'.",
            "SELECT * FROM Consulta WHERE DATA = '[VALUE]';",
            "benchmark/create-index-data",
            "indexData",
            "Ex: 2023-05-15 (formato YYYY-MM-DD)"
          )}

          {/* Chamada para popular consultas */}
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">
                Popular Tabela de Consultas (100K registros)
              </h5>
              <p className="card-text">
                Utilize este botão APENAS para popular a tabela 'Consulta' com
                100.000 registros para testes de desempenho. Certifique-se de
                que há pacientes, médicos e especialidades cadastrados.
              </p>
              <button
                className="btn btn-danger"
                onClick={this.populateConsultasForBenchmark}
                disabled={this.state.benchmarkLoading}
              >
                Popular 100K Consultas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NOVA FUNÇÃO: Para carregar todas as consultas (benchmark)
  loadAllConsultasForBenchmark = async () => {
    this.setState({ loading: true }); // Usar o loading geral

    try {
      const startTime = performance.now();
      // Chamar a rota de consultas com um limite altíssimo
      const response = await axios.get(`${baseUrl}consultas`, {
        params: { limit: 99999999 },
      });
      const endTime = performance.now();

      const timeTaken = (endTime - startTime).toFixed(2);
      alert(
        `Carregamento COMPLETO de ${response.data.data.length} consultas concluído em ${timeTaken} ms.`
      );
      console.log(
        `Carregamento COMPLETO de ${response.data.data.length} consultas concluído em ${timeTaken} ms.`
      );

      this.setState({ loading: false });
    } catch (error) {
      console.error(
        "Erro ao carregar todas as consultas para benchmark:",
        error
      );
      alert(
        "Erro ao carregar todas as consultas para benchmark. Verifique o console."
      );
      this.setState({ loading: false });
    }
  };

  // NOVA FUNÇÃO: Para popular consultas
  populateConsultasForBenchmark = async () => {
    if (
      !window.confirm(
        "Isso irá inserir 100.000 registros na tabela de Consultas. Confirma?"
      )
    ) {
      return;
    }
    this.setState({ benchmarkLoading: true });
    try {
      const response = await axios.post(
        `${baseUrl}benchmark/populate-consultas`,
        { numRecords: 100000 }
      );
      alert(response.data.message);
      this.setState({ benchmarkLoading: false });
      this.loadConsultas(1); // Recarregar a lista após popular
    } catch (error) {
      console.error(
        "Erro ao popular consultas:",
        (error.response && error.response.data) || error.message
      );
      alert(
        `Erro ao popular consultas: ${
          (error.response &&
            error.response.data &&
            error.response.data.details) ||
          error.message
        }`
      );
      this.setState({ benchmarkLoading: false });
    }
  };

  render() {
    // MUDANÇA: A seção de benchmark agora é um componente separado, não depende de agendaOpen
    return (
      <Main {...headerProps}>
        {/* Formulário de edição, só visível se agendaOpen for true */}
        {this.state.agendaOpen &&
          this.formAgenda(
            this.generateTimeSlots("08:00", "18:00", 30),
            this.state.dadosAgenda
          )}

        {/* Listagem de consultas e filtros, visível se agendaOpen for false */}
        {!this.state.agendaOpen && (
          <div>
            {this.renderFilters()}
            {this.renderPageSizeSelector()}
            {this.renderConsultaTable()}
            {this.renderPagination()}
          </div>
        )}

        {/* Seção de Benchmark sempre visível (ou pode adicionar um toggle) */}
        {this.renderBenchmarkSection()}
      </Main>
    );
  }
}
