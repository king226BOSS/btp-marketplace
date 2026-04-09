import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix leaflet default icon issue with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône custom orange pour l'artisan
const artisanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Icône bleue pour la position de l'utilisateur
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapView({ artisans, userPosition, radius }) {
  // Centre par défaut = Ouagadougou
  const center = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [12.3714, -1.5197];

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', height: '500px' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur + Cercle de rayon pour la position de l'utilisateur */}
        {userPosition && (
          <>
            <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
              <Popup><strong>📍 Votre position</strong></Popup>
            </Marker>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={(radius || 10) * 1000} // en mètres
              pathOptions={{ color: '#3B82F6', fillColor: '#BFDBFE', fillOpacity: 0.2 }}
            />
          </>
        )}

        {/* Marqueurs pour chaque artisan */}
        {artisans.filter(a => a.latitude && a.longitude).map(artisan => (
          <Marker
            key={artisan.id}
            position={[parseFloat(artisan.latitude), parseFloat(artisan.longitude)]}
            icon={artisanIcon}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <strong style={{ fontSize: '1rem' }}>{artisan.name}</strong>
                <p style={{ margin: '0.25rem 0', color: '#6B7280', fontSize: '0.85rem' }}>{artisan.category}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>📍 {artisan.location}</p>
                {artisan.distance_km != null && (
                  <p style={{ margin: '0.25rem 0', color: '#F97316', fontWeight: 600, fontSize: '0.85rem' }}>
                    🗺 {artisan.distance_km < 1 
                      ? `${(artisan.distance_km * 1000).toFixed(0)} m`
                      : `${artisan.distance_km.toFixed(1)} km`} de vous
                  </p>
                )}
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>⭐ {artisan.rating}</p>
                <Link to={`/profile/${artisan.id}`} style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.3rem 0.75rem', background: '#F97316', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Voir profil →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
