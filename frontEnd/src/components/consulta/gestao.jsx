import React, { Component } from 'react'
import axios from 'axios'
import Main from '../template/Main'

const headerProps = {
    icon: '',
    title: 'Cadastros',
    subtitle: 'Tela de gestão de consultas'
}

const baseUrl = 'http://localhost:4040/'
const controlers = {
    medicos: "medicos",
    agendaMedico: "agendaMedico",
    agenda: "AgendaCodigo",
    agendar: "agendarConsulta",
    atualizar: "atualizarDados"
}
const initialState = {
    med: { nomem: '', crm: '' },
    dadosAgenda: {codigo: '', data: '', horainic: '', horafim: '', idpaciente: '', idespecial: '', idmedico: '', valorpago: '', pagou: false,formapagamento: ''},
    list: [],
    agendaOpen: false,
    agenda: <div></div>,
    horarios: []
}

export default class RegisterMedico extends Component {

    state = { ...initialState }

    componentWillMount() {
        axios(baseUrl+controlers.medicos).then(resp => {
            this.setState({ list: resp.data })
        })
    }

     generateTimeSlots(startTime, endTime, interval) {
        let timeSlots = [];
        let start = new Date(`1970-01-01T${startTime}:00`);
        let end = new Date(`1970-01-01T${endTime}:00`);
    
        while (start <= end) {
            let hours = start.getHours().toString().padStart(2, '0');
            let minutes = start.getMinutes().toString().padStart(2, '0');
            timeSlots.push(`${hours}:${minutes}:00`);
            start.setMinutes(start.getMinutes() + interval);
        }
    
        return timeSlots

    }


    findHorarios(){
        const crm = this.state.dadosAgenda.crm
        const method =  'post'
        const url = baseUrl + controlers.agendaMedico

            axios({
                method: method,
                url: url,
                data: { crm: crm } 
            })
            .then(resp => {
                this.setState({ horarios: resp.data })
                console.log(this.state.horarios);
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });
    }

     findAgenda(){
        const codigo = this.state.dadosAgenda.codigo
        console.log("codigo; "+codigo)
        const method =  'post'
        const url = baseUrl + controlers.agenda

        console.log("url; "+url)
            axios({
                method: method,
                url: url,
                data: { codigo: codigo } 
            })
            .then(resp => {
                this.setState({ dadosAgenda: resp.data[0] })
                console.log("dados agenda");
                console.log(this.state.dadosAgenda);
                this.atualizarCadastro()

                //console.log(resp.data[0] );
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });
    }

    clear() {
        this.setState({ dadosAgenda: initialState.dadosAgenda })
        console.log(this.state.dadosAgenda)
        this.setState({ agendaOpen: false })
    }

    save() {
        const dadosAgenda = this.state.dadosAgenda
        const method =  'post'
        const url = baseUrl + controlers.atualizar
        
            axios({
                method: method,
                url: url,
                data: { dadosAgenda: dadosAgenda } 
            })
            .then(resp => {
                console.log("resultado atualização");
                console.log(resp );
                 alert("Consulta alterada com sucesso " )
                 window.location.reload()
                
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });

            this.clear(); 
    }

    getUpdatedList(med, add = true) {
        const list = this.state.list.filter(u => u.id !== med.id)
        if(add) list.unshift(med)
        return list
    }

    updateField(event) {
        const med = { ...this.state.med }
        med[event.target.name] = event.target.value
        this.setState({ med })
    }

    updateFieldAgenda(event) {
        const dadosAgenda = { ...this.state.dadosAgenda }
        dadosAgenda[event.target.name] = event.target.value
        this.setState({ dadosAgenda })
        console.log(dadosAgenda)
    }



    renderForm() {
        return (
            <div>
            {this.formMedicoAgenda()}
            {this.state.agendaOpen && this.state.agenda}
            
            
            </div>

        )
        
    }

    load(med) {
        this.setState({ med })
    }

    remove(med) {
        axios.delete(`${baseUrl}/${med.id}`).then(resp => {
            const list = this.getUpdatedList(med, false)
            this.setState({ list })
        })
    }
    listMedicos(){
            return (
                <div>
                <h2>Selecione o Medico para consulta</h2>
               <div className='form-medico-Data'>

               </div>
                <select className="form-control" onChange={(e) => this.atualizarAgenda(e.target.value)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               this.state.list.map(med => {
                let styles = {
                    width: '35px'
                  };
                return (
                    <option key={med.crm}   value={med.nomem}  >
                     {med.nomem}
                    </option>
                )
            })
            } 
                </select>


                
                </div>

            )
        
    }

    formMedicoAgenda(){
        return(
        <div className="form">
            <div className="row">
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Codigo da consulta</label>
                        <input type="text" className="form-control"
                            name="codigo"
                             onChange={e => this.updateFieldAgenda(e)}
                          />
                    </div>
                </div>

            

                <button className="btn btn-primary"
                        onClick={e => this.findAgenda(this.state.dadosAgenda.codigo)}>
                        Buscar
                </button>
            </div>
            

        </div>
        )
    }


   

     formatDate(isoDate) {

        const date = new Date(isoDate);
      
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Os meses são baseados em zero, 
        const year = date.getUTCFullYear();
      
        return `${day}/${month}/${year}`;

      }
    async atualizarCadastro(){
      

    var listHorarios = this.generateTimeSlots("08:00", "18:00", 30)
    var dados = this.state.dadosAgenda
    dados.data = this.formatDate(dados.data)

       this.setState({ agenda: this.formAgenda(listHorarios, dados) })
      
       this.setState({ agendaOpen: true })
       console.log(this.state.dadosAgenda)
    }
    formAgenda(listHorarios, dados){
        return  (
            <div>
                
                <div className="form">
            <div className="row">
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Data</label>
                        <input value={dados.data} type="text" className="form-control"
                            name="data"
                             onChange={e => this.updateFieldAgenda(e)}
                          />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Medico:</label>
                        <select value={dados.idmedico} className="form-control" name="crm"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               this.state.list.map(med => {
                let styles = {
                    width: '35px'
                  };
                return (
                    <option key={med.crm}   value={med.crm}  >
                     {med.nomem}
                    </option>
                )
            })
            } 
                </select>
                    </div>
                </div>
            </div>
            <div className="form">
            <div className="row">
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Codigo Paciente</label>
                        <input value={dados.idpaciente} type="text" className="form-control"
                            name="idpaciente"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Horario Inicio</label>
                        <select className="form-control" value={dados.horainic} name="horainic"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               listHorarios.map(hora => {
                let styles = {
                    width: '35px'
                  };
                return (
                    <option key={hora}   value={hora}  >
                     {hora}
                    </option>
                )
            })
            } 
                </select>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Horario Fim</label>
                        <select className="form-control" value={dados.horafim} name="horafim"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               listHorarios.map(hora => {
                let styles = {
                    width: '35px'
                  };
                return (
                    <option key={hora}   value={hora}  >
                     {hora}
                    </option>
                )
            })
            } 
                </select>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Codigo Especialidade</label>
                        <input type="text" value={dados.idespecial} className="form-control"
                            name="idespecial"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Valor pago</label>
                        <input type="text" value={dados.valorpago} className="form-control"
                            name="valorpago"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>pagou</label>
                        <select className="form-control" value={dados.pagou}  name="pagou"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
                    <option key={1}   value={true}  >
                     Sim
                    </option>
                    <option key={2}   value={false}  >
                     Não
                    </option>
                </select>
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Forma de pagamento</label>
                        <input value={dados.formapagamento}  type="text" className="form-control"
                            name="formapagamento"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o forma de pagamento..." />
                    </div>
                </div>            
               
 
            </div>

            <hr />
            <div className="row">
                <div className="col-12 d-flex justify-content-end">
                    <button className="btn btn-primary"
                        onClick={e => this.save(e)}>
                        Editar dados Consulta
                    </button>

                </div>
            </div>
        </div>
            

        </div>
          
            
            
            </div>

        )
    }



    render() {
        return (
            <Main {...headerProps}>
                {this.renderForm()}
            
            </Main>
        )
    }
}