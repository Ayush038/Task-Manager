import React, { useState } from 'react';
import API from '../services/Api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css';
import Swal from 'sweetalert2';

export default function Login() {
  const [form, setForm] = useState({ UserName: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: err.response?.data?.message || 'Invalid username or password',
          confirmButtonColor: '#d33',
        });
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="UserName"
            type="text"
            onChange={handleChange}
            placeholder="Username"
            required
          />
          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="login-link">
          New here? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
