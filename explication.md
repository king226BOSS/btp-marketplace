# Philosophie de Conception et Architecture de la Marketplace BTP

Ce document explique la façon dont la plateforme (MVP) a été codée et la philosophie technique sous-jacente.

## 1. Philosophie d'Architecture : Le Composant comme Roi

Le site est construit comme une **Single Page Application (SPA)** avec **React**. L'idée force est de tout diviser en briques : les "Composants".

* **Réutilisabilité :** Au lieu de coder plusieurs fois le même bloc visuel (par exemple, la présentation d'un maçon ou d'un fournisseur), un composant unique `ArtisanCard.jsx` a été créé. Le modifier à cet unique endroit mettra à jour l'ensemble du site.
* **Séparation des préoccupations :** Le dossier `src/components/` contient les morceaux d'interface indépendants (Menu de navigation, Pied de page, Cartes), tandis que `src/pages/` (Accueil, Profil, Tableau de bord) s'occupe d'assembler ces blocs pour former les écrans.

## 2. Technologie : Vitesse et Modernité

* **Vite.js :** Utilisé en remplacement des anciens outils (comme Create-React-App). Vite est ultra-rapide. Il allège drastiquement le code envoyé au navigateur, ce qui réduit efficacement le temps de chargement des utilisateurs (indispensable pour les usages sur mobile ou les connexions limitées).
* **React Router DOM :** C'est le moteur de navigation. Il intercepte les clics (ex: se rendre sur son Tableau de bord) et met à jour instantanément la vue sans aucun rafraîchissement "blanc" de la page web. Cela garantit une transition ultra-fluide semblable aux applications natives.

## 3. Philosophie du Design : "Design System" sur-mesure

Le choix s'est porté sur du **Vanilla CSS** pour l'intégralité du style de la plateforme afin d'avoir une maîtrise fine des composants.

* **Design Tokens (Variables CSS) :** Les règles esthétiques phares de votre marque sont centralisées et documentées dans le fichier `index.css`. Par exemple : `--primary: #EF7C00` (Orange BTP Market), `--secondary: #0F2D53`. Si l'identité visuelle change à l'avenir, la simple modification d'une ligne impacte le site globalement.
* **Esthétique "Premium" :** L'interface cherche le raffinement avec un design inspiré du "Glassmorphism", un jeu subtil d'ombres dynamiques, et des effets fluides au survol des différents boutons pour inspirer un sentiment de qualité et de sécurité chez le client.
* **Simplicité Vectorielle :** L'intégration de "Lucide React" offre des bibliothèques d'icônes nettes et professionnelles n'impactant guère le poids du site.

## 4. Vision "Agile" : Les données simulées (Mocks)

En explorant le code (`Home.jsx`, `Dashboard.jsx`), vous relèverez des listes telles que `MOCK_ARTISANS`.

* **Méthodologie "Fail Fast, Learn Fast" :** Construire l'interface avant les serveurs permet de tester visuellement ce que verra l'utilisateur final et d'itérer à un coût minime.
* **Déconnexion de la logique d'Affichage et de la Base de données :** Le code est fondamentalement prêt. Dès que le Backend (API, Node.js, PostgreSQL) verra le jour, remplacer la liste de fausses données (les "constantes MOCK_X") par une fonction d'appel réseau (`fetch`) suffira, sans bousculer ce qui a été fait aujourd'hui.
