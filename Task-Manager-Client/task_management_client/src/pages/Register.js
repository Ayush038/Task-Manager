import React, { useState } from 'react';
import API from '../services/Api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css';
import Swal from 'sweetalert2';

const Register = () => {
  const [form, setForm] = useState({
    FullName: '',
    UserName: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/register', form);
      console.log("Response:", res);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setForm({
        FullName: '',
        UserName: '',
        email: '',
        password: '',
      });
      navigate('/');
    }catch(err){
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.response?.data?.message || 'Invalid Entry',
        confirmButtonColor: '#d33',
      });
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="FullName"
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
          <input
            name="UserName"
            onChange={handleChange}
            placeholder="Username"
            required
          />
          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <button type="submit">Register</button>
        </form>
        <p className="login-link">
          Already registered? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
