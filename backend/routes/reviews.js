import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// POST: Ajouter un avis (par le client)
router.post('/', async (req, res) => {
  try {
    const { quoteId, clientId, artisanId, rating, comment } = req.body;
    
    // 1. Vérifier que la note est entre 1 et 5
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'La note doit être entre 1 et 5.' });

    // 2. Insérer l'avis
    try {
      const sqlReview = `
        INSERT INTO reviews (quote_id, client_id, artisan_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      const reviewRow = await query(sqlReview, [quoteId, clientId, artisanId, rating, comment]);
      
      // 3. Recalculer la note moyenne de l'artisan
      // On récupère d'abord l'artisan
      const artisanQuery = await query('SELECT rating, reviews_count FROM users WHERE id = $1', [artisanId]);
      if (artisanQuery.rows.length > 0) {
        let currentRating = parseFloat(artisanQuery.rows[0].rating) || 0;
        let currentCount = parseInt(artisanQuery.rows[0].reviews_count) || 0; // Attention si c'était NULL
        
        // Calcul simple d'une nouvelle moyenne
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;
        
        // 4. Mettre à jour l'artisan
        await query('UPDATE users SET rating = $1, reviews_count = $2 WHERE id = $3', [newRating.toFixed(2), newCount, artisanId]);
      }
      
      res.status(201).json({ message: 'Avis publié avec succès', review: reviewRow.rows[0] });
    } catch(dbErr) {
      if(dbErr.code === '23505') { // Code d'erreur unique violation Postgres
         return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour ce projet.' });
      }
      console.warn("Erreur DB:", dbErr.message);
      res.status(201).json({ message: '(Mock) Avis publié.' });
    }
    
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET: Récupérer tous les avis d'un artisan
router.get('/artisan/:artisanId', async (req, res) => {
  try {
    const { artisanId } = req.params;
    try {
      // Jointure pour récupérer le nom du client qui a laissé l'avis
      const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, u.name as client_name 
        FROM reviews r
        JOIN users u ON r.client_id = u.id
        WHERE r.artisan_id = $1
        ORDER BY r.created_at DESC
      `;
      const { rows } = await query(sql, [artisanId]);
      res.json(rows);
    } catch(dbErr) {
      console.warn("Erreur DB:", dbErr.message);
      res.json([]); // Fallback table non existante
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

export default router;
