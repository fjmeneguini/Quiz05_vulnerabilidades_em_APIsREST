const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_ISSUER = process.env.JWT_ISSUER || 'auth-service';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'microservices-demo';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve estar definido com pelo menos 32 caracteres');
}

// cadastro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    res.status(201).json({ id: result.insertId, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Usuário já existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// rota que o product-service usa para validar token
router.post('/verify', async (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).json({ valid: false, error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

module.exports = router;
