import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/login', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.access_token);
      
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert("Invalid Credentials");
    }
  };

  return (
    // <div className='form-container'>
    //   <form onSubmit={handleLogin}>
    //   <h2>Login</h2>
    //     <div class='mb-3'>
    //       <label htmlFor="username" classe="form-label">Username:</label>
    //       <input
    //         class="form-control" 
    //         type="text"
    //         id="username"
    //         value={username}
    //         onChange={(e) => setUsername(e.target.value)}
    //         required
    //       />
    //     </div>
    //     <div className='mb-3'>
    //       <label htmlFor="password" className="form-label">Password:</label>
    //       <input class="form-control"
    //         type="password"
    //         id="password"
    //         value={password}
    //         onChange={(e) => setPassword(e.target.value)}
    //       />
    //     </div>
    //     <button type="submit">Login</button>
    //   </form>
    // </div>
  
<form className='form-container' onSubmit={handleLogin}>
        <h3>Sign In</h3>
        <div className="mb-3">
          <label> Username</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id="customCheck1"
            />
            <label className="custom-control-label" htmlFor="customCheck1">
              &nbsp; Remember me
            </label>
          </div>
        </div>
        <div className="d-grid">
          <button type="submit" className="btn btn-primary" style={{backgroundColor: '#6f42c1'}}>
            Submit
          </button>
        </div>
        <div className="forgot-password text-right">
          Forgot <a href="/request_reset_password">password?</a>
        </div>
      </form>



    );
}

export default Login;
