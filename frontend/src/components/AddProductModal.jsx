import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Tag } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onAdd, editingProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'sac',
    category: 'Ciment',
    image_url: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: editingProduct.price,
        unit: editingProduct.unit,
        category: editingProduct.category,
        image_url: editingProduct.image_url || ''
      });
    } else {
      setFormData({ name: '', description: '', price: '', unit: 'sac', category: 'Ciment', image_url: '' });
    }
  }, [editingProduct, isOpen]);

  const categories = ['Ciment', 'Granulats', 'Fer', 'Briques', 'Plomberie', 'Électricité', 'Peinture'];
  const units = ['unite', 'sac', 'tonne', 'm3', 'kg', 'litre'];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
      const url = editingProduct ? `http://localhost:5000/api/products/${editingProduct.id}` : 'http://localhost:5000/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...formData, supplierId: user.id, inStock: true })
      });
      
      if (response.ok) {
        const savedProduct = await response.json();
        onAdd(savedProduct); // This will call handleProductSaved in Dashboard
        onClose();
        setFormData({ name: '', description: '', price: '', unit: 'sac', category: 'Ciment', image_url: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3>Ajouter un produit au catalogue</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du produit</label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Ex: Ciment Diamond CPJ 45" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Prix (FCFA)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem' }} 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Unité</label>
              <select className="form-control" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <div style={{ position: 'relative' }}>
              <Tag size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label>URL de l'image (optionnel)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="https://..." 
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Enregistrer le produit
          </button>
        </form>
      </div>
    </div>
  );
}
