import React, { Component } from 'react'
import axios from 'axios'
import Main from '../template/Main'

const headerProps = {
    icon: '',
    title: 'Cadastros',
    subtitle: 'Tela de marcação de consulta'
}

const baseUrl = 'http://localhost:4040/'
const controlers = {
    medicos: "medicos",
    agendaMedico: "agendaMedico",
    agendar: "agendarConsulta"
}
const initialState = {
    med: { nomem: '', crm: '' },
    dadosAgenda: {data: '',crm:'', medico: '', codigo: '', horainic: '', horafim: '', idpaciente: '', idespecial: '', idmedico: '', valorpago: '', pagou: false,formapagamento: '', diasemana:''},
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

     generateTimeSlots(startTime, endTime, interval, intervals) {
        let timeSlots = [];
        let start = new Date(`1970-01-01T${startTime}:00`);
        let end = new Date(`1970-01-01T${endTime}:00`);
    
        while (start <= end) {
            let hours = start.getHours().toString().padStart(2, '0');
            let minutes = start.getMinutes().toString().padStart(2, '0');
            timeSlots.push(`${hours}:${minutes}`);
            start.setMinutes(start.getMinutes() + interval);
        }
    
        return timeSlots.filter(time => {
            for (let [horainicio, horafim] of intervals) {
                if (time >= horainicio && time < horafim) {
                    return false;
                }
            }
            return true;
        });

    }
    generateTime(startTime, endTime, interval) {
        let timeSlots = [];
        let start = new Date(`1970-01-01T${startTime}:00`);
        let end = new Date(`1970-01-01T${endTime}:00`);
    
        while (start <= end) {
            let hours = start.getHours().toString().padStart(2, '0');
            let minutes = start.getMinutes().toString().padStart(2, '0');
            timeSlots.push(`${hours}:${minutes}`);
            start.setMinutes(start.getMinutes() + interval);
        }
    

         return timeSlots;
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
                console.log("horarios medicos:")
                console.log(resp.data )
                console.log("horarios :")
                console.log(this.state.horarios);
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
     generateRandomDate() {
        // Gera um dia aleatório entre 1 e 28 (para simplificar, considerando todos os meses)
        const day = Math.floor(Math.random() * 28) + 1; 
        // Gera um mês aleatório entre 1 e 12
        const month = Math.floor(Math.random() * 12) + 1; 
        // Gera um ano aleatório entre 1900 e 2023
        const year = Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900;
      
        // Formata a data no formato 'dd/mm/yyyy'
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      }

      // metodo utilizado no crescimento de tabelas
    crescimentoTabela(){
        var horarios = this.generateTime("08:00", "18:00", 30)
        var randomIndex, inicio,fim

        for(var i = 0; i < 5000; i++){
         //Gerando dados Aleatorios   
         randomIndex = Math.floor(Math.random() * horarios.length);
         inicio = horarios[randomIndex]
         randomIndex = Math.floor(Math.random() * horarios.length);
         fim = horarios[randomIndex]
       

         var dados = {
            data: this.generateRandomDate(),
            medico: '748',
            horainic: inicio,
            horafim: fim,
            idpaciente: '748',
            idespecial: '471', 
            idmedico: '748', 
            valorpago: '1000', 
            pagou: true,
            formapagamento: 'Debito',
            crm: '748'
        }
        this.saveLote(dados)
         console.log("------> TESTE GERAÇÃO DADOS ALEATORIOS <-------")
         console.log("iNDICE: "+i)
         console.log("DADOS: ")
         console.log(dados)


        }

    }
    saveLote(dadosAgenda) {
        const method =  'post'
        const url = baseUrl + controlers.agendar
        console.log("dadosAgenda")
        console.log(dadosAgenda)
        
            axios({
                method: method,
                url: url,
                data: { dadosAgenda: dadosAgenda } 
            })
            .then(resp => {
                console.log(resp.data );
                
                
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });

            this.clear(); 
    }

    save() {
        const dadosAgenda = this.state.dadosAgenda
        const method =  'post'
        const url = baseUrl + controlers.agendar
        console.log("dadosAgenda")
        console.log(dadosAgenda)
        
            axios({
                method: method,
                url: url,
                data: { dadosAgenda: dadosAgenda } 
            })
            .then(resp => {
                console.log(resp.data );
                alert("Consulta agendada com Sucesso! Codigo da consulta: "+resp.data.codigoConsulta )
                
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            });

            this.clear(); 
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

     getDayOfWeek(event) {
        const daysOfWeek = [
          'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
          'Quinta-feira', 'Sexta-feira', 'Sábado'
        ];
        var data = event.target.value
         const [day, month, year] = data.split('/');
         const date = new Date(`${year}-${month}-${day}`);
      
         const dayIndex = date.getDay();
         this.state.dadosAgenda.data = data.replace(/-/g, '/');
         console.log( this.state.dadosAgenda.data)
         this.state.dadosAgenda.diasemana = daysOfWeek[dayIndex]

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
                        <label>Data</label>
                        <input type="date" className="form-control"
                            name="diasemana"
                             onChange={e =>  this.getDayOfWeek(e)}
                          />

                      
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Medico:</label>
                        <select className="form-control" name="crm"  onChange={e => this.updateFieldAgenda(e)}>
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

                <button className="btn btn-primary"
                        onClick={e => this.atualizarCadastro(e)}>
                        Buscar
                </button>
              
            </div>
            

        </div>
        )
    }

     generateRandomIntervals(numIntervals, startTime, endTime) {
        let intervals = [];
        let start = new Date(`1970-01-01T${startTime}:00`).getTime();
        let end = new Date(`1970-01-01T${endTime}:00`).getTime();
        let interval = 30 * 60 * 1000; // 30 minutes in milliseconds
    
        for (let i = 0; i < numIntervals; i++) {
            let randomStart = new Date(start + Math.random() * (end - start - interval));
            let randomEnd = new Date(randomStart.getTime() + interval);
    
            let startHours = randomStart.getHours().toString().padStart(2, '0');
            let startMinutes = randomStart.getMinutes().toString().padStart(2, '0');
            let endHours = randomEnd.getHours().toString().padStart(2, '0');
            let endMinutes = randomEnd.getMinutes().toString().padStart(2, '0');
    
            intervals.push([`${startHours}:${startMinutes}`, `${endHours}:${endMinutes}`]);
        }
    
        return intervals;
    }
   

    atualizarCadastro(){
        this.setState({ agendaOpen: true })
        console.log(this.state.dadosAgenda)

        let intervalosOcupados = this.generateRandomIntervals(3, "08:00", "18:00")
        console.log('Horarios aleatorios:', intervalosOcupados);
        var listHorarios = this.generateTimeSlots("08:00", "18:00", 30,intervalosOcupados)

        this.findHorarios(this.state.dadosAgenda.crm)
        



        this.setState({ agenda: this.formAgenda(listHorarios)
          
        })
    }



    formAgenda(horarios){
        return (
            <div className="form">
            <div className="row">
                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Codigo Paciente</label>
                        <input type="text" className="form-control"
                            name="idpaciente"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Horario Inicio</label>
                        <select className="form-control" name="horainic"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               horarios.map(hora => {
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
                        <select className="form-control" name="horafim"  onChange={e => this.updateFieldAgenda(e)}>
                     <option key={0}   value={0}  >
                     Selecione
                    </option>
               {
               horarios.map(hora => {
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
                        <input type="text" className="form-control"
                            name="idespecial"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>Valor pago</label>
                        <input type="text" className="form-control"
                            name="valorpago"
                             onChange={e => this.updateFieldAgenda(e)}
                            placeholder="Digite o nome..." />
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="form-group">
                        <label>pagou</label>
                        <select className="form-control" name="pagou"  onChange={e => this.updateFieldAgenda(e)}>
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
                        <input type="text" className="form-control"
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
                        Agendar Consulta
                    </button>

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