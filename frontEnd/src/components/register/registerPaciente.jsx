import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "users",
  title: "Cadastros",
  subtitle: "Tela de cadastro de Pacientes",
};

const baseUrl = "http://localhost:4040/pacientes"; // Base URL para pacientes

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
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
  },
  loading: false,
  benchmarkTimes: {
    paginatedLoad: null,
    fullLoad: null,
  },
  isEditing: false, // <-- NOVA LÓGICA: Estado para controlar o modo de edição
};

export default class RegisterPaciente extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadPacientes();
  }

  loadPacientes = async (page = this.state.pagination.currentPage) => {
    this.setState({
      loading: true,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    });

    try {
      const { itemsPerPage } = this.state.pagination;
      const startTime = performance.now();
      const response = await axios.get(baseUrl, {
        params: {
          page,
          limit: itemsPerPage,
        },
      });
      const endTime = performance.now();

      this.setState({
        list: response.data.data,
        pagination: {
          currentPage: response.data.page,
          itemsPerPage: response.data.itemsPerPage,
          totalItems: response.data.total,
          totalPages: response.data.totalPages,
        },
        loading: false,
        benchmarkTimes: {
          ...this.state.benchmarkTimes,
          paginatedLoad: `${(endTime - startTime).toFixed(2)} ms`,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      alert("Erro ao carregar pacientes. Verifique o console para detalhes.");
      this.setState({ loading: false });
    }
  };

  loadAllPacientesForBenchmark = async () => {
    this.setState({
      loading: true,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    });
    try {
      const startTime = performance.now();
      const response = await axios.get(baseUrl, { params: { limit: 999999 } });
      const endTime = performance.now();

      console.log(
        `Carregamento COMPLETO para benchmark: ${
          response.data.data.length
        } pacientes em ${(endTime - startTime).toFixed(2)} ms`
      );

      this.setState({
        loading: false,
        benchmarkTimes: {
          ...this.state.benchmarkTimes,
          fullLoad: `${(endTime - startTime).toFixed(2)} ms`,
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
    this.setState({ user: initialState.user, isEditing: false }); // <-- Reseta isEditing para false
  }

  save() {
    const user = this.state.user;
    // MUDANÇA CRÍTICA: Usa o estado `isEditing` para determinar o método
    const method = this.state.isEditing ? "put" : "post";
    const url = this.state.isEditing ? `${baseUrl}/${user.codigop}` : baseUrl;

    axios[method](url, user)
      .then((resp) => {
        this.clear(); // Limpa o formulário e reseta isEditing
        this.loadPacientes(this.state.pagination.currentPage);
        alert(
          `Paciente ${
            method === "post" ? "cadastrado" : "atualizado"
          } com sucesso!`
        ); // Mensagem mais específica
      })
      .catch((error) => {
        console.error("Erro ao salvar paciente:", error);
        const errorMessage =
          error.response && error.response.data
            ? error.response.data.message || JSON.stringify(error.response.data) // Tenta pegar a mensagem ou stringify
            : "Erro desconhecido ao salvar paciente.";
        alert(`Erro: ${errorMessage}`); // Mensagem de erro mais clara
      });
  }

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

  // MUDANÇA CRÍTICA: Define isEditing para true quando um paciente é carregado para edição
  load(user) {
    this.setState({ user, isEditing: true }); // <-- Ativa o modo de edição
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
        this.loadPacientes(this.state.pagination.currentPage);
        alert("Paciente excluído com sucesso!");
      })
      .catch((error) => {
        console.error("Erro ao deletar paciente:", error);
        const errorMessage =
          error.response && error.response.data
            ? error.response.data.message
            : "Erro desconhecido ao deletar paciente.";
        alert(`Erro: ${errorMessage}`);
      });
  }

  renderForm() {
    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Código</label>
              <input
                type="number" // Mantém como number
                className="form-control"
                name="codigop"
                value={this.state.user.codigop}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o código..."
                // DESABILITA o campo código se estiver editando um paciente existente
                disabled={this.state.isEditing} // <-- NOVA LÓGICA: Desabilita edição de código
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
              {/* MUDANÇA: O texto do botão agora depende de `isEditing` */}
              {this.state.isEditing ? "Atualizar" : "Cadastrar"}
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
    // ... (Mantido como está) ...
    const { list, loading } = this.state;

    if (loading) {
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
      return (
        <div className="alert alert-info mt-4">Nenhum paciente cadastrado.</div>
      );
    }

    return (
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Código</th>
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
    // ... (Mantido como está) ...
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

  renderPageSizeSelector() {
    // ... (Mantido como está) ...
    const pageSizes = [5, 10, 20, 50];
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
                  currentPage: 1,
                },
              }),
              () => this.loadPacientes(1)
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

  renderPagination() {
    // ... (Mantido como está) ...
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
        {this.renderPageSizeSelector()}
        {this.renderTable()}
        {this.renderPagination()}
        {this.renderBenchmarkSection()}
      </Main>
    );
  }
}
