-- Ajout de la table des produits pour les fournisseurs
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'unite', -- Ex: sac, tonne, m3
    image_url VARCHAR(255),
    category VARCHAR(100), -- Ex: Ciment, Granulats, Fer
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour la recherche
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier_id);
