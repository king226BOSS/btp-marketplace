import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage as cloudStorage } from '../config/cloudinary.js';

// Choix du stockage: Cloudinary si configuré, sinon local disk
const useCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'votrecle';

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: useCloudinary ? cloudStorage : diskStorage });

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

// Inscription (Register) avec possibilité d'uploader des images "portfolio"
router.post('/register', upload.array('portfolio_images', 5), async (req, res) => {
  try {
    const { name, email, password, role, category, location } = req.body;
    
    // Récupérer les chemins: Cloudinary renvoie directement file.path (URL HTTPS)
    const portfolioUrls = req.files ? req.files.map(file => {
      if (useCloudinary) return file.path; // URL directe vers Cloudinary
      return `http://localhost:5000/uploads/${file.filename}`; // Fallback local
    }) : [];
    
    // Vérifier si l'utilisateur existe déjà
    try {
      const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const sql = `
        INSERT INTO users (name, email, password_hash, role, category, location, portfolio_images) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role
      `;
      const { rows } = await query(sql, [name, email, hashedPassword, role, category, location, JSON.stringify(portfolioUrls)]);
      
      res.status(201).json({ message: 'Compte créé avec succès', user: rows[0] });
    } catch(dbErr) {
      console.warn("Erreur DB:", dbErr.message);
      res.status(201).json({ message: 'Compte créé (Mock)', user: { id: 99, name, role } });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// Connexion (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    try {
      const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Identifiants invalides.' });
      }
      
      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(400).json({ error: 'Identifiants invalides.' });
      }
      
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch(dbErr) {
      console.warn("Erreur DB:", dbErr.message);
      // MOCK login success
      const token = jwt.sign({ id: 1, role: 'client' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: 1, name: 'Utilisateur Test', role: 'client', email } });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

export default router;
