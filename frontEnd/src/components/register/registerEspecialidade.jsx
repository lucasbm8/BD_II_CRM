import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "tags",
  title: "Cadastros",
  subtitle: "Tela de cadastro de Especialidades",
};

const baseUrl = "http://localhost:4040/especialidades";

const initialState = {
  user: { codigo: "", nomee: "", indice: "" },
  list: [],
  loading: false,
  isEditing: false,
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

export default class RegisterEspecialidade extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadEspecialidades(); // Carrega a primeira página por padrão
  }

  // NOVA LÓGICA: Função para carregar especialidades com paginação
  loadEspecialidades = async (page = this.state.pagination.currentPage) => {
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
      console.error("Erro ao carregar especialidades:", error);
      alert(
        "Erro ao carregar especialidades. Verifique o console para detalhes."
      );
      this.setState({ loading: false });
    }
  };

  // NOVA LÓGICA: Função para carregar todas as especialidades (para benchmark de comparação)
  loadAllEspecialidadesForBenchmark = async () => {
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
      const response = await axios.get(baseUrl, { params: { limit: 999999 } }); // Limite bem alto
      const endTime = performance.now(); // Fim da medição

      console.log(
        `Carregamento COMPLETO para benchmark: ${
          response.data.data.length
        } especialidades em ${(endTime - startTime).toFixed(2)} ms`
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
        "Erro ao carregar todas as especialidades para benchmark:",
        error
      );
      alert("Erro ao carregar todas as especialidades para benchmark.");
      this.setState({ loading: false });
    }
  };

  clear = () => {
    this.setState({ user: initialState.user, isEditing: false });
  };

  save = async () => {
    const { codigo, nomee, indice } = this.state.user;

    if (!codigo || !nomee || !indice) {
      return alert(
        "Por favor, preencha todos os campos obrigatórios (Código, Nome, Índice)."
      );
    }

    const especialidadeData = {
      codigo: parseInt(codigo),
      nomee,
      indice: parseInt(indice),
    };

    const method = this.state.isEditing ? "put" : "post";
    const url = this.state.isEditing
      ? `${baseUrl}/${especialidadeData.codigo}`
      : baseUrl;

    try {
      const resp = await axios[method](url, especialidadeData);
      console.log("Resposta da API:", resp.data);
      alert(
        `Especialidade ${
          this.state.isEditing ? "atualizada" : "cadastrada"
        } com sucesso!`
      );

      this.clear(); // Limpa o formulário e reseta o modo de edição
      this.loadEspecialidades(this.state.pagination.currentPage); // Recarrega a lista após salvar
    } catch (error) {
      console.error(
        "Erro ao salvar especialidade:",
        (error.response && error.response.data) || error.message
      );
      const errorMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Erro desconhecido ao salvar especialidade.";
      alert(`Erro: ${errorMessage}`);
    }
  };

  updateField = (event) => {
    const user = { ...this.state.user };
    user[event.target.name] = event.target.value;
    this.setState({ user });
  };

  load = (especialidade) => {
    this.setState({
      user: { ...especialidade, name: especialidade.nomee },
      isEditing: true,
    });
  };

  remove = async (especialidade) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a especialidade "${especialidade.nomee}" (Código: ${especialidade.codigo})?`
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${baseUrl}/${especialidade.codigo}`);
      alert("Especialidade excluída com sucesso!");
      this.loadEspecialidades(this.state.pagination.currentPage); // Recarrega a lista após a exclusão
    } catch (error) {
      console.error(
        "Erro ao deletar especialidade:",
        (error.response && error.response.data) || error.message
      );
      const errorMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Erro desconhecido ao deletar especialidade.";
      alert(`Erro: ${errorMessage}`);
    }
  };

  renderForm() {
    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Código</label>
              <input
                type="number"
                className="form-control"
                name="codigo"
                value={this.state.user.codigo}
                onChange={this.updateField}
                placeholder="Digite o código..."
                disabled={this.state.isEditing} // Desabilita o campo na edição
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                className="form-control"
                name="nomee"
                value={this.state.user.nomee}
                onChange={this.updateField}
                placeholder="Digite o nome..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Índice</label>
              <input
                type="number"
                className="form-control"
                name="indice"
                value={this.state.user.indice}
                onChange={this.updateField}
                placeholder="Digite o índice..."
              />
            </div>
          </div>
        </div>

        <hr />
        <div className="row">
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary" onClick={this.save}>
              {this.state.isEditing ? "Atualizar" : "Cadastrar"}
            </button>

            <button className="btn btn-secondary ml-2" onClick={this.clear}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderTable() {
    const { list, loading } = this.state;

    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="mt-2">Carregando especialidades...</p>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="alert alert-info mt-4">
          Nenhuma especialidade cadastrada.
        </div>
      );
    }

    return (
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Índice</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>{this.renderRows()}</tbody>
      </table>
    );
  }

  renderRows() {
    return this.state.list.map((especialidade) => {
      return (
        <tr key={especialidade.codigo}>
          <td>{especialidade.codigo}</td>
          <td>{especialidade.nomee}</td>
          <td>{especialidade.indice}</td>
          <td>
            <button
              className="btn btn-warning"
              onClick={() => this.load(especialidade)}
            >
              <i className="fa fa-pencil"></i>
            </button>
            <button
              className="btn btn-danger ml-2"
              onClick={() => this.remove(especialidade)}
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
              () => this.loadEspecialidades(1) // Recarrega com a nova configuração
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
            <button
              className="page-link"
              onClick={() => this.loadEspecialidades(1)}
            >
              Primeira
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => this.loadEspecialidades(currentPage - 1)}
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
                onClick={() => this.loadEspecialidades(number)}
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
              onClick={() => this.loadEspecialidades(currentPage + 1)}
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
              onClick={() => this.loadEspecialidades(totalPages)}
            >
              Última
            </button>
          </li>
        </ul>
        <div className="text-center">
          <small className="text-muted">
            Página {currentPage} de {totalPages} | Total de{" "}
            {this.state.pagination.totalItems} especialidades
          </small>
        </div>
      </nav>
    );
  }

  // NOVA LÓGICA: Renderizar a seção de benchmark para especialidades
  renderBenchmarkSection() {
    const { benchmarkTimes, loading } = this.state;
    return (
      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">
            Benchmark de Carregamento de Especialidades
          </h5>
          <p className="card-text">
            Compare o tempo de carregamento com e sem paginação.
          </p>
          <div className="mb-3">
            <button
              className="btn btn-info mr-2"
              onClick={() => this.loadEspecialidades(1)}
              disabled={loading}
            >
              Carregar Paginações ({benchmarkTimes.paginatedLoad || "N/A"})
            </button>
            <button
              className="btn btn-warning"
              onClick={this.loadAllEspecialidadesForBenchmark}
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
