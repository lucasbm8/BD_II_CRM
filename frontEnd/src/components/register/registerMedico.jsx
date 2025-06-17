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
    name: "",
    crm: "",
    telefone: "",
    percentual: "",
    especialidade: "",
  },
  list: [],
  loading: false,
  error: null,
  editar: false,
};

export default class RegisterMedico extends Component {
  state = { ...initialState };

  // Mudança: componentWillMount está depreciado, usar componentDidMount
  componentDidMount() {
    this.loadMedicos();
  }

  // Função separada para carregar médicos com tratamento de erro
  loadMedicos() {
    this.setState({ loading: true, error: null });

    axios
      .get(baseUrl)
      .then((resp) => {
        console.log("Dados recebidos:", resp.data);
        const medicos = resp.data || [];

        // Adicione esta linha para ordenar a lista pelo CRM (do maior para o menor)
        medicos.sort((a, b) => b.crm - a.crm);

        this.setState({
          list: medicos, // A lista agora está ordenada
          loading: false,
        });
      })
      .catch((error) => {
        // ...
      });
  }

  clear() {
    this.setState({ user: initialState.user });
  }

  save() {
    const user = this.state.user;
    const method = this.state.editar ? "put" : "post";
    console.log("dados user");
    console.log(user);
    console.log(method);
    const url = user.codigop ? `${baseUrl}/${user.codigop}` : baseUrl;

    console.log(url);

    axios({
      method: method,
      url: url,
      data: { dados: user },
    })
      .then((resp) => {
        const list = this.getUpdatedList(resp.data);
        this.setState({ user: initialState.user, list });
        this.loadMedicos();
        this.setState({ editar: true });
      })
      .catch((err) => console.error("Erro ao salvar medico:", err));
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
    const { user, loading } = this.state;

    return (
      <div className="form">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                className="form-control"
                name="name"
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
                disabled={loading}
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
              disabled={loading}
            >
              {loading ? "Salvando..." : user.id ? "Atualizar" : "Cadastrar"}
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
    console.log(user);
    this.setState({ editar: true });
    this.setState({ user });
  }

  remove(user) {
    if (
      !window.confirm(`Tem certeza que deseja excluir o médico ${user.name}?`)
    ) {
      return;
    }

    axios
      .delete(`${baseUrl}/${user.id}`)
      .then((resp) => {
        const list = this.getUpdatedList(user, false);
        this.setState({ list });
        alert("Médico removido com sucesso!");
      })
      .catch((error) => {
        console.error("Erro ao remover médico:", error);
        alert("Erro ao remover médico!");
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
          <td>{medico.name || medico.nomem}</td>
          <td>{medico.crm}</td>
          <td>{medico.telefone}</td>
          <td>{medico.percentual}%</td>
          {/* AQUI ESTÁ A MUDANÇA: Use o campo 'especialidades' que vem da nova API */}
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

  render() {
    return (
      <Main {...headerProps}>
        {this.renderForm()}
        {this.renderTable()}
      </Main>
    );
  }
}
