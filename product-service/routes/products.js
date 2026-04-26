const express = require('express');
const axios = require('axios');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

// confere token no auth-service
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }
  try {
    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/auth/verify`, { token });
    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Token inválido' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Falha na verificação do token' });
  }
};

// lista so os produtos do usuario logado
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// busca por id, mas so se for do usuario logado
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// cria produto sempre com o id do usuario logado
router.post('/', verifyToken, async (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'name e price (number) são obrigatórios' });
  }
  if (price <= 0) {
    return res.status(400).json({ error: 'price deve ser maior que zero' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO products (name, price, user_id) VALUES (?, ?, ?)',
      [name, price, req.user.id]
    );
    res.status(201).json({ id: result.insertId, name, price, userId: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// atualiza so se o produto for do usuario logado
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'name e price (number) são obrigatórios' });
  }
  if (price <= 0) {
    return res.status(400).json({ error: 'price deve ser maior que zero' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE products SET name = ?, price = ? WHERE id = ? AND user_id = ?',
      [name, price, id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// deleta so se o produto for do usuario logado
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// endpoint interno: so em dev e com token
router.get('/internal/debug', verifyToken, async (req, res) => {
  if (process.env.ENABLE_INTERNAL_DEBUG !== 'true') {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }

  try {
    const [products] = await db.execute(
      'SELECT id, name, price, user_id, created_at FROM products WHERE user_id = ? ORDER BY id DESC LIMIT 5',
      [req.user.id]
    );

    res.json({
      message: 'DEBUG ENDPOINT (dev)',
      owner_user_id: req.user.id,
      products_sample: products,
      server_time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
