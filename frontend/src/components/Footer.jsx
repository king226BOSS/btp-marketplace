import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>BTP Market</h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              La première place de marché pour les professionnels du BTP et fournisseurs de matériaux au Burkina Faso.
            </p>
          </div>
          <div>
            <h3>Liens Rapides</h3>
            <ul>
              <li><Link to="/">Rechercher un artisan</Link></li>
              <li><Link to="/register">Devenir partenaire</Link></li>
              <li><Link to="/about">Comment ça marche ?</Link></li>
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li>Ouagadougou, Burkina Faso</li>
              <li>contact@btpmarket.bf</li>
              <li>+226 00 00 00 00</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} BTP Market. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
