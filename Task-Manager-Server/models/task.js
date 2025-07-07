const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:{
    type: String,
    required: true,
    unique: true 
  },
  description:{
    type: String,
    required: true
  },
  priority:{
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status:{
    type: String,
    enum: ['Todo', 'In Progress', 'Done'],
    default: 'Todo'
  },
  assignedUser:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedAt:{
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
