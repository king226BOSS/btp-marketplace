import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET tous les artisans (Recherche Avancée)
router.get('/', async (req, res) => {
  try {
    const { q, category, location, minRating } = req.query;
    
    try {
      let sql = "SELECT * FROM users WHERE role = 'artisan'";
      let params = [];
      let counter = 1;

      // Recherche par mots clés (sur le nom, description, ou catégorie)
      if (q) {
        sql += ` AND (name ILIKE $${counter} OR professional_title ILIKE $${counter} OR category ILIKE $${counter})`;
        params.push(`%${q}%`);
        counter++;
      }

      // Filtrer par lieu
      if (location) {
        sql += ` AND location ILIKE $${counter}`;
        params.push(`%${location}%`);
        counter++;
      }

      // Filtrer par catégorie stricte (si on clique sur un badge)
      if (category) {
        sql += ` AND category = $${counter}`;
        params.push(category);
        counter++;
      }

      // Filtrer par note minimum
      if (minRating) {
        sql += ` AND rating >= $${counter}`;
        params.push(parseFloat(minRating));
        counter++;
      }

      // Recherche par proximité GPS (Formule Haversine en SQL)
      const { lat, lng, radius } = req.query;
      if (lat && lng) {
        const R = 6371; // Rayon de la Terre en km
        sql += ` AND latitude IS NOT NULL AND longitude IS NOT NULL`;
        sql += ` AND (
          ${R} * 2 * ASIN(SQRT(
            POWER(SIN((RADIANS(latitude) - RADIANS($${counter})) / 2), 2) +
            COS(RADIANS($${counter})) * COS(RADIANS(latitude)) *
            POWER(SIN((RADIANS(longitude) - RADIANS($${counter + 1})) / 2), 2)
          ))
        ) <= $${counter + 2}`;
        params.push(parseFloat(lat), parseFloat(lat), parseFloat(lng), parseFloat(radius || 10));
        counter += 3;

        // Trier par distance
        sql += ` ORDER BY (
          ${R} * 2 * ASIN(SQRT(
            POWER(SIN((RADIANS(latitude) - RADIANS(${parseFloat(lat)})) / 2), 2) +
            COS(RADIANS(${parseFloat(lat)})) * COS(RADIANS(latitude)) *
            POWER(SIN((RADIANS(longitude) - RADIANS(${parseFloat(lng)})) / 2), 2)
          ))
        ) ASC`;
      } else {
        // Premium d'abord, puis par meilleure note
        sql += ` ORDER BY is_premium DESC, rating DESC`;
      }

      const { rows } = await query(sql, params);
      res.json(rows);
    } catch(dbErr) {
      console.warn("Table probablement non initialisée. Retour des mock datas:", dbErr.message);
      res.json([]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un artisan spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const { rows } = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'artisan']);
      if (rows.length === 0) return res.status(404).json({ error: 'Artisan non trouvé' });
      res.json(rows[0]);
    } catch(dbErr) {
      res.json({ id: req.params.id, name: 'Mock Artisan for ' + req.params.id });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
