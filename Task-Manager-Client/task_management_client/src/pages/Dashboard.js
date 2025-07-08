import React, { useEffect, useState } from 'react';
import API from '../services/Api';
import '../styles/dashboard.css';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import Navbar from '../components/Navbar';
import socket from '../socket/socket';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    assignedUser: ''
  });

  const columns = ['Todo', 'In Progress', 'Done'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/tasks', {
        headers: { Authorization: token },
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 2000,
        tolerance: 5,
      },
    })
  );

  useEffect(()=>{
    const fetchUser = async () => {
      try{
        const token = localStorage.getItem('token');
        const res = await API.get('/auth/me',{
          headers: { Authorization: token },
        });
        setUser(res.data);
      }catch (err){
        console.error('Failed to fetch user');
      }
    };
    fetchUser();
  }, []);

  useEffect(()=>{
    socket.connect();

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:');
    });

    socket.on('taskCreated', (newTask) => {
      setTasks((prev) => [...prev, newTask]);
    });

    socket.on('taskUpdated',(updatedTask)=>{
      setTasks((prev)=>
        prev.map((task)=> task._id === updatedTask._id ? updatedTask : task)
      );
    });

    socket.on('taskDeleted',(taskId)=>{
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    });

    return()=>{
      socket.disconnect();
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('connect_error');
    };
  },[]);

  const handleChange =(e)=> {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogout =()=>{
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await API.put(`/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: token },
        assignedUser: originalTask.assignedUser?._id,
        lastModifiedAt: originalTask.lastModifiedAt,
      });
      fetchTasks();
    } catch (err) {
      console.error("Error updating task status:");
    }
  };

  const handleSubmit =async(e)=>{
    e.preventDefault();
    try{
      const token = localStorage.getItem('token');
      await API.post('/tasks', formData, {
        headers: { Authorization: token },
      });
      Swal.fire({
        icon: 'success',
        title: 'Task Created!',
        text: 'Your task was added successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      setFormData({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        assignedUser: ''
      });
      fetchTasks();
      setActiveView('board');
    }catch(err){
      console.error(err);
      const msg = err.response?.data?.message || 'Something went wrong!';
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: msg,
      });
    }
  };

  const handleSmartAssign = async () => {
    try {
      const token = localStorage.getItem('token');
      const { title, description, priority, status } = formData;

      const res = await API.post('/tasks/smart-assign', { title, description, priority, status }, {
        headers: { Authorization: token },
      });
      Swal.fire({
        icon: 'success',
        title: 'Smart Assigned!',
        text: `Task assigned to user with fewest tasks.`,
        timer: 1500,
        showConfirmButton: false,
      });
      setFormData({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        assignedUser: ''
      });
      fetchTasks();
      setActiveView('board');
    }catch(err){
      const msg = err.response?.data?.message || 'Something went wrong!';
      Swal.fire({
        icon: 'error',
        title: 'Smart Assign Failed',
        text: msg,
      });
      console.error(err);
    }
  };


  const handleDelete = async (taskId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this task?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const res = await API.delete(`/tasks/${taskId}`, {
          headers: { Authorization: token },
        });

        if (res.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Task has been deleted.',
            timer: 1000,
            showConfirmButton: false,
          });
          fetchTasks();
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to delete task.',
        });
      }
    }
  };


  const handleDragEnd =async(event)=>{
    const token = localStorage.getItem('token');

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id;
    const newStatus = over.id;
    const originalTask = tasks.find(t => t._id === taskId);

    const updatedTasks = tasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);

    try{
      const token = localStorage.getItem('token');

      await API.put(`/tasks/${taskId}`, {
        status: newStatus,
        assignedUser: tasks.find(t => t._id === taskId).assignedUser?._id,
        lastModifiedAt: originalTask.lastModifiedAt,
      },{
        headers: { Authorization: token },
      });
    }catch(err){
      if (err.response?.status === 409) {
        const currentTask = err.response.data.currentTask;
        setTasks(tasks);
        Swal.fire({
          title: 'Conflict Detected!',
          html: `
            <p><strong>Your version:</strong> ${newStatus}</p>
            <p><strong>Current version:</strong> ${currentTask.status}</p>
            <p>Another user already moved this task. What do you want to do?</p>
          `,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Merge (Pick Column)',
          denyButtonText: 'Overwrite',
          cancelButtonText: 'Cancel',
        }).then(async (result) => {
          if (result.isConfirmed) {
            const mergeResult = await Swal.fire({
              title:'Choose new column',
              input:'select',
              inputOptions:{
                'Todo':'Todo',
                'In Progress':'In Progress',
                'Done':'Done'
              },
              inputPlaceholder: 'Select column',
              showCancelButton: true,
            });
            if(mergeResult.isConfirmed){
              await API.put(`/tasks/${taskId}`,{
                status: mergeResult.value,
                assignedUser: originalTask.assignedUser?._id,
                lastModifiedAt: currentTask.lastModifiedAt,
              },{
                headers:{ Authorization: token },
              });
              fetchTasks();
              Swal.fire('Merged!','', 'success');
            }
          } else if (result.isDenied) {
            await API.put(`/tasks/${taskId}?force=true`, {
              status: newStatus,
              assignedUser: originalTask.assignedUser?._id,
              lastModifiedAt: currentTask.lastModifiedAt,
            }, {
              headers: { Authorization: token },
            });
            fetchTasks();
            Swal.fire('Overwritten!', '', 'success');
          }
        });
      }else{
        console.error("Error updating task status:", err);
        setTasks(tasks);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Could not move task. Please try again.',
        });
      }
    }
  }

  function DraggableTask({ task }) {
    const [dragEnabled, setDragEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: task._id,
      disabled: !dragEnabled,
    });

    const style = {
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      zIndex: transform ? 999 : 'auto',
      boxShadow: transform ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
      transition: transform ? 'none' : 'box-shadow 0.2s ease',
    };

    const handlePointerDown = () =>{
      setIsDragging(false);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    const handlePointerMove = () => setIsDragging(true);
    const handleClick = () => {
      if (!isDragging) setSelectedTask(task);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card priority-${task.priority.toLowerCase()}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <div className="drag-handle" {...listeners} {...attributes}>
          :: 
        </div>

        <div className="task-card-header">
          <h4>{task.title}</h4>
          <FaTrash
            className="delete-icon"
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragEnabled(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDelete(task._id);
              setTimeout(() => setDragEnabled(true), 0);
            }}
          />
        </div>
        <p>{task.description}</p>
      </div>
    );
  }

  function DroppableColumn({ column, children }) {
    const { setNodeRef } = useDroppable({
      id: column,
    });

    return (
      <div className="kanban-column" ref={setNodeRef}>
        <h2>{column}</h2>
        <div className="task-list">{children}</div>
      </div>
    );
  }

  return (
    <>
    <Navbar user={user} onLogout={handleLogout}></Navbar>
    <div className="dashboard-wrapper">
      <div className="view-toggle-buttons">
        <button onClick={() => setActiveView('board')} className={activeView === 'board' ? 'active' : ''}>
          Kanban Board
        </button>
        <button onClick={() => setActiveView('form')} className={activeView === 'form' ? 'active' : ''}>
          Create Task
        </button>
      </div>
      <div className="flip-card-wrapper">
        <div className={`flip-card-inner ${activeView === 'form' ? 'flip' : ''}`}>
          <div className="flip-card-front">
            <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
              <div className="kanban-board">
                {columns.map((column) => {
                  const columnTasks = tasks.filter(task => task.status === column);
                  return (
                    <DroppableColumn key={column} column={column}>
                      {columnTasks.map(task => (
                        <DraggableTask key={task._id} task={task} />
                      ))}
                    </DroppableColumn>
                  );
                })}
              </div>
            </DndContext>
          </div>
          <div className="flip-card-back">
            <div className="task-form">
              <h2>Create New Task</h2>
              <form className="create-task-form" onSubmit={handleSubmit}>
                <label>
                  <h4>Title</h4>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                </label>
                <label>
                  <h4>Description</h4>
                  <textarea name="description" value={formData.description} onChange={handleChange} required />
                </label>
                <label>
                  <h4>Status</h4>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </label>
                <label>
                  <h4>Priority</h4>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
                {/* <label>
                  <h4>Assign to User</h4>
                  <input type="text" name="assignedUser" value={formData.assignedUser} onChange={handleChange} />
                </label> */}
                <button type="submit">Create Task</button>
                <button type="button" onClick={handleSmartAssign} style={{ background: '#00b894', marginTop: '10px' }}>
                  Smart Assign
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    {selectedTask && (
      <div className="task-modal-overlay" onClick={() => setSelectedTask(null)}>
        <div className={`task-modal ${selectedTask.priority.toLowerCase()}`} onClick={e => e.stopPropagation()}>
          <h2>{selectedTask.title}</h2>
          <p><strong>Status:</strong> {selectedTask.status}</p>
          <p><strong>Priority:</strong> {selectedTask.priority}</p>
          <p><strong>Assigned To:</strong> {selectedTask.assignedUser?.FullName || 'Unassigned'}</p>
          <p><strong>Description:</strong></p>
          <div className="task-description-scroll">{selectedTask.description}</div>
          <button onClick={() => setSelectedTask(null)}>Close</button>
        </div>
      </div>
    )}
    </>
  );
};

export default Dashboard;
