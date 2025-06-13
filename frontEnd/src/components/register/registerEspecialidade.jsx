import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "",
  title: "Cadastros",
  subtitle: "Tela de cadastro de Especialidades",
};

const baseUrl = "http://localhost:4040";
const initialState = {
  user: { codigo: "", name: "", indice: "" }, // Ajustado para refletir os campos
  list: [],
};

export default class Consulta extends Component {
  state = { ...initialState };

  componentDidMount() {
    this.loadEspecialidades();
  }

  loadEspecialidades() {
    axios
      .get(`${baseUrl}/listarEspecialidades`)
      .then((resp) => {
        this.setState({ list: resp.data });
      })
      .catch((error) => {
        console.error("Erro ao carregar especialidades:", error);
      });
  }

  clear() {
    this.setState({ user: initialState.user });
  }

  save() {
    const { codigo, name, indice } = this.state.user;

    if (!codigo || !name || !indice) {
      return alert("Preencha todos os campos!");
    }
    const especialidade = {
      codigo: this.state.user.codigo,
      nomee: this.state.user.name, // Note que no banco é 'nomee'
      indice: this.state.user.indice,
    };

    const method = this.state.user.codigo ? "put" : "post";
    const url = this.state.user.codigo
      ? `${baseUrl}/atualizarEspecialidade/${this.state.user.codigo}`
      : `${baseUrl}/cadastrarEspecialidade`;

    axios[method](url, especialidade)
      .then((resp) => {
        this.loadEspecialidades(); // Recarrega a lista após salvar
        this.clear();
      })
      .catch((error) => {
        console.error("Erro ao salvar especialidade:", error);
      });
  }

  getUpdatedList(user, add = true) {
    const list = this.state.list.filter((u) => u.id !== user.id);
    if (add) list.unshift(user);
    return list;
  }

  updateField(event) {
    const user = { ...this.state.user };
    user[event.target.name] = event.target.value;
    this.setState({ user });
  }

  renderForm() {
    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={this.state.user.name}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o nome..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Indice</label>
              <input
                type="text"
                className="form-control"
                name="indice"
                value={this.state.user.indice}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o indice..."
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Codigo</label>
              <input
                type="text"
                className="form-control"
                name="codigo"
                value={this.state.user.codigo}
                onChange={(e) => this.updateField(e)}
                placeholder="Digite o codigo..."
              />
            </div>
          </div>
        </div>

        <hr />
        <div className="row">
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary" onClick={(e) => this.save(e)}>
              Cadastrar
            </button>

            <button
              className="btn btn-secondary ml-2"
              onClick={(e) => this.clear(e)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  load(user) {
    this.setState({ user });
  }

  // Atualize o método remove para usar o código ao invés de id
  remove(especialidade) {
    axios
      .delete(`${baseUrl}/removerEspecialidade/${especialidade.codigo}`)
      .then(() => {
        this.loadEspecialidades(); // Simplesmente recarrega a lista após exclusão
      })
      .catch((error) => {
        console.error("Erro na exclusão:", error); // Apenas loga o erro no console
      });
  }

  renderTable() {
    return (
      <table className="table mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Indice</th>
            <th>Editar/Apagar</th>
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
