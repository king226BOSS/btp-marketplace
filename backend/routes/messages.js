import express from 'express';
import { query } from '../db/index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès refusé.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Token invalide.' }); }
};

// GET conversations de l'utilisateur
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT DISTINCT ON (other_id) 
        u.id as other_id, u.name as other_name, u.role as other_role,
        m.content as last_message, m.created_at as time
      FROM (
        SELECT receiver_id as other_id, content, created_at FROM messages WHERE sender_id = $1
        UNION
        SELECT sender_id as other_id, content, created_at FROM messages WHERE receiver_id = $1
      ) m
      JOIN users u ON m.other_id = u.id
      ORDER BY other_id, time DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET historique entre deux utilisateurs
router.get('/:otherId', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [req.user.id, req.params.otherId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
