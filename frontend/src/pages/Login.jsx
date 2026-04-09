import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la connexion');
      
      // Enregistrer le token et l'utilisateur dans le local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--secondary)' }}>Connexion</h1>
        
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Adresse Email</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 1rem' }}>
              <User size={18} color="var(--text-muted)" />
              <input 
                type="email" 
                className="form-control" 
                style={{ border: 'none', boxShadow: 'none' }} 
                placeholder="votre@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 1rem' }}>
              <Lock size={18} color="var(--text-muted)" />
              <input 
                type="password" 
                className="form-control" 
                style={{ border: 'none', boxShadow: 'none' }} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Se connecter</button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Pas encore de compte ? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>S&apos;inscrire</Link>
        </div>
      </div>
    </div>
  );
}
