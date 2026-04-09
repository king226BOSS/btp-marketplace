import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, TrendingUp, Trash2, Shield, Search } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchStats = async () => {
    const res = await fetch('http://localhost:5000/api/admin/stats', { headers: getAuthHeader() });
    const data = await res.json();
    setStats(data);
  };

  const fetchUsers = async (s = '', r = '') => {
    const url = new URL('http://localhost:5000/api/admin/users');
    if (s) url.searchParams.append('search', s);
    if (r) url.searchParams.append('role', r);
    const res = await fetch(url, { headers: getAuthHeader() });
    const data = await res.json();
    setUsers(data.data || []);
  };

  const fetchQuotes = async () => {
    const res = await fetch('http://localhost:5000/api/admin/quotes', { headers: getAuthHeader() });
    const data = await res.json();
    setQuotes(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchQuotes()]).finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm(`Supprimer l'utilisateur #${id} ?`)) return;
    await fetch(`http://localhost:5000/api/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeader() });
    setUsers(users.filter(u => u.id !== id));
  };

  const handleChangeRole = async (id, newRole) => {
    await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
      method: 'PUT', headers: getAuthHeader(),
      body: JSON.stringify({ role: newRole })
    });
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(search, roleFilter);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'en_attente': return { bg: '#FEF3C7', color: '#92400E' };
      case 'accepte': return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'termine': return { bg: '#D1FAE5', color: '#065F46' };
      default: return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  if (!token || user?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <Shield size={48} color="var(--text-muted)" />
        <h2 style={{ marginTop: '1rem' }}>Accès Restreint</h2>
        <p style={{ color: 'var(--text-muted)' }}>Vous devez être connecté en tant qu'administrateur pour accéder à cette page.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Se connecter</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      {/* SIDEBAR ADMIN */}
      <aside style={{ width: '240px', background: 'var(--secondary)', color: 'white', padding: '2rem 0', flexShrink: 0 }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>Administration</div>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>BTP Market</h2>
        </div>
        
        {[
          { key: 'stats', icon: <TrendingUp size={18}/>, label: 'Statistiques' },
          { key: 'users', icon: <Users size={18}/>, label: 'Utilisateurs' },
          { key: 'quotes', icon: <FileText size={18}/>, label: 'Devis & Transactions' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.875rem 1.5rem',
            background: activeTab === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === tab.key ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
            border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem',
            borderLeft: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '2.5rem', background: '#F1F5F9', overflowY: 'auto' }}>
        {/* TAB: STATS */}
        {activeTab === 'stats' && (
          <div>
            <h1 style={{ marginBottom: '2rem', color: 'var(--secondary)' }}>Tableau de bord</h1>
            {loading ? <p>Chargement...</p> : stats && (
              <>
                <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Clients inscrits', value: stats.total_clients, color: '#3B82F6' },
                    { label: 'Artisans & Fournisseurs', value: stats.total_artisans, color: '#8B5CF6' },
                    { label: 'Devis en attente', value: stats.quotes_pending, color: '#F59E0B' },
                    { label: 'Contrats acceptés', value: stats.quotes_accepted, color: '#10B981' },
                    { label: 'Projets terminés', value: stats.quotes_done, color: '#059669' },
                    { label: 'Volume total traité', value: `${stats.total_revenue?.toLocaleString('fr-FR')} FCFA`, color: '#DC2626' },
                  ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.5rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                      <h2 style={{ color: stat.color, fontSize: '2rem', margin: 0 }}>{stat.value}</h2>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--secondary) 0%, #1a4a6b 100%)', color: 'white' }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Commission Plateforme (5%)</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Basée sur les projets terminés</p>
                  <h1 style={{ color: 'white', fontSize: '3rem', margin: 0 }}>
                    {stats.platform_commission?.toLocaleString('fr-FR')} FCFA
                  </h1>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
          <div>
            <h1 style={{ marginBottom: '2rem', color: 'var(--secondary)' }}>Gestion des Utilisateurs</h1>
            <form onSubmit={handleUserSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <Search size={18} color="var(--text-muted)"/>
                <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%' }} />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-control" style={{ flex: '0 0 auto', width: '160px' }}>
                <option value="">Tous les rôles</option>
                <option value="client">Client</option>
                <option value="artisan">Artisan</option>
                <option value="fournisseur">Fournisseur</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary">Filtrer</button>
            </form>

            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Nom', 'Email', 'Rôle', 'Note', 'Inscription', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', fontSize: '0.875rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>#{u.id}</td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}>
                          <option value="client">client</option>
                          <option value="artisan">artisan</option>
                          <option value="fournisseur">fournisseur</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem' }}>⭐ {u.rating || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun utilisateur trouvé.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: QUOTES */}
        {activeTab === 'quotes' && (
          <div>
            <h1 style={{ marginBottom: '2rem', color: 'var(--secondary)' }}>Suivi des Devis & Transactions</h1>
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Client', 'Artisan', 'Service', 'Montant', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', fontSize: '0.875rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => {
                    const s = getStatusColor(q.status);
                    return (
                      <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>DEV-{q.id}</td>
                        <td style={{ padding: '1rem' }}>{q.client_name || '—'}</td>
                        <td style={{ padding: '1rem' }}>{q.artisan_name || '—'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{q.service_required}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{q.estimated_amount ? q.estimated_amount.toLocaleString('fr-FR') + ' F' : '—'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                            {q.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(q.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                  {quotes.length === 0 && <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune transaction trouvée.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
