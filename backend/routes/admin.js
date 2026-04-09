import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

// Middleware: vérifier que l'utilisateur est bien admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

// GET: Statistiques globales de la plateforme
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    try {
      const [users, artisans, quotes, revenue] = await Promise.all([
        query("SELECT COUNT(*) FROM users WHERE role = 'client'"),
        query("SELECT COUNT(*) FROM users WHERE role = 'artisan'"),
        query("SELECT COUNT(*), status FROM quotes GROUP BY status"),
        query("SELECT COALESCE(SUM(estimated_amount), 0) as total FROM quotes WHERE status = 'termine'")
      ]);

      const quoteMap = {};
      quotes.rows.forEach(r => { quoteMap[r.status] = parseInt(r.count); });

      res.json({
        total_clients: parseInt(users.rows[0].count),
        total_artisans: parseInt(artisans.rows[0].count),
        quotes_pending: quoteMap['en_attente'] || 0,
        quotes_accepted: quoteMap['accepte'] || 0,
        quotes_done: quoteMap['termine'] || 0,
        total_revenue: parseFloat(revenue.rows[0].total),
        platform_commission: parseFloat(revenue.rows[0].total) * 0.05  // Commission 5%
      });
    } catch(dbErr) {
      // Mock stats si DB non dispo
      res.json({
        total_clients: 24, total_artisans: 12,
        quotes_pending: 8, quotes_accepted: 5, quotes_done: 30,
        total_revenue: 4500000, platform_commission: 225000
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET: Tous les utilisateurs (artisans + clients)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    try {
      let sql = 'SELECT id, name, email, role, category, location, rating, reviews_count, created_at FROM users WHERE 1=1';
      let params = [];
      let counter = 1;

      if (role) { sql += ` AND role = $${counter}`; params.push(role); counter++; }
      if (search) { sql += ` AND (name ILIKE $${counter} OR email ILIKE $${counter})`; params.push(`%${search}%`); counter++; }

      sql += ` ORDER BY created_at DESC LIMIT $${counter} OFFSET $${counter + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const { rows } = await query(sql, params);
      const total = await query('SELECT COUNT(*) FROM users');
      res.json({ data: rows, total: parseInt(total.rows[0].count) });
    } catch(dbErr) {
      res.json({ data: [], total: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE: Supprimer un utilisateur
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch(err) {
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur." });
  }
});

// PUT: Promouvoir en admin / changer le rôle
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['client', 'artisan', 'fournisseur', 'admin'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'Rôle invalide.' });
    const { rows } = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role', [role, req.params.id]);
    res.json({ message: 'Rôle mis à jour', user: rows[0] });
  } catch(err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET: Tous les devis (pour supervision)
router.get('/quotes', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    try {
      let sql = `
        SELECT q.id, q.service_required, q.status, q.estimated_amount, q.created_at,
               c.name AS client_name, a.name AS artisan_name
        FROM quotes q
        LEFT JOIN users c ON q.client_id = c.id
        LEFT JOIN users a ON q.artisan_id = a.id
      `;
      let params = [];
      if (status) { sql += ' WHERE q.status = $1'; params.push(status); }
      sql += ' ORDER BY q.created_at DESC';
      const { rows } = await query(sql, params);
      res.json(rows);
    } catch(dbErr) {
      res.json([]);
    }
  } catch(err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
