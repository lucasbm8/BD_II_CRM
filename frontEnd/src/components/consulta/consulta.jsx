import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "calendar-check", // Ícone mais adequado
  title: "Agendamento de Consultas",
  subtitle: "Tela para marcação de novas consultas",
};

// Base URL para as operações RESTful
const baseUrl = "http://localhost:4040/"; // Mantenho a base para que você possa usar '/medicos', '/consultas'
const controllers = {
  // Renomeado para plural, conforme as novas rotas
  medicos: "medicos",
  consultas: "consultas", // Nova rota padrão para agendamento e CRUD de consultas
  populateConsultas: "benchmark/populate-consultas", // Para a função de popular, se desejar manter
};

const initialState = {
  // med e dadosAgenda com nomes de campo alinhados ao DB e API
  dadosAgenda: {
    codigo: "", // Será gerado pelo backend em `addConsulta`
    data: "",
    horainic: "",
    horafim: "",
    idpaciente: "",
    idespecial: "",
    idmedico: "", // Agora é idmedico, não crm
    valorpago: "",
    pagou: false,
    formapagamento: "",
    diasemana: "", // Dia da semana para a tabela Agenda
  },
  list: [], // Lista de médicos
  agendaOpen: false, // Controla a exibição do formulário de agendamento
  horariosDisponiveis: [], // Horários disponíveis para o médico e data selecionados
  loadingMedicos: false, // Novo estado para loading de médicos
  loadingAgenda: false, // Novo estado para loading da agenda
  // Adicionar um estado para mensagens de erro ou sucesso
  errorMessage: null,
  successMessage: null,
};

export default class AgendarConsulta extends Component {
  // Renomeado para clareza
  state = { ...initialState };

  // Use componentDidMount para requisições assíncronas
  componentDidMount() {
    this.loadMedicos();
  }

  // Carrega a lista de médicos
  loadMedicos = async () => {
    //
    this.setState({ loadingMedicos: true, errorMessage: null });
    try {
      // Requisição para a API de médicos.
      // Adicionar params: { limit: 999999 } para garantir que todos os médicos sejam retornados
      // e não apenas os 10 primeiros da paginação padrão.
      const response = await axios.get(`${baseUrl}${controllers.medicos}`, {
        params: { limit: 999999 },
      });
      this.setState({
        // Acessar resp.data.data, pois a API retorna um objeto paginado
        list: response.data.data, //
        loadingMedicos: false,
      });
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
      this.setState({
        loadingMedicos: false,
        errorMessage: "Erro ao carregar lista de médicos.",
      });
    }
  };

  // Geração de Time Slots (Mantido, mas sem a lógica de 'intervals' por enquanto)
  // A lógica de horários ocupados precisaria de uma API no backend para buscar consultas existentes
  // para um dado médico e data. Por ora, apenas gera slots.
  generateTimeSlots(startTime, endTime, interval) {
    let timeSlots = [];
    let start = new Date(`1970-01-01T${startTime}:00`);
    let end = new Date(`1970-01-01T${endTime}:00`);

    while (start <= end) {
      let hours = start.getHours().toString().padStart(2, "0");
      let minutes = start.getMinutes().toString().padStart(2, "0");
      timeSlots.push(`${hours}:${minutes}:00`); // Formato HH:MM:SS para o DB
      start.setMinutes(start.getMinutes() + interval);
    }
    return timeSlots;
  }

  // Limpa o formulário
  clear = () => {
    // Usar arrow function
    this.setState({ ...initialState, list: this.state.list }); // Mantém a lista de médicos carregada
  };

  // Lógica para Agendar Consulta
  save = async () => {
    // Usar async/await e arrow function
    const { dadosAgenda } = this.state;

    // Validações básicas antes de enviar
    if (
      !dadosAgenda.data ||
      !dadosAgenda.horainic ||
      !dadosAgenda.horafim ||
      !dadosAgenda.idpaciente ||
      !dadosAgenda.idespecial ||
      !dadosAgenda.idmedico ||
      dadosAgenda.valorpago === "" ||
      dadosAgenda.pagou === "" ||
      !dadosAgenda.formapagamento ||
      !dadosAgenda.diasemana
    ) {
      alert(
        "Por favor, preencha todos os campos obrigatórios para agendar a consulta."
      );
      return;
    }

    this.setState({
      loadingAgenda: true,
      errorMessage: null,
      successMessage: null,
    });

    try {
      // A rota para agendar é POST /consultas
      const response = await axios.post(
        `${baseUrl}${controllers.consultas}`,
        dadosAgenda
      );

      this.setState({
        loadingAgenda: false,
        successMessage: `Consulta agendada com sucesso! Código da consulta: ${response.data.consulta.codigo}`,
      });
      alert(
        `Consulta agendada com sucesso! Código: ${response.data.consulta.codigo}`
      );
      this.clear(); // Limpa o formulário após sucesso
    } catch (error) {
      console.error(
        "Erro ao agendar consulta:",
        (error.response && error.response.data) || error.message
      );
      this.setState({
        loadingAgenda: false,
        errorMessage:
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          "Erro desconhecido ao agendar consulta.",
      });
      alert(`Erro ao agendar consulta: ${this.state.errorMessage}`);
    }
  };

  // Atualiza os campos do formulário de agendamento
  updateFieldAgenda = (event) => {
    // Usar arrow function
    const dadosAgenda = { ...this.state.dadosAgenda };
    const { name, value } = event.target;

    // Trata conversões de tipo
    if (name === "pagou") {
      dadosAgenda[name] = value === "true"; // Converte para boolean
    } else if (name === "valorpago") {
      dadosAgenda[name] = value === "" ? "" : parseFloat(value) || 0;
    } else if (
      name === "idpaciente" ||
      name === "idespecial" ||
      name === "idmedico"
    ) {
      dadosAgenda[name] = parseInt(value) || ""; // Converte para int
    } else {
      dadosAgenda[name] = value;
    }

    // Se a data mudou, recalcular o dia da semana para a agenda
    if (name === "data" && value) {
      const date = new Date(value);
      dadosAgenda.diasemana = date.getDay().toString(); // Salva o índice numérico do dia
    }
    this.setState({ dadosAgenda });
  };

  // Renderiza o formulário de seleção de médico e data
  renderFormMedicoAgenda() {
    const { dadosAgenda, loadingMedicos, errorMessage } = this.state;
    return (
      <div className="form card p-4">
        <h5 className="card-title mb-4">1. Selecione a Data e o Médico</h5>
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Data</label>
              <input
                type="date"
                className="form-control"
                name="data"
                value={dadosAgenda.data}
                onChange={this.updateFieldAgenda}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Médico:</label>
              {loadingMedicos ? (
                <div className="text-center">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  ></div>
                  <small className="ml-2">Carregando médicos...</small>
                </div>
              ) : errorMessage ? (
                <div className="alert alert-danger p-2 small">
                  {errorMessage}
                </div>
              ) : (
                <select
                  className="form-control"
                  name="idmedico"
                  value={dadosAgenda.idmedico}
                  onChange={this.updateFieldAgenda}
                >
                  <option value="">Selecione um médico</option>
                  {this.state.list.map((med) => (
                    <option key={med.crm} value={med.crm}>
                      {med.nomem} (CRM: {med.crm})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-end">
            <button
              className="btn btn-primary"
              onClick={this.handleOpenAgendaForm}
              disabled={
                !dadosAgenda.data || !dadosAgenda.idmedico || loadingMedicos
              }
            >
              Avançar para Agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NOVA FUNÇÃO: Handler para abrir o segundo formulário de agendamento
  handleOpenAgendaForm = () => {
    // Gera os horários disponíveis (por enquanto, todos os slots possíveis)
    const listHorarios = this.generateTimeSlots("08:00:00", "18:00:00", 30); // Horas completas
    this.setState({
      agendaOpen: true,
      horariosDisponiveis: listHorarios,
    });
    // Em um sistema real, aqui você faria uma chamada API para
    // buscar horários *reais* disponíveis para o médico e data selecionados.
    // Por exemplo: axios.get(`${baseUrl}agendas/disponibilidade`, { params: { idMedico: dadosAgenda.idmedico, data: dadosAgenda.data } });
  };

  // Renderiza o formulário de agendamento detalhado
  renderFormAgendaDetalhes() {
    const {
      dadosAgenda,
      horariosDisponiveis,
      loadingAgenda,
      errorMessage,
      successMessage,
    } = this.state;
    return (
      <div className="card mt-4 p-4">
        <h5 className="card-title mb-4">2. Detalhes da Consulta</h5>
        {errorMessage && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        <div className="form">
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Código Paciente</label>
                <input
                  type="number" // Mudar para number
                  className="form-control"
                  name="idpaciente"
                  value={dadosAgenda.idpaciente}
                  onChange={this.updateFieldAgenda}
                  placeholder="Digite o código do paciente..."
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Código Especialidade</label>
                <input
                  type="number" // Mudar para number
                  className="form-control"
                  name="idespecial"
                  value={dadosAgenda.idespecial}
                  onChange={this.updateFieldAgenda}
                  placeholder="Digite o código da especialidade..."
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Horário Início</label>
                <select
                  className="form-control"
                  name="horainic"
                  value={dadosAgenda.horainic}
                  onChange={this.updateFieldAgenda}
                >
                  <option value="">Selecione</option>
                  {horariosDisponiveis.map((hora) => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Horário Fim</label>
                <select
                  className="form-control"
                  name="horafim"
                  value={dadosAgenda.horafim}
                  onChange={this.updateFieldAgenda}
                >
                  <option value="">Selecione</option>
                  {horariosDisponiveis.map((hora) => (
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
                <label>Valor a Pagar (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="valorpago"
                  value={dadosAgenda.valorpago}
                  onChange={this.updateFieldAgenda}
                  placeholder="Ex: 150.00"
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Pagou</label>
                <select
                  className="form-control"
                  name="pagou"
                  value={dadosAgenda.pagou.toString()} // Para controlar boolean em select
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
                  type="text"
                  className="form-control"
                  name="formapagamento"
                  value={dadosAgenda.formapagamento}
                  onChange={this.updateFieldAgenda}
                  placeholder="Ex: Cartão, Dinheiro, Pix"
                />
              </div>
            </div>
          </div>

          <hr />
          <div className="row">
            <div className="col-12 d-flex justify-content-end">
              <button className="btn btn-secondary mr-2" onClick={this.clear}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={this.save}
                disabled={loadingAgenda}
              >
                {loadingAgenda ? "Agendando..." : "Agendar Consulta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Funções de crescimento de tabela e agendamento em lote (manter separadas para uso de benchmark)
  generateRandomDate() {
    const day = Math.floor(Math.random() * 28) + 1;
    const month = Math.floor(Math.random() * 12) + 1;
    const year = Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900;
    return `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`; // Formato YYYY-MM-DD
  }

  // Método para popular consultas em massa
  crescimentoTabela = async (numRecords = 5000) => {
    const confirmPopulate = window.confirm(
      `Isso irá inserir ${numRecords} registros na tabela de Consultas. Confirma?`
    );
    if (!confirmPopulate) return;

    this.setState({
      loadingAgenda: true,
      errorMessage: null,
      successMessage: null,
    });
    try {
      // A rota para popular é POST /benchmark/populate-consultas
      const response = await axios.post(
        `${baseUrl}${controllers.populateConsultas}`,
        { numRecords }
      );
      this.setState({
        loadingAgenda: false,
        successMessage: response.data.message,
      });
      alert(response.data.message);
    } catch (error) {
      console.error(
        "Erro ao popular consultas:",
        (error.response && error.response.data) || error.message
      );
      this.setState({
        loadingAgenda: false,
        errorMessage:
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          "Erro ao popular consultas.",
      });
      alert(`Erro ao popular consultas: ${this.state.errorMessage}`);
    }
  };

  render() {
    return (
      <Main {...headerProps}>
        {/* Exibe o primeiro formulário de seleção de médico/data */}
        {!this.state.agendaOpen && this.renderFormMedicoAgenda()}

        {/* Exibe o formulário detalhado de agendamento se agendaOpen for true */}
        {this.state.agendaOpen && this.renderFormAgendaDetalhes()}

        {/* Botão para popular a tabela de consultas em massa, útil para benchmark */}
        <div className="card mt-4 p-4">
          <h5 className="card-title">
            Ferramentas de Desenvolvimento e Benchmark
          </h5>
          <button
            className="btn btn-danger"
            onClick={() => this.crescimentoTabela(100000)} // Popula 100k
            disabled={this.state.loadingAgenda}
          >
            Popular Tabela de Consultas (100.000 registros)
          </button>
          {this.state.loadingAgenda && (
            <div className="text-center mt-3">
              <div
                className="spinner-border spinner-border-sm text-secondary"
                role="status"
              ></div>
              <small className="ml-2">Executando operação em massa...</small>
            </div>
          )}
        </div>
      </Main>
    );
  }
}
