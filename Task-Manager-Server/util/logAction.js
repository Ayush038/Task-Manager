const ActionLog = require('../models/action');

const logAction = async({ user, action, task })=> {
  try{
    await ActionLog.create({ user, action, task });
  }catch(err){
    console.error("Failed to log action:", err.message);
  }
};

module.exports = logAction;
