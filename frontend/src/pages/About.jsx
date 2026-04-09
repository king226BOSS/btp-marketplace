import { HelpCircle, CheckCircle, Search, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ color: 'var(--secondary)', fontSize: '2.5rem', marginBottom: '1rem' }}>Comment ça marche ?</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
          La Marketplace BTP est conçue pour simplifier la mise en relation entre les particuliers, les artisans du BTP et les fournisseurs de matériaux.
        </p>
      </div>

      <div className="grid-3" style={{ gap: '3rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: '#E0F2FE', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#0369A1' }}>
            <Search size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Recherchez</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Trouvez le parfait maçon, électricien, plombier ou fournisseur près de chez vous en parcourant notre catalogue vérifié.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: '#FEF3C7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#92400E' }}>
            <Mail size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Demandez un Devis</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Consultez le profil et les réalisations de l'artisan, puis envoyez-lui une demande de devis détaillée gratuitement.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: '#D1FAE5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#047857' }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Réalisez votre projet</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            L'artisan reçoit votre demande sur son tableau de bord, vous discutez et validez ensemble le prix et la date des travaux.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '4rem', padding: '3rem', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Prêt à commencer ?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Rejoignez la plateforme dès maintenant.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <a href="/" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Trouver un pro</a>
           <a href="/register" className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>Je suis un pro</a>
        </div>
      </div>
    </div>
  );
}
