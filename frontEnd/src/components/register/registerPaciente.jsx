import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "users", // Ícone mais genérico para pacientes
  title: "Cadastros",
  subtitle: "Tela de cadastro de Pacientes",
};

const baseUrl = "http://localhost:4040/pacientes"; // Base URL para pacientes (mudado para plural para consistência RESTful)

const initialState = {
  user: {
    codigop: "",
    cpf: "",
    nomep: "",
    endereco: "",
    idade: "",
    sexo: "",
    telefone: "",
  },
  list: [],
  // NOVA LÓGICA: Paginação
  pagination: {
    currentPage: 1,
    itemsPerPage: 10, // Default 10 itens por página
    totalItems: 0,
    totalPages: 1,
  },
  loading: false, // NOVA LÓGICA: Estado de carregamento
  benchmarkTimes: {
    // NOVA LÓGICA: Para exibir tempos de benchmark
    paginatedLoad: null,
    fullLoad: null,
  },
};

export default class RegisterPaciente extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadPacientes(); // NOVA LÓGICA: Renomeado para loadPacientes
  }

  // NOVA LÓGICA: Função para carregar pacientes com paginação
  loadPacientes = async (page = this.state.pagination.currentPage) => {
    this.setState({
      loading: true,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    }); // Resetar tempos

    try {
      const { itemsPerPage } = this.state.pagination;
      const startTime = performance.now(); // Início da medição
      const response = await axios.get(baseUrl, {
        params: {
          page,
          limit: itemsPerPage,
        },
      });
      const endTime = performance.now(); // Fim da medição

      this.setState({
        list: response.data.data,
        pagination: {
          currentPage: response.data.page,
          itemsPerPage: response.data.itemsPerPage, // Assegura que o itemsPerPage da API seja usado
          totalItems: response.data.total,
          totalPages: response.data.totalPages,
        },
        loading: false,
        benchmarkTimes: {
          ...this.state.benchmarkTimes,
          paginatedLoad: `${(endTime - startTime).toFixed(2)} ms`, // Tempo de carregamento paginado
        },
      });
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      alert("Erro ao carregar pacientes. Verifique o console para detalhes.");
      this.setState({ loading: false });
    }
  };

  // NOVA LÓGICA: Função para carregar todos os pacientes (para benchmark de comparação)
  loadAllPacientesForBenchmark = async () => {
    this.setState({
      loading: true,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    }); // Resetar tempos
    try {
      const startTime = performance.now(); // Início da medição
      const response = await axios.get(baseUrl, { params: { limit: 999999 } }); // Um limite bem alto para "todos"
      const endTime = performance.now(); // Fim da medição

      // Nota: Não estamos atualizando a lista principal aqui, apenas medindo
      // Isso é para simular o "custo" de carregar tudo de uma vez
      console.log(
        `Carregamento COMPLETO para benchmark: ${
          response.data.data.length
        } pacientes em ${(endTime - startTime).toFixed(2)} ms`
      );

      this.setState({
        loading: false,
        benchmarkTimes: {
          ...this.state.benchmarkTimes,
          fullLoad: `${(endTime - startTime).toFixed(2)} ms`, // Tempo de carregamento completo
        },
      });
      alert(
        "Carregamento completo para benchmark concluído. Verifique os tempos de benchmark abaixo."
      );
    } catch (error) {
      console.error(
        "Erro ao carregar todos os pacientes para benchmark:",
        error
      );
      alert("Erro ao carregar todos os pacientes para benchmark.");
      this.setState({ loading: false });
    }
  };

  clear() {
    this.setState({ user: initialState.user });
  }

  save() {
    const user = this.state.user;
    const method = user.codigop ? "put" : "post";
    // MUDANÇA NA URL para POST/PUT: baseUrl já é /pacientes, então apenas adiciona o ID para PUT
    const url = user.codigop ? `${baseUrl}/${user.codigop}` : baseUrl;

    axios[method](url, user)
      .then((resp) => {
        // A API de backend agora retorna o objeto completo do paciente salvo/atualizado
        // Recarregar a página atual da lista para refletir as mudanças
        this.clear(); // Limpa o formulário
        this.loadPacientes(this.state.pagination.currentPage); // Recarrega a página atual
      })
      .catch((error) => {
        // Captura o erro para exibir mensagens mais específicas
        console.error("Erro ao salvar paciente:", error);
        const errorMessage =
          error.response && error.response.data
            ? error.response.data // Supondo que o backend retorna { message: "..." }
            : "Erro desconhecido ao salvar paciente.";
        alert(errorMessage);
      });
  }

  // NOVA LÓGICA: getUpdatedList não é mais estritamente necessário para save,
  // pois loadPacientes recarrega a lista. Mantido para delete.
  getUpdatedList(user, add = true) {
    const list = this.state.list.filter((u) => u.codigop !== user.codigop);
    if (add) list.unshift(user);
    return list;
  }

  updateField(event) {
    const user = { ...this.state.user };
    user[event.target.name] = event.target.value;
    this.setState({ user });
  }

  load(user) {
    this.setState({ user }); // Coloca os dados do paciente no formulário para edição
  }

  remove(user) {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o paciente ${user.nomep}?`
      )
    ) {
      return;
    }
    axios
      .delete(`${baseUrl}/${user.codigop}`)
      .then(() => {
        this.loadPacientes(this.state.pagination.currentPage); // Recarrega a página atual após deletar
        alert("Paciente excluído com sucesso!");
      })
      .catch((error) => {
        // Captura o erro para exibir mensagens mais específicas
        console.error("Erro ao deletar paciente:", error);
        const errorMessage =
          error.response && error.response.data
            ? error.response.data.message // Supondo que o backend retorna { message: "..." }
            : "Erro desconhecido ao deletar paciente.";
        alert(errorMessage);
      });
  }

  renderForm() {
    // ... (Mantido como está, sem alterações diretas na renderização do formulário) ...
    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Código</label>
              <input
                type="number"
                className="form-control"
                name="codigop"
                value={this.state.user.codigop}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o código..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                className="form-control"
                name="nomep"
                value={this.state.user.nomep}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o nome..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>CPF</label>
              <input
                type="text"
                className="form-control"
                name="cpf"
                value={this.state.user.cpf}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o CPF..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Endereço</label>
              <input
                type="text"
                className="form-control"
                name="endereco"
                value={this.state.user.endereco}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o Endereço..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Idade</label>
              <input
                type="number"
                className="form-control"
                name="idade"
                value={this.state.user.idade}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite a idade..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Sexo</label>
              <select
                className="form-control"
                name="sexo"
                value={this.state.user.sexo}
                onChange={(e) => this.updateField(e)}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                className="form-control"
                name="telefone"
                value={this.state.user.telefone}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o telefone..."
              />
            </div>
          </div>
        </div>

        <hr />
        <div className="row">
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary" onClick={() => this.save()}>
              {this.state.user.codigop ? "Atualizar" : "Cadastrar"}
            </button>
            <button
              className="btn btn-secondary ml-2"
              onClick={() => this.clear()}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderTable() {
    const { list, loading } = this.state; // NOVA LÓGICA: Adiciona loading

    if (loading) {
      // NOVA LÓGICA: Exibir spinner de carregamento
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="mt-2">Carregando pacientes...</p>
        </div>
      );
    }

    if (list.length === 0) {
      // NOVA LÓGICA: Mensagem se não houver dados
      return (
        <div className="alert alert-info mt-4">Nenhum paciente cadastrado.</div>
      );
    }

    return (
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Código</th> {/* Mudado de ID para Código */}
            <th>Nome</th>
            <th>CPF</th>
            <th>Endereço</th>
            <th>Idade</th>
            <th>Sexo</th>
            <th>Telefone</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>{this.renderRows()}</tbody>
      </table>
    );
  }

  renderRows() {
    return this.state.list.map((user) => (
      <tr key={user.codigop}>
        <td>{user.codigop}</td>
        <td>{user.nomep}</td>
        <td>{user.cpf}</td>
        <td>{user.endereco}</td>
        <td>{user.idade}</td>
        <td>{user.sexo}</td>
        <td>{user.telefone}</td>
        <td>
          <button className="btn btn-warning" onClick={() => this.load(user)}>
            <i className="fa fa-pencil"></i>
          </button>
          <button
            className="btn btn-danger ml-2"
            onClick={() => this.remove(user)}
          >
            <i className="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    ));
  }

  // NOVA LÓGICA: Função para renderizar o seletor de itens por página
  renderPageSizeSelector() {
    const pageSizes = [5, 10, 20, 50]; // Opções de itens por página
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
                pagination: {
                  ...prevState.pagination,
                  itemsPerPage: parseInt(e.target.value, 10),
                  currentPage: 1, // Volta para a primeira página ao mudar o tamanho
                },
              }),
              () => this.loadPacientes(1) // Recarrega os pacientes com a nova configuração
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

  // NOVA LÓGICA: Função para renderizar a navegação da paginação
  renderPagination() {
    const { pagination } = this.state;
    const { currentPage, totalPages } = pagination;

    if (totalPages <= 1) return null; // Não mostra a paginação se houver apenas 1 página

    const pageNumbers = [];
    const maxVisiblePages = 5; // Número máximo de botões de página visíveis

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajusta o startPage se o endPage não atingir o máximo visível
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
            <button className="page-link" onClick={() => this.loadPacientes(1)}>
              Primeira
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => this.loadPacientes(currentPage - 1)}
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
                onClick={() => this.loadPacientes(number)}
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
              onClick={() => this.loadPacientes(currentPage + 1)}
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
              onClick={() => this.loadPacientes(totalPages)}
            >
              Última
            </button>
          </li>
        </ul>
        <div className="text-center">
          <small className="text-muted">
            Página {currentPage} de {totalPages} | Total de{" "}
            {this.state.pagination.totalItems} pacientes
          </small>
        </div>
      </nav>
    );
  }

  // NOVA LÓGICA: Renderizar a seção de benchmark para pacientes
  renderBenchmarkSection() {
    const { benchmarkTimes, loading } = this.state;
    return (
      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">Benchmark de Carregamento de Pacientes</h5>
          <p className="card-text">
            Compare o tempo de carregamento com e sem paginação.
          </p>
          <div className="mb-3">
            <button
              className="btn btn-info mr-2"
              onClick={() => this.loadPacientes(1)}
              disabled={loading}
            >
              Carregar Paginações ({benchmarkTimes.paginatedLoad || "N/A"})
            </button>
            <button
              className="btn btn-warning"
              onClick={this.loadAllPacientesForBenchmark}
              disabled={loading}
            >
              Carregar Tudo ({benchmarkTimes.fullLoad || "N/A"})
            </button>
          </div>
          {loading && (
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
        </div>
      </div>
    );
  }

  render() {
    return (
      <Main {...headerProps}>
        {this.renderForm()}
        {this.renderPageSizeSelector()}{" "}
        {/* Adicionado seletor de tamanho de página */}
        {this.renderTable()}
        {this.renderPagination()} {/* Adicionado controle de paginação */}
        {this.renderBenchmarkSection()} {/* Adicionado seção de benchmark */}
      </Main>
    );
  }
}
