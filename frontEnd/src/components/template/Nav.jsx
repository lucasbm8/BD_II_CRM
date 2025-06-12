import './Nav.css'
import React from 'react'
import { Link } from 'react-router-dom'

export default props =>
    <aside className="menu-area">
        <nav className="menu">
            <Link to="/">
                 Início
            </Link>
          
                <a href="#submenu1" class="submenu-toggle">Cadastros</a>
                <ul class="submenu" id="submenu1">
                    <li><Link to="/registerMedico">Medico</Link></li>
                    <li><Link to="/registerPaciente">Paciente</Link></li>
                    <li><Link to="/registerEspecialidade">Especialidade</Link></li>
                </ul>

                <a href="#submenu2" class="submenu-toggle">Consultas</a>
                <ul class="submenu" id="submenu2">
                    <li><Link to="/consulta">Agendar</Link></li>
                    <li><Link to="/gestao">Gestao Agenda</Link></li>
                </ul>
           
        </nav>
    </aside>