import React, { useEffect, useState } from 'react';
import API from '../services/Api';
import '../styles/activityLog.css';
import Navbar from '../components/Navbar';

const ActivityLog= () => {
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchLogs();
  },[]);

  useEffect(()=>{
    const fetchUser = async () => {
      try{
        const token = localStorage.getItem('token');
        const res = await API.get('/auth/me',{
          headers: { Authorization: token },
        });
        setUser(res.data);
      }catch (err){
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout =()=>{
    localStorage.removeItem('token');
    window.location.href = '/';
  };

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
    <Navbar user={user} onLogout={handleLogout}></Navbar>
        <div className="activity-log-container">
        {logs.map((log) => (
            <div className="activity-card" key={log._id}>
            <p className="log-title">
                {log.user?.FullName || 'Unknown User'}
            </p>
            <p className="log-action">
              {(() => {
                const match = log.action.match(/^(.*)"(.*)"(.*)$/);
                if (match) {
                  return (
                    <>
                      {match[1]}
                      <strong>"{match[2]}"</strong>
                      {match[3]}
                    </>
                  );
                } else {
                  return log.action;
                }
              })()}
            </p>
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
