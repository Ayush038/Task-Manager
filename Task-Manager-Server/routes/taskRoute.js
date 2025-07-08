const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const protect = require('../middleware/authMiddleware');
const User= require('../models/user');
const logAction= require('../util/logAction');
const ActionLog= require('../models/action');


router.post('/', protect, async (req, res)=>{
  const {title, description, priority,status} = req.body;

  const normalizedTitle = title.trim().toLowerCase();

  const existingTask = await Task.findOne({ title: { $regex: `^${normalizedTitle}$`, $options: 'i' } });
    if (existingTask) {
      return res.status(400).json({ message: 'Task title must be unique.' });
    }
  const reservedNames = ['todo', 'in progress', 'done'];
    if (reservedNames.includes(normalizedTitle)) {
      return res.status(400).json({ message: 'Title cannot be a column name.' });
    }
  try{
    const task = await Task.create({
      title,
      description,
      priority,
      status,
      assignedUser: req.user
    });

    await logAction({
      user:req.user,
      action: `created task titled "${task.title}"`,
      task: task._id
    });

    const populatedTask = await task.populate('assignedUser', 'FullName UserName');
    req.io.emit('taskCreated', populatedTask);

    res.status(201).json(task);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

router.post('/smart-assign', protect, async (req, res) => {
  const { title, description, priority = 'Medium', status = 'Todo' } = req.body;

  const normalizedTitle = title.trim().toLowerCase();

  const reservedNames = ['todo', 'in progress', 'done'];
    if (reservedNames.includes(normalizedTitle)) {
      return res.status(400).json({ message: 'Title cannot be a column name.' });
    }

  const existingTask = await Task.findOne({ title: { $regex: `^${normalizedTitle}$`, $options: 'i' } });
    if (existingTask) {
      return res.status(400).json({ message: 'Task title must be unique.' });
    }
  
  try{
    const taskCounts = await Task.aggregate([
      { $match: { status: { $ne: 'Done' } } },
      { $group: { _id: "$assignedUser", count: { $sum: 1 } } }
    ]);

    const userTaskMap = new Map();
    taskCounts.forEach(tc => {
      if (tc._id) userTaskMap.set(tc._id.toString(), tc.count);
    });

    const users = await User.find();

    let minUser = null;
    let minCount = Infinity;
    users.forEach(user => {
      const count = userTaskMap.get(user._id.toString()) || 0;
      if (count < minCount) {
        minCount = count;
        minUser = user;
      }
    });

    if (!minUser) {
      return res.status(400).json({ message: "No users available for assignment" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      assignedUser: minUser._id,
      createdBy: req.user
    });

    await logAction({
      user:req.user,
      action:`created task titled "${task.title}" via Smart Assign (assigned to ${minUser.UserName})`,
      task: task._id
    });

    const populatedTask = await task.populate('assignedUser', 'FullName UserName');
    req.io.emit('taskCreated', populatedTask);

    res.status(201).json(task);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});


router.get('/', protect, async (req, res) => {
  try{
    const tasks = await Task.find().populate('assignedUser', 'FullName UserName');
    res.status(200).json(tasks);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try{
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    console.log('Incoming lastModifiedAt:', req.body.lastModifiedAt);
    console.log('Task in DB lastModifiedAt:', task.lastModifiedAt.toISOString());
    const incomingTimestamp = new Date(req.body.lastModifiedAt).getTime();
    const currentTimestamp = new Date(task.lastModifiedAt).getTime();

    if (incomingTimestamp !== currentTimestamp) {
      return res.status(409).json({
        message: "Conflict detected. Task has been modified by another user.",
        currentTask: task,
      });
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.assignedUser !== undefined) task.assignedUser = req.body.assignedUser;
    task.lastModifiedAt = new Date();
    console.log(task.lastModifiedAt);
    const updatedTask = await task.save();
    await updatedTask.populate('assignedUser', 'FullName UserName');

    await logAction({
      user:req.user,
      action:`updated task titled "${updatedTask.title}"`,
      task:updatedTask._id
    });

    req.io.emit('taskUpdated', updatedTask);

    res.status(200).json(updatedTask);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});


router.delete('/:id', protect, async (req, res) => {
  try{
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    await task.deleteOne();
    await logAction({
      user: req.user,
      action: `deleted task titled "${task.title}"`,
      task: task._id
    });

    req.io.emit('taskDeleted', task._id);

    res.status(200).json({ message: "Task deleted" });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

router.get('/recent', protect, async (req, res) => {
  try{
    const logs = await ActionLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'FullName UserName')
      .populate('task', 'title');
    res.status(200).json(logs);
  }catch (err){
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
