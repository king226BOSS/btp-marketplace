import { useState, useEffect } from 'react';
import { Clock, CheckCircle, FileText, ChevronRight, X, Send, CreditCard, Plus } from 'lucide-react';
import AddProductModal from '../components/AddProductModal';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // États pour la consultation d'un devis
  const [activeQuote, setActiveQuote] = useState(null);
  
  // États côté Artisan (Réponse au devis)
  const [replyText, setReplyText] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  
  // États côté Client (Paiement)
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentOperator, setPaymentOperator] = useState('orange');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [myProducts, setMyProducts] = useState([]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setMyProducts(myProducts.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSaved = (product) => {
    if (editingProduct) {
      setMyProducts(myProducts.map(p => p.id === product.id ? product : p));
    } else {
      setMyProducts([product, ...myProducts]);
    }
    setEditingProduct(null);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      
      // Charger les devis
      fetch(`http://localhost:5000/api/quotes/user/${parsed.id}`)
        .then(res => res.json())
        .then(data => {
          setRequests(data);
          setLoading(false);
        });

      // Si c'est un fournisseur, charger ses produits
      if (parsed.role === 'fournisseur') {
        fetch(`http://localhost:5000/api/products?supplierId=${parsed.id}`)
          .then(res => res.json())
          .then(data => setMyProducts(data));
      }
    } else {
      setLoading(false);
    }
  }, []);

  // --- ACTIONS ARTISAN ---
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${activeQuote.id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedAmount: estimatedAmount,
          artisanReply: replyText,
          status: 'accepte'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setRequests(requests.map(req => req.id === activeQuote.id ? 
        { ...req, status: 'accepte', estimated_amount: estimatedAmount, artisan_reply: replyText } 
        : req
      ));
      
      setActiveQuote(null);
      setReplyText('');
      setEstimatedAmount('');
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // --- ACTIONS CLIENT ---
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: activeQuote.id,
          phoneNumber: paymentPhone,
          operator: paymentOperator,
          amount: activeQuote.estimated_amount
        })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      alert(data.message + "\n\n(Simulation MVP : Le compte artisan a été crédité, le statut de la demande passe à 'terminé/payé')");
      
      // Mettre à jour l'interface locale
      setRequests(requests.map(req => req.id === activeQuote.id ? { ...req, status: 'termine' } : req));
      setShowPayment(false);
      setActiveQuote(null);
      
    } catch (err) {
      alert("Erreur de paiement: " + err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: activeQuote.id,
          clientId: user.id,
          artisanId: activeQuote.artisan_id,
          rating: parseInt(reviewRating),
          comment: reviewComment
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert("Merci pour votre avis ! Il est maintenant visible sur le profil de l'artisan.");
      setShowReview(false);
      setActiveQuote(null);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };


  const getStatusBadge = (status) => {
    switch(status) {
      case 'en_attente':
        return <span className="status-badge status-pending"><Clock size={14} style={{ marginRight: '0.25rem' }} /> En attente</span>;
      case 'accepte':
        return <span className="status-badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}><CheckCircle size={14} style={{ marginRight: '0.25rem' }} /> En attente de paiement</span>;
      case 'termine':
        return <span className="status-badge status-accepted"><CheckCircle size={14} style={{ marginRight: '0.25rem' }} /> Payé & Validé</span>;
      default:
        return <span className="status-badge" style={{ background: '#E5E7EB', color: '#374151' }}>{status}</span>;
    }
  };

  if (!user) return <div className="container" style={{ padding: '4rem' }}><h2 style={{textAlign:'center'}}>Veuillez vous connecter pour voir votre tableau de bord.</h2></div>;

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--secondary)', margin: 0 }}>Mon Tableau de bord</h1>
        <div style={{ fontWeight: 600, color: 'var(--primary)', padding: '0.5rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          Profil: {user.role === 'client' ? 'Client' : 'Professionnel BTP'}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Historique de mes devis</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
             <p style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</p>
          ) : requests.length === 0 ? (
             <p style={{ padding: '2rem', textAlign: 'center' }}>Aucun devis trouvé.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Besoin</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Statut</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', background: activeQuote?.id === req.id ? '#F3F4F6' : 'white' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>DEV-{req.id}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{req.service_required}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{req.estimated_amount ? req.estimated_amount + ' FCFA' : '-'}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => { 
                          setActiveQuote(activeQuote?.id === req.id ? null : req); 
                          setShowPayment(false); 
                          setShowReview(false);
                        }} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem' }}
                      >
                         {activeQuote?.id === req.id ? 'Fermer' : 'Détails'} <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {user.role === 'fournisseur' && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Gestion de mon catalogue</h2>
            <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>+ Ajouter un produit</button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="grid-3" style={{ gap: '1rem' }}>
              {myProducts.map(p => (
                <div key={p.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button 
                      onClick={() => { setEditingProduct(p); setShowAddProduct(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'blue' }}
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}
                    >
                      Supprimer
                    </button>
                  </div>
                  <h4 style={{ margin: 0 }}>{p.name}</h4>
                  <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: 'var(--primary)' }}>{p.price} F / {p.unit}</p>
                  <span style={{ fontSize: '0.8rem', color: p.in_stock ? 'green' : 'red' }}>
                    {p.in_stock ? 'En stock' : 'Rupture'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeQuote && !showPayment && (
        <div className="card" style={{ marginTop: '2rem', padding: '2rem', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Détails du Devis DEV-{activeQuote.id}</h3>
            <button onClick={() => setActiveQuote(null)}><X size={24} color="var(--text-muted)" /></button>
          </div>
          
          <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <p><strong>Service demandé :</strong> {activeQuote.service_required}</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Description du client :</strong><br/>{activeQuote.description}</p>
          </div>

          {user.role !== 'client' && activeQuote.status === 'en_attente' && (
            <form onSubmit={handleReplySubmit}>
              <div className="form-group">
                <label>Votre proposition de prix (FCFA)</label>
                <input type="number" className="form-control" value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Message pour le client</label>
                <textarea className="form-control" value={replyText} onChange={(e) => setReplyText(e.target.value)} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary"><Send size={18} /> Envoyer la proposition</button>
            </form>
          )}

          {activeQuote.status !== 'en_attente' && (
            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Proposition de l'artisan :</h4>
              <div style={{ background: '#E0F2FE', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #0369A1', marginBottom: '1.5rem' }}>
                <p><strong>Prix proposé :</strong> {activeQuote.estimated_amount} FCFA</p>
                <p style={{ marginTop: '0.5rem' }}><strong>Message :</strong><br/>{activeQuote.artisan_reply}</p>
              </div>
              
              {user.role === 'client' && activeQuote.status === 'accepte' && (
                <button onClick={() => setShowPayment(true)} className="btn btn-primary" style={{ background: '#16A34A', color: 'white' }}>
                  <CreditCard size={18} /> Payer et Valider le Devis
                </button>
              )}
              
              {user.role === 'client' && activeQuote.status === 'termine' && !showReview && (
                <button onClick={() => setShowReview(true)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                  Laisser un avis sur le travail
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showReview && activeQuote && (
        <div className="card" style={{ marginTop: '2rem', padding: '2rem', border: '2px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#D97706' }}>Évaluer le professionnel</h3>
            <button onClick={() => setShowReview(false)}><X size={24} color="var(--text-muted)" /></button>
          </div>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Note sur 5</label>
              <select className="form-control" value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                <option value="4">⭐⭐⭐⭐ Très bien</option>
                <option value="3">⭐⭐⭐ Correct</option>
                <option value="2">⭐⭐ Moyen</option>
                <option value="1">⭐ Décevant</option>
              </select>
            </div>
            <div className="form-group">
              <label>Votre commentaire</label>
              <textarea className="form-control" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: '#F59E0B', color: 'white' }}>Publier l'avis</button>
          </form>
        </div>
      )}

      {showPayment && activeQuote && (
        <div className="card" style={{ marginTop: '2rem', padding: '2rem', border: '2px solid #F97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#EA580C' }}>Paiement Sécurisé</h3>
            <button onClick={() => setShowPayment(false)}><X size={24} color="var(--text-muted)" /></button>
          </div>
          <p>Montant : {activeQuote.estimated_amount} FCFA</p>
          <form onSubmit={handlePaymentSubmit}>
            <input type="text" className="form-control" placeholder="Numéro Orange/Moov" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} required />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Payer maintenant</button>
          </form>
        </div>
      )}

      <AddProductModal 
        isOpen={showAddProduct} 
        onClose={() => { setShowAddProduct(false); setEditingProduct(null); }} 
        onAdd={handleProductSaved}
        editingProduct={editingProduct}
      />
    </div>
  );
}
