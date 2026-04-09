import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, CheckCircle, Send } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour le formulaire de devis
  const [serviceRequired, setServiceRequired] = useState('');
  const [description, setDescription] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [quoteStatus, setQuoteStatus] = useState(''); // success, error status

  useEffect(() => {
    // 1. Fetch artisan depuis le backend
    fetch(`http://localhost:5000/api/artisans/${id}`)
      .then(res => res.json())
      .then(data => {
        setArtisan(data);
        // 2. Fetch les avis
        return fetch(`http://localhost:5000/api/reviews/artisan/${id}`);
      })
      .then(res => res.json())
      .then(reviewData => {
        if(Array.isArray(reviewData)) setReviews(reviewData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSendQuote = async (e) => {
    e.preventDefault();
    setQuoteStatus('');
    
    // On simule qu'un client (ID=1) est connecté en dur s'il n'y en a pas dans le localstorage
    const savedUser = localStorage.getItem('user');
    const client = savedUser ? JSON.parse(savedUser) : { id: 1 };
    
    try {
      const response = await fetch('http://localhost:5000/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          artisanId: artisan.id,
          serviceRequired,
          description,
          desiredDate: desiredDate || null
        })
      });
      
      if (!response.ok) throw new Error('Erreur réseau');
      
      setQuoteStatus('success');
      setServiceRequired('');
      setDescription('');
      setDesiredDate('');
    } catch (err) {
      setQuoteStatus('error');
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Chargement du profil...</div>;
  if (!artisan || artisan.error) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Artisan introuvable</div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="profile-header">
        <div className="profile-info">
          <img 
            src={(artisan.portfolio_images && artisan.portfolio_images.length > 0) ? artisan.portfolio_images[0] : (artisan.image || 'https://images.unsplash.com/photo-1541888086950-ef26956ce48e?q=80&w=600&auto=format&fit=crop')} 
            alt={artisan.name} 
            className="profile-avatar" 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>{artisan.name}</h1>
              <button className="btn btn-primary" style={{ flex: 1 }}>Demander un devis</button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => navigate('/messages', { state: { selectedUser: { other_id: artisan.id, other_name: artisan.name, other_role: artisan.role } } })}
              >
                Contacter
              </button>
            </div>
            <p className="artisan-role" style={{ fontSize: '1.2rem' }}>{artisan.professional_title || artisan.role}</p>
            
            <div className="artisan-meta" style={{ marginTop: '1rem' }}>
              <div className="meta-item">
                <Star size={18} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontWeight: 600 }}>{artisan.rating === '0.00' ? 'Nouveau' : artisan.rating}</span>
                {artisan.reviews_count > 0 && <span style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>({artisan.reviews_count} avis)</span>}
              </div>
              <div className="meta-item">
                <MapPin size={18} />
                <span>{artisan.location}</span>
              </div>
              <div className="meta-item" style={{ color: 'var(--primary)' }}>
                <CheckCircle size={18} />
                <span>Profil vérifié</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Colonne Principale */}
        <div>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>À propos / Prestations</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Artisan spécialisé intervenant principalement dans le domaine de : <strong>{artisan.category}</strong>. 
              Contactez-moi pour un devis personnalisé adapté à vos besoins spécifiques.
            </p>
          </section>

          <section>
            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Réalisations / Catalogue</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {artisan.portfolio_images && artisan.portfolio_images.length > 0 ? (
                artisan.portfolio_images.map((img, i) => (
                  <img key={i} src={img} alt={`Réalisation ${i+1}`} style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Aucune image disponible pour le moment.</p>
              )}
            </div>
          </section>
          
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Avis des clients ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Aucun avis pour le moment. Soyez le premier à travailler avec lui !</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{review.client_name || 'Client anonyme'}</span>
                      <div style={{ display: 'flex' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < review.rating ? '#F59E0B' : '#E5E7EB'} color={i < review.rating ? '#F59E0B' : '#E5E7EB'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{review.comment}</p>
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Colonne Sidebar (Contact / Devis) */}
        <div>
          <div className="card" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Demander un devis</h3>
            
            {quoteStatus === 'success' && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>Demande envoyée avec succès ! L'artisan vous répondra via votre tableau de bord.</div>}
            {quoteStatus === 'error' && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>Erreur, veuillez réessayer.</div>}

            <form onSubmit={handleSendQuote}>
              <div className="form-group">
                <label>Objet de la demande</label>
                <input type="text" className="form-control" placeholder="Ex: Rénovation salle de bain" value={serviceRequired} onChange={(e) => setServiceRequired(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Votre besoin</label>
                <textarea className="form-control" placeholder="Décrivez votre projet en détail..." value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
              </div>
              <div className="form-group">
                <label>Date souhaitée (optionnel)</label>
                <input type="date" className="form-control" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={18} />
                Envoyer la demande
              </button>
            </form>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Phone size={20} color="var(--text-muted)" />
                <span style={{ fontWeight: 500 }}>{artisan.phone || 'Non renseigné'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={20} color="var(--text-muted)" />
                <span style={{ fontWeight: 500 }}>{artisan.email}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
