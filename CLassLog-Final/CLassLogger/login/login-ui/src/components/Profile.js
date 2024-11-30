import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://127.0.0.1:5000/user', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data.username);
      })
      .catch(error => {
        console.log(error);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (

    <div className="form-container">
      <h2>Welcome</h2>
      {user ? (
        <div>
          <p>Hello, {user}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <a href="/login">Login</a> or <a href="/register">Register</a>
        </div>
      )}
    </div>
  );
}

export default Profile;
