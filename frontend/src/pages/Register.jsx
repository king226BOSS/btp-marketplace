import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client', // client, artisan ou fournisseur
    category: '', 
    location: ''
  });
  
  // Nouvel état pour gérer les images
  const [images, setImages] = useState([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e) => {
    setImages(e.target.files);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // On construit un objet FormData indispensable pour uploader des images
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('email', formData.email);
    dataToSend.append('password', formData.password);
    dataToSend.append('role', formData.role);
    dataToSend.append('location', formData.location);
    if (formData.role !== 'client') {
      dataToSend.append('category', formData.category);
    }
    
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        dataToSend.append('portfolio_images', images[i]);
      }
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        // Important: Ne pas mettre Content-Type, le navigateur ajoutera 'multipart/form-data' automatiquement
        body: dataToSend
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création du compte');
      
      setSuccess('Compte créé avec succès ! Redirection...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--secondary)' }}>Créer un compte</h1>
        
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}
        {success && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Je suis un...</label>
            <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
              <option value="client">Client (Je cherche un professionnel)</option>
              <option value="artisan">Artisan (Je propose mes services)</option>
              <option value="fournisseur">Fournisseur (Je vends des matériaux)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nom {formData.role !== 'client' ? "de l'entreprise" : "Complet"}</label>
            <input type="text" name="name" className="form-control" placeholder="Entrez votre nom" value={formData.name} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Adresse Email</label>
            <input type="email" name="email" className="form-control" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" name="password" className="form-control" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength="6" />
          </div>

          <div className="form-group">
            <label>Ville ou Quartier</label>
            <input type="text" name="location" className="form-control" placeholder="Ex: Ouaga 2000" value={formData.location} onChange={handleChange} />
          </div>

          {formData.role !== 'client' && (
            <>
              <div className="form-group">
                <label>Domaine d'expertise / Catégorie</label>
                <input type="text" name="category" className="form-control" placeholder="Ex: Maçonnerie, Peinture, Fer à béton..." value={formData.category} onChange={handleChange} required />
              </div>
              
              <div className="form-group" style={{ background: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label>Vos Réalisations ou Catalogue (Photos)</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Vous pouvez sélectionner jusqu'à 5 photos pour mettre en valeur votre travail ou vos produits.
                </p>
                <input 
                  type="file" 
                  name="portfolio_images" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'block', width: '100%', padding: '0.5rem 0' }}
                />
              </div>
            </>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>S'inscrire</button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Déjà un compte ? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
