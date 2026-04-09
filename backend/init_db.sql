-- Migration script - MVP BTP Market
-- Attention: Ce script supprimera et recréera les tables !

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;

CREATE TYPE user_role AS ENUM ('client', 'artisan', 'fournisseur', 'admin');
CREATE TYPE quote_status AS ENUM ('en_attente', 'accepte', 'refuse', 'termine');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    category VARCHAR(100), -- Ex: Maçonnerie, Electricité
    professional_title VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    latitude NUMERIC(10,7),   -- Coordonnées GPS
    longitude NUMERIC(10,7),  -- Coordonnées GPS
    rating NUMERIC(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,      -- Statistiques de visites
    is_premium BOOLEAN DEFAULT FALSE,     -- Abonnement Premium
    premium_until TIMESTAMP,              -- Date d'expiration du Premium
    portfolio_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    artisan_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_required VARCHAR(255) NOT NULL,
    description TEXT,
    artisan_reply TEXT, -- NOUVEAU: Réponse de l'artisan
    status quote_status DEFAULT 'en_attente',
    desired_date DATE,
    estimated_amount NUMERIC(15,2),
    document_url VARCHAR(255), -- NOUVEAU: Lien vers un devis PDF ou photos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    artisan_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quote_id) -- Un seul avis par devis
);

-- =====================================================
-- SEED DATA: Compte Admin + Artisans de démonstration
-- Mot de passe admin: Admin1234! (hash BCrypt v10)
-- =====================================================
INSERT INTO users (name, email, password_hash, role, category, professional_title, location, latitude, longitude, rating, reviews_count, portfolio_images)
VALUES 
-- Compte Administrateur
('Super Admin', 'admin@btpmarket.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'admin', NULL, NULL, 'Ouagadougou', 12.3714, -1.5197, 0, 0, '[]'),
-- Artisans avec coordonnées GPS réelles de Ouagadougou
('Kaboré Bâtiment', 'kabore@artisan.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'artisan', 'Maçonnerie', 'Entreprise de Maçonnerie & Gros Œuvre', 'Ouaga 2000, Ouagadougou', 12.3547, -1.5120, 4.80, 12, '["https://images.unsplash.com/photo-1541888086950-ef26956ce48e?q=80&w=600"]'),
('Ouedraogo Électricité', 'ouedraogo@artisan.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'artisan', 'Électricité', 'Électricien Bâtiment Certifié', 'Goughin, Ouagadougou', 12.3834, -1.5247, 4.50, 8, '["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600"]'),
('Sawadogo Plomberie', 'sawadogo@artisan.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'artisan', 'Plomberie', 'Plombier Sanitaire & Thermique', 'Paspanga, Ouagadougou', 12.3980, -1.5330, 4.20, 5, '["https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=600"]'),
('Compaoré Peinture', 'compaore@artisan.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'artisan', 'Peinture', 'Peintre en Bâtiment & Décoration', 'Ouaga 2000, Ouagadougou', 12.3602, -1.5082, 4.70, 15, '["https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?q=80&w=600"]'),
('Traoré Carrelage', 'traore@artisan.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'artisan', 'Carrelage', 'Carreleur Professionnel', 'Pissy, Ouagadougou', 12.3700, -1.5450, 4.30, 9, '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600"]'),
-- Fournisseur
('BF Matériaux SARL', 'materiaux@bf.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'fournisseur', 'Matériaux de Construction', 'Grossiste Ciment, Fer & Sable', 'Zone Industrielle, Ouagadougou', 12.3450, -1.4890, 4.60, 20, '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600"]'),
-- Client test
('Diallo Ibrahim', 'client@test.bf', '$2a$10$XgLdqaQC3dLCRKJwTpjVluNTdnhxJiAK9OFNxJVVp4N2ZO0MLVUWG', 'client', NULL, NULL, 'Ouagadougou', 12.3714, -1.5197, 0, 0, '[]');

-- Note: Le mot de passe de TOUS ces comptes est: Admin1234!
