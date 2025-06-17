import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "fa fa-user-md",
  title: "Cadastros",
  subtitle: "Tela de cadastro de Médicos",
};

const baseUrl = "http://localhost:4040/medicos"; // URL mais específica
const initialState = {
  user: {
    nomem: "",
    crm: "",
    telefone: "",
    percentual: "",
    especialidade: "", // Código da especialidade
  },
  list: [],
  loading: false,
  error: null,
  editar: false, // Controle de modo de edição
  originalCrm: null, // Para guardar o CRM original na edição
  // NOVA LÓGICA: Paginação
  pagination: {
    currentPage: 1,
    itemsPerPage: 10, // Default 10 itens por página
    totalItems: 0,
    totalPages: 1,
  },
  // NOVA LÓGICA: Para exibir tempos de benchmark
  benchmarkTimes: {
    paginatedLoad: null,
    fullLoad: null,
  },
};

export default class RegisterMedico extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadMedicos(); // Carrega a primeira página por padrão
  }

  // NOVA LÓGICA: Função para carregar médicos com paginação
  loadMedicos = async (page = this.state.pagination.currentPage) => {
    this.setState({
      loading: true,
      error: null,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    });

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

      const medicos = response.data.data || []; // A API agora retorna data: []

      this.setState({
        list: medicos,
        pagination: {
          currentPage: response.data.page,
          itemsPerPage: response.data.itemsPerPage,
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
      console.error("Erro ao buscar médicos:", error);
      this.setState({
        loading: false,
        error: "Não foi possível carregar os médicos.",
      });
    }
  };

  // NOVA LÓGICA: Função para carregar todos os médicos (para benchmark de comparação)
  loadAllMedicosForBenchmark = async () => {
    this.setState({
      loading: true,
      benchmarkTimes: {
        ...this.state.benchmarkTimes,
        paginatedLoad: null,
        fullLoad: null,
      },
    });
    try {
      const startTime = performance.now(); // Início da medição
      const response = await axios.get(baseUrl, { params: { limit: 999999 } }); // Limite bem alto para "todos"
      const endTime = performance.now(); // Fim da medição

      console.log(
        `Carregamento COMPLETO para benchmark: ${
          response.data.data.length
        } médicos em ${(endTime - startTime).toFixed(2)} ms`
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
      console.error("Erro ao carregar todos os médicos para benchmark:", error);
      alert("Erro ao carregar todos os médicos para benchmark.");
      this.setState({ loading: false });
    }
  };

  clear() {
    this.setState({
      user: initialState.user,
      editar: false,
      originalCrm: null,
    });
  }

  save() {
    const user = this.state.user;
    const method = this.state.editar ? "put" : "post";

    const url = this.state.editar
      ? `${baseUrl}/${this.state.originalCrm}`
      : baseUrl;

    axios({
      method: method,
      url: url,
      data: { dados: user },
    })
      .then((resp) => {
        alert("Médico salvo com sucesso!");
        this.clear();
        this.loadMedicos(this.state.pagination.currentPage); // Recarrega a página atual
      })
      .catch((error) => {
        // Captura o erro para exibir mensagens mais específicas
        console.error(
          "Erro ao salvar médico:",
          (error.response && error.response.data) || error.message
        );
        const errorMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          "Erro desconhecido ao salvar médico.";
        alert(`Erro: ${errorMessage}`);
      });
  }

  // getUpdatedList não é mais estritamente necessário, pois loadMedicos recarrega a lista.
  // Pode ser removido se não for usado em mais nenhum lugar.
  getUpdatedList(user, add = true) {
    const list = this.state.list.filter((u) => u.crm !== user.crm);
    if (add) {
      list.unshift(user);
    }
    return list;
  }

  updateField(event) {
    const user = { ...this.state.user };
    user[event.target.name] = event.target.value;
    this.setState({ user });
  }

  renderForm() {
    const { user, loading, editar } = this.state; // Adicione 'editar' à desestruturação

    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                className="form-control"
                name="nomem"
                value={user.nomem}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o nome completo..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>CRM *</label>
              <input
                type="text"
                className="form-control"
                name="crm"
                value={user.crm}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o CRM..."
                disabled={loading || editar} // Desabilita o CRM na edição
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                className="form-control"
                name="telefone"
                value={user.telefone}
                onChange={(e) => this.updateField(e)}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Percentual (%)</label>
              <input
                type="number"
                className="form-control"
                name="percentual"
                value={user.percentual}
                onChange={(e) => this.updateField(e)}
                placeholder="Ex: 30"
                min="0"
                max="100"
                disabled={loading}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Código da Especialidade</label>
              <input
                type="text"
                className="form-control"
                name="especialidade"
                value={user.especialidade}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o código da especialidade..."
                disabled={loading}
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
              disabled={this.state.loading}
            >
              {this.state.loading
                ? "Salvando..."
                : this.state.editar // Usa 'editar' para determinar o texto do botão
                ? "Atualizar"
                : "Cadastrar"}
            </button>

            <button
              className="btn btn-secondary ml-2"
              onClick={(e) => this.clear(e)}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  load(user) {
    this.setState({
      user: { ...user, especialidade: user.especialidades || "" }, // Garante que a especialidade seja um código para o input
      editar: true,
      originalCrm: user.crm,
    });
  }

  remove(user) {
    if (
      !window.confirm(`Tem certeza que deseja excluir o médico ${user.nomem}?`)
    ) {
      return;
    }

    axios
      .delete(`${baseUrl}/${user.crm}`)
      .then((resp) => {
        this.loadMedicos(this.state.pagination.currentPage); // Recarrega a página atual após o delete
        alert("Médico removido com sucesso!");
      })
      .catch((error) => {
        console.error(
          "Erro ao remover médico:",
          (error.response && error.response.data) || error.message
        );
        const errorMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          "Erro desconhecido ao remover médico.";
        alert(`Erro: ${errorMessage}`);
      });
  }

  renderTable() {
    const { list, loading, error } = this.state;

    if (loading) {
      return (
        <div className="text-center mt-4">
          <div className="spinner-border" role="status">
            <span className="sr-only">Carregando...</span>
          </div>
          <p>Carregando médicos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger mt-4">
          <h5>Erro ao carregar dados</h5>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => this.loadMedicos()}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="alert alert-info mt-4">
          <h5>Nenhum médico cadastrado</h5>
          <p>Cadastre o primeiro médico utilizando o formulário acima.</p>
        </div>
      );
    }

    return (
      <table className="table table-striped mt-4">
        <thead className="thead-dark">
          <tr>
            <th>Nome</th>
            <th>CRM</th>
            <th>Telefone</th>
            <th>Percentual</th>
            <th>Especialidade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>{this.renderRows()}</tbody>
      </table>
    );
  }

  renderRows() {
    return this.state.list.map((medico) => {
      return (
        <tr key={medico.crm}>
          <td>{medico.nomem}</td> {/* Use nomem diretamente */}
          <td>{medico.crm}</td>
          <td>{medico.telefone}</td>
          <td>{medico.percentual}%</td>
          <td>{medico.especialidades || "N/A"}</td>
          <td>
            <button
              className="btn btn-warning btn-sm mr-2"
              onClick={() => this.load(medico)}
              title="Editar"
            >
              <i className="fa fa-pencil"></i>
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => this.remove(medico)}
              title="Excluir"
            >
              <i className="fa fa-trash"></i>
            </button>
          </td>
        </tr>
      );
    });
  }

  // NOVA LÓGICA: Função para renderizar o seletor de itens por página
  renderPageSizeSelector() {
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
                  currentPage: 1, // Volta para a primeira página ao mudar o tamanho
                },
              }),
              () => this.loadMedicos(1) // Recarrega com a nova configuração
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
            <button className="page-link" onClick={() => this.loadMedicos(1)}>
              Primeira
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => this.loadMedicos(currentPage - 1)}
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
                onClick={() => this.loadMedicos(number)}
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
              onClick={() => this.loadMedicos(currentPage + 1)}
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
              onClick={() => this.loadMedicos(totalPages)}
            >
              Última
            </button>
          </li>
        </ul>
        <div className="text-center">
          <small className="text-muted">
            Página {currentPage} de {totalPages} | Total de{" "}
            {this.state.pagination.totalItems} médicos
          </small>
        </div>
      </nav>
    );
  }

  // NOVA LÓGICA: Renderizar a seção de benchmark para médicos
  renderBenchmarkSection() {
    const { benchmarkTimes, loading } = this.state;
    return (
      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">Benchmark de Carregamento de Médicos</h5>
          <p className="card-text">
            Compare o tempo de carregamento com e sem paginação.
          </p>
          <div className="mb-3">
            <button
              className="btn btn-info mr-2"
              onClick={() => this.loadMedicos(1)}
              disabled={loading}
            >
              Carregar Paginações ({benchmarkTimes.paginatedLoad || "N/A"})
            </button>
            <button
              className="btn btn-warning"
              onClick={this.loadAllMedicosForBenchmark}
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
