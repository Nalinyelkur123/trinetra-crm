const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb } = require('../config/db');
const { User, Worker } = require('../models');

const register = async (req, res) => {
  const { name, phone, email, password, role, company_id } = req.body;
  
  try {
    await initDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, phone, email, password: hashedPassword, role: role || 'worker', company_id
    });
    
    // If worker, also create record in workers collection
    if (role === 'worker') {
      await Worker.create({ user_id: user._id });
    }

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be phone or email
  
  try {
    await initDb();
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
