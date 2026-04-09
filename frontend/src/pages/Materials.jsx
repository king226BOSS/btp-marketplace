import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Package } from 'lucide-react';

const categories = ['Tout', 'Ciment', 'Fer à béton', 'Agrégats', 'Bois', 'Équipement'];

export default function Materials() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tout');

  const fetchProducts = async (cat = 'Tout', search = '') => {
    setLoading(true);
    let url = 'http://localhost:5000/api/products';
    const params = new URLSearchParams();
    if (cat !== 'Tout') params.append('category', cat);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ color: 'var(--secondary)', textAlign: 'center' }}>Marché des Matériaux</h1>
      <div style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            className="form-control" 
            placeholder="Rechercher un matériau (ciment, fer, sable...)" 
            value={searchTerm} 
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchProducts(selectedCategory, e.target.value);
            }} 
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => {
                setSelectedCategory(cat);
                fetchProducts(cat, searchTerm);
              }}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '2rem',
                border: '1px solid var(--border)',
                background: selectedCategory === cat ? 'var(--primary)' : 'white',
                color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: selectedCategory === cat ? '0 4px 6px -1px rgba(255, 107, 1, 0.4)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {loading ? <p>Chargement...</p> : (
        <div className="grid-3">
          {products.map(p => (
            <div key={p.id} className="card" style={{ padding: '1rem' }}>
              <img src={p.image_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400'} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
              <h3>{p.name}</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.price.toLocaleString()} F / {p.unit}</p>
              <p style={{ fontSize: '0.8rem' }}>Vendu par: {p.supplier_name}</p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}><ShoppingCart size={16} /> Acheter</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
