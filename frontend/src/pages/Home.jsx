import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Filter, Map, List, Navigation } from 'lucide-react';
import ArtisanCard from '../components/ArtisanCard';
import MapView from '../components/MapView';

// Calcul de distance Haversine côté client (pour affichage)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [minRating, setMinRating] = useState('');
  const [radius, setRadius] = useState(10);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'map'
  const [userPosition, setUserPosition] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const navigate = useNavigate();

  const fetchArtisans = (q = '', loc = '', minR = '', lat = null, lng = null, r = 10) => {
    setLoading(true);
    const url = new URL('http://localhost:5000/api/artisans');
    if (q) url.searchParams.append('q', q);
    if (loc) url.searchParams.append('location', loc);
    if (minR) url.searchParams.append('minRating', minR);
    if (lat !== null && lng !== null) {
      url.searchParams.append('lat', lat);
      url.searchParams.append('lng', lng);
      url.searchParams.append('radius', r);
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Calculer la distance côté client si on a la position
          const enriched = data.map(a => ({
            ...a,
            distance_km: (lat && a.latitude && a.longitude)
              ? calcDistance(lat, lng, parseFloat(a.latitude), parseFloat(a.longitude))
              : null
          }));
          setArtisans(enriched);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchArtisans(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArtisans(
      searchTerm, searchLocation, minRating,
      userPosition?.lat, userPosition?.lng, radius
    );
  };

  const handleNearMe = () => {
    setGeoError('');
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeoError("Votre navigateur ne supporte pas la géolocalisation.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition({ lat: latitude, lng: longitude });
        setViewMode('map');
        fetchArtisans('', '', '', latitude, longitude, radius);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError("Position refusée. Autorisez la géolocalisation dans votre navigateur.");
        setGeoLoading(false);
      }
    );
  };

  return (
    <>
      {/* HERO + RECHERCHE */}
      <section className="hero">
        <div className="container">
          <h1>Trouvez les meilleurs pros du BTP près de chez vous</h1>
          <p>La plateforme de référence au Burkina Faso — Maçons, plombiers, électriciens et fournisseurs vérifiés.</p>

          <form onSubmit={handleSearch}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '0', background: 'white',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', marginTop: '1.5rem'
            }}>
              <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem', borderRight: '1px solid var(--border)' }}>
                <Search size={20} color="var(--text-muted)" />
                <input type="text" placeholder="Métier ou spécialité..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', padding: '1rem 0', width: '100%', fontSize: '1rem' }} />
              </div>
              <div style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem', borderRight: '1px solid var(--border)' }}>
                <MapPin size={20} color="var(--text-muted)" />
                <input type="text" placeholder="Ville, Quartier..." value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  style={{ border: 'none', outline: 'none', padding: '1rem 0', width: '100%', fontSize: '1rem' }} />
              </div>
              <div style={{ flex: '0 1 140px', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem', borderRight: '1px solid var(--border)' }}>
                <Filter size={20} color="var(--text-muted)" />
                <select value={minRating} onChange={e => setMinRating(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', padding: '1rem 0', width: '100%' }}>
                  <option value="">Tous les avis</option>
                  <option value="4">4+ étoiles</option>
                  <option value="4.5">4.5+ étoiles</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 0, padding: '0 2rem', fontSize: '1rem' }}>
                Rechercher
              </button>
            </div>
          </form>

          {/* BOUTON PRÈS DE MOI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleNearMe} disabled={geoLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 500 }}>
              <Navigation size={18} />
              {geoLoading ? 'Localisation...' : 'Près de moi'}
            </button>
            {userPosition && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  Rayon :
                </span>
                <select value={radius} onChange={e => { setRadius(e.target.value); fetchArtisans('', '', '', userPosition.lat, userPosition.lng, e.target.value); }}
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                </select>
                <span style={{ color: '#86efac', fontSize: '0.9rem' }}>✓ Position détectée</span>
              </>
            )}
            {geoError && <span style={{ color: '#FCA5A5', fontSize: '0.9rem' }}>{geoError}</span>}
          </div>
        </div>
      </section>

      {/* RÉSULTATS */}
      <section className="section container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--secondary)' }}>
              {userPosition ? `Artisans à ${radius} km de vous` : 'Résultats'}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              {artisans.length} profil(s) trouvé(s)
            </p>
          </div>

          {/* TOGGLE LISTE/CARTE */}
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('list')} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 500,
              background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text-muted)'
            }}>
              <List size={18} /> Liste
            </button>
            <button onClick={() => setViewMode('map')} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 500,
              background: viewMode === 'map' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'map' ? 'white' : 'var(--text-muted)'
            }}>
              <Map size={18} /> Carte
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem' }}>Chargement des profils...</p>
        ) : artisans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#F9FAFB', borderRadius: 'var(--radius-lg)' }}>
            <MapPin size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Aucun artisan trouvé dans cette zone</h3>
            <p style={{ color: 'var(--text-muted)' }}>Essayez d'augmenter le rayon ou de changer vos filtres.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid-3">
            {artisans.map(artisan => <ArtisanCard key={artisan.id} artisan={artisan} />)}
          </div>
        ) : (
          <MapView artisans={artisans} userPosition={userPosition} radius={radius} />
        )}
      </section>

      {/* CTA PRO */}
      <section className="section container" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--secondary)' }}>Vous êtes un pro du BTP ?</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Rejoignez des centaines d&apos;artisans et fournisseurs pour développer votre clientèle.
        </p>
        <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
          <Briefcase size={20} /> Créer un compte Artisan
        </button>
      </section>
    </>
  );
}
