import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardHat, User, LogOut, LayoutDashboard, Shield, Menu, X, Bell } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    if (user) {
      socket.emit('join', user.id);
      
      // Charger le compte initial
      fetch(`http://localhost:5000/api/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        setUnreadCount(data.filter(n => !n.is_read).length);
      });

      socket.on('notification', (notif) => {
        setUnreadCount(prev => prev + 1);
        // Optionnel: afficher un toast ou une alerte
      });
    }

    return () => {
      socket.off('notification');
    };
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* LOGO */}
        <Link to="/" className="logo">
          <HardHat size={28} color="var(--primary)" />
          BTP<span>Market</span>
        </Link>

        {/* LIENS DESKTOP */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className="nav-link">Accueil</Link>
          <Link to="/about" className="nav-link">Comment ça marche</Link>
          <Link to="/materials" className="nav-link">Matériaux</Link>
          <Link to="/messages" className="nav-link">Messages</Link>

          {user ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
                <Bell size={20} color="var(--text-muted)" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '2px 5px',
                    borderRadius: '50%',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Lien Tableau de bord */}
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {user.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                {user.role === 'admin' ? 'Admin' : 'Mon espace'}
              </Link>

              {/* Lien Analytics pour artisans et fournisseurs */}
              {(user.role === 'artisan' || user.role === 'fournisseur') && (
                <Link to="/analytics" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📈 Statistiques
                </Link>
              )}

              {/* Badge nom + rôle */}
              <span style={{ 
                padding: '0.3rem 0.75rem', 
                background: user.role === 'admin' ? '#FEF3C7' : 'var(--surface)', 
                color: user.role === 'admin' ? '#92400E' : 'var(--secondary)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                {user.name?.split(' ')[0]} • {user.role}
              </span>

              {/* Déconnexion */}
              <button onClick={handleLogout} className="btn" style={{ 
                background: 'transparent', border: '1px solid var(--border)', 
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--text-muted)', padding: '0.5rem 1rem'
              }}>
                <LogOut size={16} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Je suis un pro</Link>
              <Link to="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} />
                Connexion
              </Link>
            </>
          )}
        </div>

        {/* BOUTON MOBILE */}
        <button 
          className="btn" 
          style={{ display: 'none', background: 'transparent', border: 'none' }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
