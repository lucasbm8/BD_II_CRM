import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import './App.css'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Nav from '../components/template/Nav'
import Routes from './Routes'

export default props =>
    <BrowserRouter>
        <div className="app">
            <Nav />
            <Routes />
        </div>
    </BrowserRouter>