import express from 'express';
import { query } from '../db/index.js';
import { createNotification } from '../utils/notifications.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage as cloudStorage } from '../config/cloudinary.js';

// Configuration stockage identique à auth.js
const useCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'votrecle';
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/quotes/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `quote-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: useCloudinary ? cloudStorage : diskStorage });

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
      
      // Notification réelle pour l'artisan
      await createNotification(
        req.app.get('io'), 
        artisanId, 
        'quote_request', 
        `Nouvelle demande de devis pour : ${serviceRequired}`, 
        `/dashboard`
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

// PUT répondre à un devis (par l'artisan) avec document optionnel
router.put('/:id/reply', upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedAmount, artisanReply, status } = req.body;
    
    // Récupérer l'URL du document si présent
    let documentUrl = null;
    if (req.file) {
      documentUrl = useCloudinary ? req.file.path : `http://localhost:5000/uploads/quotes/${req.file.filename}`;
    }

    try {
      const sql = `
        UPDATE quotes 
        SET estimated_amount = $1, artisan_reply = $2, status = $3, document_url = COALESCE($4, document_url), updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 RETURNING *
      `;
      const { rows } = await query(sql, [estimatedAmount, artisanReply, status || 'accepte', documentUrl, id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Devis non trouvé' });
      
      const quote = rows[0];
      // Notification réelle pour le client
      await createNotification(
        req.app.get('io'),
        quote.client_id,
        'quote_accepted',
        `Votre devis pour ${quote.service_required} a reçu une réponse.`,
        `/dashboard`
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
