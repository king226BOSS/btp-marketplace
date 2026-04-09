import { Link } from 'react-router-dom';
import { Star, MapPin, Crown } from 'lucide-react';

export default function ArtisanCard({ artisan }) {
  return (
    <div className="card" style={{ position: 'relative' }}>
      {artisan.is_premium && (
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 1, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
          <Crown size={12} /> PREMIUM
        </div>
      )}
      <img src={(artisan.portfolio_images && artisan.portfolio_images.length > 0) ? artisan.portfolio_images[0] : (artisan.image || 'https://images.unsplash.com/photo-1541888086950-ef26956ce48e?q=80&w=600&auto=format&fit=crop')} alt={artisan.name} className="artisan-card-img" />
      <div className="artisan-card-content">
        <span className="artisan-badge">{artisan.category}</span>
        <h3 className="artisan-name">{artisan.name}</h3>
        <p className="artisan-role">{artisan.role}</p>
        
        <div className="artisan-meta">
          <div className="meta-item">
            <Star size={16} fill="#F59E0B" color="#F59E0B" />
            <span>{artisan.rating || '—'}</span>
            {artisan.reviews_count > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({artisan.reviews_count})</span>}
          </div>
          <div className="meta-item">
            <MapPin size={16} />
            <span>{artisan.location}</span>
          </div>
          {artisan.distance_km != null && (
            <div className="meta-item" style={{ color: '#F97316' }}>
              <span style={{ fontWeight: 600 }}>
                {artisan.distance_km < 1
                  ? `${(artisan.distance_km * 1000).toFixed(0)} m`
                  : `${artisan.distance_km.toFixed(1)} km`}
              </span>
            </div>
          )}
        </div>
        
        <Link to={`/profile/${artisan.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
          Voir le profil
        </Link>
      </div>
    </div>
  );
}
