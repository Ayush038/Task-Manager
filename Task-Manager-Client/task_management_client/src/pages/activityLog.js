import React, { useEffect, useState } from 'react';
import API from '../services/Api';
import '../styles/activityLog.css';
import Navbar from '../components/Navbar';

const ActivityLog= () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  },[]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/tasks/recent', {
        headers:{Authorization: token},
      });
      setLogs(res.data);
    }catch(err){
      console.error('Error fetching logs:', err);
    }
  };

  return (
    <>
    <Navbar></Navbar>
        <div className="activity-log-container">
        {logs.map((log) => (
            <div className="activity-card" key={log._id}>
            <p className="log-title">
                {log.user?.FullName || 'Unknown User'}
            </p>
            <p className="log-action">{log.action}</p>
            <p className="log-time">
                {new Date(log.createdAt).toLocaleString()}
            </p>
            </div>
        ))}
        </div>
    </>
  );
};

export default ActivityLog;
