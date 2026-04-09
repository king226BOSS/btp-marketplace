import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_pour_btp_market_mvp';

// Middleware: vérifier le token (artisan ou admin)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

// GET: Statistiques analytiques de l'artisan connecté
router.get('/artisan-stats', requireAuth, async (req, res) => {
  const artisanId = req.user.id;
  try {
    try {
      // Incrémenter le compteur de vues (simulé)
      const [quotesData, artisanData, reviewsData] = await Promise.all([
        // Toutes les demandes de devis de cet artisan (12 derniers mois)
        query(`
          SELECT 
            DATE_TRUNC('month', created_at) AS month,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'termine') AS done,
            COALESCE(SUM(estimated_amount) FILTER (WHERE status = 'termine'), 0) AS revenue
          FROM quotes 
          WHERE artisan_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
          GROUP BY month
          ORDER BY month ASC
        `, [artisanId]),
        // Infos de l'artisan (vues, note, premium)
        query('SELECT id, name, rating, reviews_count, profile_views, is_premium, premium_until FROM users WHERE id = $1', [artisanId]),
        // Taux d'acceptation global
        query(`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status IN ('accepte','termine')) AS accepted,
            COUNT(*) FILTER (WHERE status = 'en_attente') AS pending,
            COUNT(*) FILTER (WHERE status = 'termine') AS done,
            COALESCE(SUM(estimated_amount) FILTER (WHERE status = 'termine'), 0) AS total_revenue
          FROM quotes WHERE artisan_id = $1
        `, [artisanId])
      ]);

      const artisan = artisanData.rows[0] || {};
      const global = reviewsData.rows[0] || {};

      // Données mensuelles pour les graphiques
      const monthlyRevenue = quotesData.rows.map(r => ({
        month: new Date(r.month).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        revenus: parseFloat(r.revenue),
        devis: parseInt(r.total),
        termines: parseInt(r.done)
      }));

      res.json({
        artisan,
        monthly: monthlyRevenue,
        total_quotes: parseInt(global.total) || 0,
        accepted_quotes: parseInt(global.accepted) || 0,
        pending_quotes: parseInt(global.pending) || 0,
        done_quotes: parseInt(global.done) || 0,
        total_revenue: parseFloat(global.total_revenue) || 0,
        acceptance_rate: global.total > 0 
          ? Math.round((global.accepted / global.total) * 100) 
          : 0
      });

    } catch(dbErr) {
      console.warn('DB Error:', dbErr.message);
      // Mock data pour démo
      res.json({
        artisan: { name: 'Artisan Demo', rating: 4.5, profile_views: 142, is_premium: false },
        monthly: [
          { month: 'Jan 25', revenus: 150000, devis: 3, termines: 2 },
          { month: 'Fév 25', revenus: 280000, devis: 5, termines: 4 },
          { month: 'Mar 25', revenus: 200000, devis: 4, termines: 3 },
          { month: 'Avr 25', revenus: 520000, devis: 8, termines: 6 },
          { month: 'Mai 25', revenus: 390000, devis: 6, termines: 5 },
          { month: 'Jun 25', revenus: 640000, devis: 9, termines: 7 }
        ],
        total_quotes: 35, accepted_quotes: 28, pending_quotes: 3, done_quotes: 27,
        total_revenue: 2180000, acceptance_rate: 80
      });
    }
  } catch(err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST: Souscrire au Premium (simulé - en prod = appel Orange Money réel)
router.post('/subscribe-premium', requireAuth, async (req, res) => {
  const { plan, phoneNumber, operator } = req.body; // plan: 'monthly' (3000F) ou 'yearly' (25000F)
  const artisanId = req.user.id;

  const prices = { monthly: 3000, yearly: 25000 };
  const durations = { monthly: 30, yearly: 365 };

  if (!prices[plan]) return res.status(400).json({ error: 'Plan invalide.' });

  try {
    // Simulation paiement Mobile Money (1.5s délai)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + durations[plan]);

      const { rows } = await query(
        'UPDATE users SET is_premium = TRUE, premium_until = $1 WHERE id = $2 RETURNING id, name, is_premium, premium_until',
        [premiumUntil, artisanId]
      );
      
      res.json({
        message: `✅ Abonnement Premium ${plan === 'monthly' ? 'mensuel' : 'annuel'} activé !`,
        user: rows[0],
        transactionId: 'PREM-' + Math.floor(Math.random() * 1000000),
        pricePaid: prices[plan]
      });
    } catch(dbErr) {
      // Mock
      res.json({
        message: `✅ Abonnement Premium activé (simulation) !`,
        transactionId: 'PREM-MOCK-001',
        pricePaid: prices[plan]
      });
    }
  } catch(err) {
    res.status(500).json({ error: 'Erreur lors de la souscription.' });
  }
});

// POST: Incrémenter les vues d'un profil artisan
router.post('/view/:artisanId', async (req, res) => {
  try {
    await query('UPDATE users SET profile_views = profile_views + 1 WHERE id = $1', [req.params.artisanId]);
    res.json({ ok: true });
  } catch(err) {
    res.json({ ok: false }); // Silencieux
  }
});

export default router;
