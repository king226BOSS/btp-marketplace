import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Simulation API Orange Money / Moov Money
router.post('/initiate', async (req, res) => {
  try {
    const { quoteId, phoneNumber, operator, amount } = req.body;
    
    // 1. Ici on ferait un vrai appel à l'API de l'opérateur (Orange/Moov)
    // Ex: axios.post('https://api.orange.com/oauth/v3/...', { ... })
    
    // 2. Pour le MVP, on simule que l'opérateur valide la transaction après 2 secondes...
    setTimeout(async () => {
      try {
        // Enregistrement de la confirmation de paiement en DB
        const sql = `
          UPDATE quotes 
          SET status = 'termine', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 RETURNING *
        `;
        const { rows } = await query(sql, [quoteId]);
        
        // Dans une vraie app, on utiliserait un Webhook pour la confirmation asynchrone
        // Mais ici on renvoie la réponse directement
        if (rows.length === 0) return res.status(404).json({ error: 'Devis introuvable' });
        
        res.json({ 
          message: `Paiement de ${amount} FCFA via ${operator === 'orange' ? 'Orange Money' : 'Moov Money'} réussi !`, 
          quote: rows[0],
          transactionId: 'TXN-' + Math.floor(Math.random() * 1000000)
        });
      } catch (dbErr) {
        console.warn('Erreur BDD Paiement:', dbErr.message);
        res.status(500).json({ error: 'Erreur BDD lors de la validation du paiement' });
      }
    }, 1500); // Simulation délai réseau (1.5s)
    
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'initiation du paiement' });
  }
});

export default router;
