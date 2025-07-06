const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true 
    },
    action:{
        type: String,
        required:true
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Task',
        required:false
    },
    createdAt:{
        type: Date,
        default:Date.now
    }
});

module.exports = mongoose.model('ActionLog', actionLogSchema);