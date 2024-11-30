import React, { useState } from 'react';
import axios from 'axios';

function RequestResetPassword() {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRequestResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5000/request_reset_password', {
        phone_number: phoneNumber,
      });
      alert(response.data.message);
    } catch (error) {
      console.error(error);
      alert('Error sending password reset link');
    }
  };

  return (
    <div className='form-container'>
      <h3>Request Password Reset</h3>
      <form onSubmit={handleRequestResetPassword}>
        <div className="mb-3">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            className="form-control"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{backgroundColor: '#6f42c1'}}>Request Password Reset</button>
      </form>
    </div>
  );
}

export default RequestResetPassword;
