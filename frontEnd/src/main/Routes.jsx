import React from 'react'
import { Switch, Route, Redirect } from 'react-router'
import Home from '../components/home/Home'
import RegisterEspecialidade from '../components/register/registerEspecialidade'
import RegisterPaciente from '../components/register/registerPaciente'
import RegisterMedico from '../components/register/registerMedico'
import Consulta from '../components/consulta/consulta'
import Gestao from '../components/consulta/gestao'

export default props => 
    <Switch>
        <Route exact path='/' component={Home} />
        <Route path='/registerEspecialidade' component={RegisterEspecialidade} />
        <Route path='/registerPaciente' component={RegisterPaciente} />
        <Route path='/registerMedico' component={RegisterMedico} />
        <Route path='/consulta' component={Consulta} />
        <Route path='/gestao' component={Gestao} />
        <Redirect from='*' to='/' />
    </Switch>