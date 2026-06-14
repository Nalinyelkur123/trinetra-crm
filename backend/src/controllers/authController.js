const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const register = async (req, res) => {
  const { name, phone, email, password, role, company_id } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, phone, email, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, phone, email, hashedPassword, role || 'worker', company_id);
    
    // If worker, also create record in workers table
    if (role === 'worker') {
      db.prepare('INSERT INTO workers (user_id) VALUES (?)').run(info.lastInsertRowid);
    }

    res.status(201).json({ message: 'User registered successfully', userId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be phone or email
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(identifier, identifier);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
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
