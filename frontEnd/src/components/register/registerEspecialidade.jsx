import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "tags", // Ícone mais adequado para especialidades
  title: "Cadastros",
  subtitle: "Tela de cadastro de Especialidades",
};

// Base URL para as operações de especialidade, conforme o routes.js
const baseUrl = "http://localhost:4040/especialidades";

const initialState = {
  // Ajustado para refletir os campos exatos do banco de dados (nomee)
  user: { codigo: "", nomee: "", indice: "" },
  list: [],
  loading: false, // Novo estado para controle de carregamento
  isEditing: false, // Novo estado para controlar o modo de edição (cadastrar/atualizar)
};

export default class RegisterEspecialidade extends Component {
  // Renomeado para clareza
  state = { ...initialState };

  componentDidMount() {
    this.loadEspecialidades();
  }

  loadEspecialidades = async () => {
    // Usar arrow function para binding automático
    this.setState({ loading: true });
    try {
      // Usar baseUrl diretamente, já que /especialidades é a raiz das operações
      const response = await axios.get(baseUrl);
      this.setState({ list: response.data, loading: false });
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      alert(
        "Erro ao carregar especialidades. Verifique o console para detalhes."
      );
      this.setState({ loading: false });
    }
  };

  clear = () => {
    // Usar arrow function para binding automático
    this.setState({ user: initialState.user, isEditing: false }); // Resetar isEditing
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

      this.loadEspecialidades();
      this.clear();
    } catch (error) {
      console.error(
        "Erro ao salvar especialidade:",
        // ALTERAÇÃO AQUI: Substitua 'error.response?.data' por 'error.response && error.response.data'
        (error.response && error.response.data) || error.message
      );
      const errorMessage =
        // ALTERAÇÃO AQUI: Substitua 'error.response?.data?.message' por 'error.response && error.response.data && error.response.data.message'
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Erro desconhecido ao salvar especialidade.";
      alert(`Erro: ${errorMessage}`);
    }
  };

  // getUpdatedList não é mais necessário, pois loadEspecialidades recarrega a lista

  updateField = (event) => {
    // Usar arrow function
    const user = { ...this.state.user };
    user[event.target.name] = event.target.value;
    this.setState({ user });
  };

  // MUDANÇA CRÍTICA: Define isEditing para true quando uma especialidade é carregada para edição
  load = (especialidade) => {
    // Usar arrow function
    // Cria uma cópia do objeto para evitar mutação direta e garante que 'name' seja 'nomee'
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
      this.loadEspecialidades();
    } catch (error) {
      console.error(
        "Erro ao deletar especialidade:",
        // ALTERAÇÃO AQUI: Substitua 'error.response?.data' por 'error.response && error.response.data'
        (error.response && error.response.data) || error.message
      );
      const errorMessage =
        // ALTERAÇÃO AQUI: Substitua 'error.response?.data?.message' por 'error.response && error.response.data && error.response.data.message'
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
                type="number" // Mudar para number para consistência com o DB
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
                name="nomee" // MUDANÇA: 'name' para 'nomee' para refletir o DB
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
                type="number" // Mudar para number para consistência
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
              {this.state.isEditing ? "Atualizar" : "Cadastrar"}{" "}
              {/* Texto dinâmico */}
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
            <th>Código</th> {/* Mudado de ID para Código */}
            <th>Nome</th>
            <th>Índice</th>
            <th>Ações</th> {/* Mudado de Editar/Apagar para Ações */}
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
          {" "}
          {/* Usar especialidade.codigo como key */}
          <td>{especialidade.codigo}</td>
          <td>{especialidade.nomee}</td> {/* Campo do banco é 'nomee' */}
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

  render() {
    return (
      <Main {...headerProps}>
        {this.renderForm()}
        {this.renderTable()}
      </Main>
    );
  }
}
