import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone_number, setPhone] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5000/register', {
        username,
        password,
        phone_number
      });
      if (response.data.message === 'User registered successfully') {
        navigate('/login');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Registration failed');
    }
  };

  return (
    // <div>
    //   <h2>Register</h2>
    //   <form onSubmit={handleRegister}>
    //     <div>
    //       <label htmlFor="username">Username:</label>
    //       <input
    //         type="text"
    //         id="username"
    //         value={username}
    //         onChange={(e) => setUsername(e.target.value)}
    //       />
    //     </div>
    //     <div>
    //       <label htmlFor="password">Password:</label>
    //       <input
    //         type="password"
    //         id="password"
    //         value={password}
    //         onChange={(e) => setPassword(e.target.value)}
    //       />
    //     </div>
    //     <button type="submit">Register</button>
    //   </form>
    // </div>
<form onSubmit={handleRegister}>
        <h3>Sign Up</h3>
        <div className="mb-3">
          <label>First name</label>
          <input
            type="text"
            className="form-control"
            placeholder="First name"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>Last name</label>
          <input type="text" className="form-control" placeholder="Last name" />
        </div>
        <div className="mb-3">
          <label>Phone</label>
          <input
            type="number"
            className="form-control"
            placeholder="Phone number"
            id="phone_number"
            value={phone_number}
            onChange={(e) => setPhone(e.target.value)}
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
          />
        </div>
        <div className="d-grid">
          <button type="submit" className="btn btn-primary">
            Sign Up
          </button>
        </div>
        <p className="forgot-password text-right">
          Already registered <a href="/login">sign in?</a>
        </p>
      </form>

  );
}

export default Register;
