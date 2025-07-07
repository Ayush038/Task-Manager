import React from 'react';
import '../styles/navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={()=> navigate('/dashboard')}>
        <h2 className="logo">Task Manager</h2>
      </div>
      <div className="navbar-right">
        <span className="username">Welcome {user?.UserName || 'Guest'}</span>
        <button className="nav-btn" onClick={() => navigate('/info')}>
            Info
        </button>
        <button className="nav-btn" onClick={() => navigate('/activity')}>
            Activity Log
        </button>
        <button className="logout-btn" onClick={onLogout}>
            Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
