import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://127.0.0.1:5000/reset_password/${token}`, {
        password,
      });
      alert(response.data.message);
      if (response.data.message === "Password has been reset successfully") {
        navigate('/login');
      }
    } catch (error) {
      console.error(error);
      alert('Error resetting password');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        <div>
          <label htmlFor="password">New Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
