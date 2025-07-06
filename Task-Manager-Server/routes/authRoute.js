const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const protect = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/register', async (req, res) => {
  const { FullName,UserName,email, password } = req.body;

  try {
    const userExists = await User.findOne({ UserName });
    const emailExists= await User.findOne({ email });
    
    if (userExists) return res.status(400).json({ message: "User already exists" });
    if (emailExists) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ FullName ,UserName , email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token, user: { id: user._id, FullName: user.FullName, UserName: user.UserName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  const { UserName, password } = req.body;
  try {
    const user = await User.findOne({ UserName });
    if (!user) return res.status(400).json({ message: "Invalid User Name or Password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid User Name or Password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ token, user: { id: user._id, FullName: user.FullName,UserName:user.UserName ,email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;