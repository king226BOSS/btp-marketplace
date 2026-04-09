import express from 'express';
import { query } from '../db/index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès refusé. Token manquant.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// GET: Liste tous les produits (avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { category, supplierId, search } = req.query;
    let sql = `
      SELECT p.*, u.name as supplier_name, u.location as supplier_location 
      FROM products p
      JOIN users u ON p.supplier_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let counter = 1;

    if (category) {
      sql += ` AND p.category = $${counter}`;
      params.push(category);
      counter++;
    }

    if (supplierId) {
      sql += ` AND p.supplier_id = $${counter}`;
      params.push(supplierId);
      counter++;
    }

    if (search) {
      sql += ` AND (p.name ILIKE $${counter} OR p.description ILIKE $${counter})`;
      params.push(`%${search}%`);
      counter++;
    }

    sql += ` ORDER BY p.created_at DESC`;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Ajouter un produit (réservé aux fournisseurs)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'fournisseur' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Rôle non autorisé pour cette action.' });
  }

  try {
    const { name, description, price, unit, imageUrl, category } = req.body;
    const sql = `
      INSERT INTO products (supplier_id, name, description, price, unit, image_url, category)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const { rows } = await query(sql, [req.user.id, name, description, price, unit, imageUrl, category]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Modifier un produit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, unit, imageUrl, category, inStock } = req.body;
    
    // Vérifier la propriété (ou admin)
    const checkSql = `SELECT supplier_id FROM products WHERE id = $1`;
    const checkRes = await query(checkSql, [id]);
    
    if (checkRes.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    if (checkRes.rows[0].supplier_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const sql = `
      UPDATE products 
      SET name = $1, description = $2, price = $3, unit = $4, image_url = $5, category = $6, in_stock = $7
      WHERE id = $8 RETURNING *
    `;
    const { rows } = await query(sql, [name, description, price, unit, imageUrl, category, inStock, id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Supprimer un produit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const checkRes = await query(`SELECT supplier_id FROM products WHERE id = $1`, [id]);
    
    if (checkRes.rows[0].supplier_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await query(`DELETE FROM products WHERE id = $1`, [id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
