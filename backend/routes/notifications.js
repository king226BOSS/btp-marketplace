import express from 'express';
import { query } from '../db/index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès refusé' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// GET: Récupérer les notifications de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Marquer une notification comme lue
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Supprimer toutes les notifications lues
router.delete('/read', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE', [req.user.id]);
    res.json({ message: 'Notifications supprimées' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
