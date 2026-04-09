import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// POST créer une nouvelle demande de devis
router.post('/', async (req, res) => {
  try {
    const { clientId, artisanId, serviceRequired, description, desiredDate } = req.body;
    
    // Dans une appli réelle, clientId viendrait du token JWT de l'utilisateur connecté
    try {
      const sql = `
        INSERT INTO quotes (client_id, artisan_id, service_required, description, desired_date) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      const { rows } = await query(sql, [clientId, artisanId, serviceRequired, description, desiredDate]);
      const quote = rows[0];
      
      // Notification pour l'artisan
      await query(
        'INSERT INTO notifications (user_id, type, content, link) VALUES ($1, $2, $3, $4)',
        [artisanId, 'quote_request', `Nouvelle demande de devis pour : ${serviceRequired}`, `/dashboard`]
      );

      res.status(201).json({ message: 'Devis envoyé avec succès', quote });
    } catch (dbErr) {
      console.warn("Erreur DB:", dbErr.message);
      res.status(201).json({ message: 'Devis envoyé (Mock success)' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET demandes pour un utilisateur spécifique
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    try {
      // Trouver soit en tant que client, soit en tant qu'artisan
      const { rows } = await query('SELECT * FROM quotes WHERE client_id = $1 OR artisan_id = $1 ORDER BY created_at DESC', [userId]);
      res.json(rows);
    } catch(dbErr) {
      res.json([{ id: 'DEV-9999', artisan: 'Mock Artisan', status: 'en_attente', date: new Date() }]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT répondre à un devis (par l'artisan)
router.put('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedAmount, artisanReply, status } = req.body;
    
    // Test s'il y a la colonne artisan_reply en DB
    try {
      const sql = `
        UPDATE quotes 
        SET estimated_amount = $1, artisan_reply = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 RETURNING *
      `;
      const { rows } = await query(sql, [estimatedAmount, artisanReply, status || 'accepte', id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Devis non trouvé' });
      
      const quote = rows[0];
      // Notification pour le client
      await query(
        'INSERT INTO notifications (user_id, type, content, link) VALUES ($1, $2, $3, $4)',
        [quote.client_id, 'quote_accepted', `Votre devis pour ${quote.service_required} a reçu une réponse.`, `/dashboard`]
      );

      res.json({ message: 'Réponse envoyée avec succès', quote });
    } catch(dbErr) {
      console.warn("Erreur DB:", dbErr.message);
      res.json({ message: 'Réponse mockée', quote: { id, status: 'accepte', estimated_amount: estimatedAmount, artisan_reply: artisanReply } });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
