# 🛒 PlugMarket — Boutique en ligne personnalisable

PlugMarket est une application web de boutique en ligne moderne, entièrement personnalisable depuis un panneau d'administration intégré. Conçue pour être facilement dupliquée et adaptée à vos besoins.

---

## 🚀 Copier ce projet (Remix)

### Méthode 1 — Via Lovable (recommandé)

1. Ouvrez le lien de remix : `https://lovable.dev/projects/9c78382e-14f4-436f-8b40-6a3ce1d3abd8/remix`
2. Connectez-vous ou créez un compte Lovable
3. Le projet sera automatiquement copié sur votre compte
4. Lovable Cloud créera automatiquement votre propre base de données

### Méthode 2 — Via GitHub

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/VOTRE_NOM/VOTRE_REPO.git
   cd VOTRE_REPO
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
4. **Important** : Vous devrez configurer votre propre backend (base de données, authentification, stockage) car la copie GitHub ne contient pas la base de données.

---

## ⚙️ Configuration après le remix

Après avoir copié le projet, vous devrez :

1. **Créer les tables** — Les migrations SQL dans `supabase/migrations/` seront appliquées automatiquement si vous utilisez Lovable Cloud
2. **Configurer les secrets** — Ajoutez vos clés API si nécessaire (Telegram bot token, etc.)
3. **Créer un compte admin** — Inscrivez-vous puis modifiez le grade de votre utilisateur à `Admin` dans la base de données
4. **Personnaliser** — Utilisez le panneau d'administration pour personnaliser votre boutique

---

## 📋 Liste des fonctionnalités

### 🏪 Boutique (Front-end)

| Fonctionnalité | Description |
|---|---|
| **Catalogue produits** | Affichage en grille responsive des produits avec image, nom et prix |
| **Catégories & sous-catégories** | Filtrage des produits par catégorie et sous-catégorie |
| **Page produit détaillée** | Vue détaillée avec description (BBCode), variantes de prix, image/vidéo |
| **Avis & notes** | Système de notation par étoiles avec commentaires (anonymes ou non) |
| **Page tous les avis** | Vue centralisée de tous les avis clients |
| **FAQ** | Section questions fréquentes avec accordéon |
| **Profil utilisateur** | Section contact avec accès au compte et à l'administration |
| **Bannière personnalisable** | Header avec titre, slogan et image de fond personnalisables |
| **Design responsive** | Interface adaptée mobile et desktop |
| **Navigation par onglets** | Barre de navigation en bas (Menu, Avis, FAQ, Contact) |
| **Conditions d'utilisation** | Page légale avec les termes et conditions du service |
| **Politique de confidentialité** | Page légale détaillant la gestion des données personnelles |
| **Paramètres utilisateur** | Modification du mot de passe, du nom d'utilisateur et récupération de compte |

### 🔐 Authentification

| Fonctionnalité | Description |
|---|---|
| **Inscription** | Création de compte avec nom d'utilisateur et mot de passe |
| **Connexion** | Authentification sécurisée avec tokens de session |
| **Déconnexion** | Invalidation de session côté serveur |
| **Récupération de mot de passe** | Réinitialisation via seed phrase |
| **Grades utilisateur** | Système de rôles : User, Admin, Demo Admin |
| **Rate limiting** | Protection contre les attaques par force brute |
| **Hachage sécurisé** | Mots de passe et seeds hashés côté serveur |

### 🛠️ Panneau d'administration

| Section | Fonctionnalités |
|---|---|
| **Dashboard** | Vue d'ensemble avec accès rapide à toutes les sections |
| **Utilisateurs** | Liste des utilisateurs, modification des grades, suppression |
| **Boutique** | Gestion complète des produits, catégories, sous-catégories, fermes et variantes |
| **Telegram** | Configuration du bot, utilisateurs, message de bienvenue, annonces |
| **FAQ** | Ajout, modification, suppression et réorganisation des questions |
| **Website** | Personnalisation du titre, slogan et bannière du site |
| **Mode Demo Admin** | Accès en lecture seule pour les comptes de démonstration |

### 🤖 Intégration Telegram

| Fonctionnalité | Description |
|---|---|
| **Configuration du bot** | Connexion/déconnexion du bot via token |
| **Message de bienvenue** | Message personnalisable avec image et boutons |
| **Captcha** | Vérification anti-bot avec code à 4 chiffres et image générée |
| **Nettoyage auto du chat** | Suppression automatique des messages captcha après validation |
| **Boutons légaux** | Liens vers les conditions d'utilisation et la politique de confidentialité |
| **Suivi des interactions** | Historique des utilisateurs du bot (messages, dates, langue) |
| **Gestion des bans** | Bannissement temporaire ou permanent des utilisateurs |
| **Webhook automatique** | Configuration automatique du webhook Telegram |
| **Domaine personnalisé** | Redirection des liens vers le domaine plugs-market.fr |

### 🗄️ Backend (Edge Functions)

| Fonction | Description |
|---|---|
| `auth-register` | Inscription avec hachage et génération de seed |
| `auth-login` | Connexion avec vérification et création de token |
| `auth-logout` | Déconnexion et suppression du token |
| `auth-recover` | Récupération de compte via seed phrase |
| `admin-shop` | CRUD complet pour produits, catégories, sous-catégories, fermes, variantes |
| `admin-users` | Gestion des utilisateurs (liste, modification grade, suppression) |
| `admin-faq` | CRUD pour les questions fréquentes |
| `admin-website` | Gestion des paramètres du site et upload de bannière |
| `admin-telegram` | Configuration du bot Telegram |
| `product-reviews` | Récupération et publication d'avis produit |
| `telegram-webhook` | Réception et traitement des messages Telegram |

### 🔒 Sécurité

| Mesure | Description |
|---|---|
| **RLS (Row Level Security)** | Politiques restrictives sur toutes les tables sensibles |
| **Edge Functions sécurisées** | Validation des permissions côté serveur via `service_role` |
| **Rate limiting** | Limitation du nombre de tentatives de connexion |
| **Tokens de session** | Authentification par tokens hashés avec expiration |
| **Validation des fichiers** | Vérification du type et de la taille des uploads |

---

## 🧰 Stack technique

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS
- **UI** : shadcn/ui, Radix UI, Lucide Icons
- **State** : TanStack React Query
- **Routing** : React Router v6
- **Backend** : Lovable Cloud (Supabase) — Edge Functions (Deno)
- **Base de données** : PostgreSQL avec RLS
- **Stockage** : Supabase Storage (bannières, images)

---

## 📁 Structure du projet

```
src/
├── components/          # Composants React
│   ├── ui/              # Composants shadcn/ui
│   ├── Admin*.tsx        # Composants du panneau admin
│   ├── HeroBanner.tsx    # Bannière d'en-tête
│   ├── ProductCard.tsx   # Carte produit
│   └── ...
├── hooks/               # Hooks personnalisés (auth, shop data, telegram)
├── pages/               # Pages (Index, ProductPage, TermsPage, PrivacyPage, NotFound)
├── lib/                 # Utilitaires (BBCode, Telegram, utils)
├── integrations/        # Client et types Supabase (auto-généré)
└── data/                # Données statiques

supabase/
├── functions/           # Edge Functions (auth, admin, webhook)
├── migrations/          # Migrations SQL
└── config.toml          # Configuration Supabase
```

---

## 📄 Licence

Ce projet est open source. Libre à vous de le copier, modifier et redistribuer.
