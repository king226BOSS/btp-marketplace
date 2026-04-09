import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Star, Eye, CheckCircle, Clock, Crown, CreditCard, Zap } from 'lucide-react';

const COLORS = ['#F97316', '#3B82F6', '#10B981'];

// Formatage FCFA
const fmt = (n) => n ? n.toLocaleString('fr-FR') + ' FCFA' : '0 FCFA';

export default function ArtisanAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [premiumPhone, setPremiumPhone] = useState('');
  const [premiumOperator, setPremiumOperator] = useState('orange');
  const [subscribing, setSubscribing] = useState(false);

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5000/api/analytics/artisan-stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/subscribe-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, phoneNumber: premiumPhone, operator: premiumOperator })
      });
      const data = await res.json();
      alert(data.message + `\nTransaction: ${data.transactionId}\nMontant débité: ${data.pricePaid} FCFA`);
      setShowPremiumModal(false);
      // Rafraîchir les stats
      window.location.reload();
    } catch {
      alert("Erreur lors de la souscription.");
    } finally {
      setSubscribing(false);
    }
  };

  if (!user || user.role === 'client') {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Réservé aux artisans et fournisseurs</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Retour</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--secondary)', margin: 0 }}>Mes Statistiques</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Tableau de bord analytique de votre activité</p>
        </div>
        {stats?.artisan?.is_premium ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
            <Crown size={20} /> Compte Premium Actif
          </div>
        ) : (
          <button onClick={() => setShowPremiumModal(true)} className="btn" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={20} /> Passer en Premium
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Chargement de vos statistiques...</div>
      ) : stats && (
        <>
          {/* KPI CARDS */}
          <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
            {[
              { icon: <TrendingUp size={24} />, label: 'Revenus totaux', value: fmt(stats.total_revenue), color: '#059669', bg: '#D1FAE5', trend: '+12.4%' },
              { icon: <CheckCircle size={24} />, label: 'Taux d\'acceptation', value: `${stats.acceptance_rate}%`, color: '#2563EB', bg: '#DBEAFE', trend: '+5.2%' },
              { icon: <Eye size={24} />, label: 'Vues du profil', value: (stats.artisan?.profile_views || 142).toLocaleString(), color: '#7C3AED', bg: '#EDE9FE', trend: '+18.1%' },
              { icon: <Star size={24} />, label: 'Note moyenne', value: `${stats.artisan?.rating || '—'} / 5`, color: '#D97706', bg: '#FEF3C7', trend: 'Stable' },
              { icon: <Clock size={24} />, label: 'Devis en attente', value: stats.pending_quotes, color: '#EA580C', bg: '#FFF7ED', trend: '-2' },
              { icon: <Zap size={24} />, label: 'Projets terminés', value: stats.done_quotes, color: '#059669', bg: '#D1FAE5', trend: '+4' },
            ].map((kpi, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ background: kpi.bg, color: kpi.color, padding: '0.875rem', borderRadius: '12px', flexShrink: 0 }}>
                  {kpi.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>{kpi.label}</p>
                    {kpi.trend && (
                      <span style={{ fontSize: '0.7rem', color: kpi.trend.startsWith('+') ? '#059669' : '#DC2626', background: kpi.trend.startsWith('+') ? '#D1FAE5' : '#FEE2E2', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {kpi.trend}
                      </span>
                    )}
                  </div>
                  <h3 style={{ color: '#1F2937', fontSize: '1.75rem', margin: '0.2rem 0 0' }}>{kpi.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', 
            padding: '1.25rem 2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', 
            justifyContent: 'space-between', borderLeft: '6px solid #F59E0B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Zap size={24} color="#F59E0B" />
              <div>
                <h4 style={{ margin: 0, color: 'var(--secondary)' }}>Score de Performance</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vous faites partie du <strong>top 10%</strong> des artisans en {stats.artisan?.category || 'votre domaine'} ce mois-ci !</p>
              </div>
            </div>
            <button className="btn" style={{ fontSize: '0.85rem', color: '#B45309', background: '#FEF3C7', padding: '0.5rem 1rem' }}>Voir mon classement</button>
          </div>

          {/* GRAPHIQUES */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Graphique revenus mensuels */}
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Revenus mensuels (FCFA)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.monthly}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => (v/1000) + 'k'} />
                  <Tooltip formatter={(v) => [v.toLocaleString() + ' F', 'Revenus']} />
                  <Area type="monotone" dataKey="revenus" stroke="#F97316" strokeWidth={2} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique circulaire statut devis */}
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Statut des devis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Terminés', value: stats.done_quotes || 1 },
                      { name: 'En attente', value: stats.pending_quotes || 0 },
                      { name: 'Acceptés', value: (stats.accepted_quotes - stats.done_quotes) || 0 },
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  >
                    {COLORS.map((color, index) => <Cell key={index} fill={color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                {['Terminés', 'En attente', 'Acceptés'].map((l, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '10px', height: '10px', background: COLORS[i], borderRadius: '50%', display: 'inline-block' }}></span>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Graphique barres devis par mois */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Volume de devis reçus par mois</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="devis" name="Reçus" fill="#3B82F6" radius={[4,4,0,0]} />
                <Bar dataKey="termines" name="Terminés" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SECTION PREMIUM */}
          {!stats.artisan?.is_premium && (
            <div className="card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Crown size={28} color="#F59E0B" />
                    <h2 style={{ color: '#F59E0B', margin: 0 }}>Passez en Premium</h2>
                  </div>
                  <p style={{ opacity: 0.8, marginBottom: '1.5rem', maxWidth: '500px' }}>
                    Débloquez la visibilité maximale : votre profil apparaît en tête des résultats de recherche avec un badge doré visible par tous les clients.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {['🏆 Badge Premium doré sur votre profil', '🔝 Priorité dans les résultats de recherche', '📊 Accès aux statistiques avancées', '📞 Support prioritaire'].map((item, i) => (
                      <li key={i} style={{ fontSize: '0.95rem', opacity: 0.9 }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  {[
                    { plan: 'monthly', price: '3 000 FCFA', label: 'Par mois', popular: false },
                    { plan: 'yearly', price: '25 000 FCFA', label: 'Par an (−30%)', popular: true },
                  ].map(p => (
                    <div key={p.plan} onClick={() => { setSelectedPlan(p.plan); setShowPremiumModal(true); }}
                      style={{ background: p.popular ? '#F59E0B' : 'rgba(255,255,255,0.1)', padding: '1.5rem 2rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
                      {p.popular && <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#DC2626', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>POPULAIRE</span>}
                      <div style={{ fontWeight: 700, fontSize: '1.5rem', color: p.popular ? '#1E293B' : 'white' }}>{p.price}</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: p.popular ? '#1E293B' : 'rgba(255,255,255,0.7)' }}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL PAIEMENT PREMIUM */}
      {showPremiumModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}>
            <h2 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crown size={24} color="#F59E0B" /> Activer le Premium
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Plan {selectedPlan === 'monthly' ? 'mensuel — 3 000 FCFA' : 'annuel — 25 000 FCFA'}
            </p>
            <form onSubmit={handleSubscribe}>
              <div className="form-group">
                <label>Opérateur Mobile Money</label>
                <select className="form-control" value={premiumOperator} onChange={e => setPremiumOperator(e.target.value)}>
                  <option value="orange">Orange Money</option>
                  <option value="moov">Moov Money</option>
                </select>
              </div>
              <div className="form-group">
                <label>Numéro de téléphone</label>
                <input type="text" className="form-control" placeholder="Ex: 70 00 00 00" value={premiumPhone} onChange={e => setPremiumPhone(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPremiumModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" disabled={subscribing} className="btn" style={{ flex: 1, background: '#F59E0B', color: 'white', fontWeight: 600, border: 'none' }}>
                  <CreditCard size={18} />
                  {subscribing ? 'Traitement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
