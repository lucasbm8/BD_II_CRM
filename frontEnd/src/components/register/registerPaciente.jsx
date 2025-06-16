import React, { Component } from "react";
import axios from "axios";
import Main from "../template/Main";

const headerProps = {
  icon: "",
  title: "Cadastros",
  subtitle: "Tela de cadastro de Pacientes",
};

const baseUrl = "http://localhost:4040/paciente";
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
};

export default class RegisterPaciente extends Component {
  state = { ...initialState };

  componentDidMount() {
    axios(baseUrl)
      .then((resp) => this.setState({ list: resp.data }))
      .catch((err) => console.error("Erro ao buscar pacientes:", err));
  }

  clear() {
    this.setState({ user: initialState.user });
  }

  save() {
    const user = this.state.user;
    const method = user.codigop ? "put" : "post";
    const url = user.codigop ? `${baseUrl}/${user.codigop}` : baseUrl;

    axios[method](url, user)
      .then((resp) => {
        const list = this.getUpdatedList(resp.data);
        this.setState({ user: initialState.user, list });
      })
      .catch((err) => console.error("Erro ao salvar paciente:", err));
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

  load(user) {
    this.setState({ user });
  }

  remove(user) {
    axios
      .delete(`${baseUrl}/${user.codigop}`)
      .then(() => {
        const list = this.getUpdatedList(user, false);
        this.setState({ list });
      })
      .catch((err) => console.error("Erro ao deletar paciente:", err));
  }

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
    return (
      <table className="table mt-4">
        <thead>
          <tr>
            <th>ID</th>
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

  render() {
    return (
      <Main {...headerProps}>
        {this.renderForm()}
        {this.renderTable()}
      </Main>
    );
  }
}
