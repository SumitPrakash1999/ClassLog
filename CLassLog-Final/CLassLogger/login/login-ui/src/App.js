import logo from './logo.svg';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import RequestResetPassword from './components/RequestResetPassword';
import ResetPassword from './components/ResetPassword';

function App() {
  return (
    <Router>
      <div className="App container mt-5">
        <div className="auth-wrapper">
          <div className="auth-inner">
          <Routes>
            <Route exact path="/" element={<Home/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/profile" element={<Profile/>} />
            <Route path="/register" element={<Register/>} />
             <Route path="/request_reset_password" element={<RequestResetPassword/>} />
            <Route path="/reset_password/:token" element={<ResetPassword/>} />
          </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;

