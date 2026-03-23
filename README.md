# 📚 Ma Collection Manga

Site personnel pour recenser et afficher ma collection de mangas : les séries que je possède, les tomes que j'ai et ceux qu'il me manque.

## Fonctionnalités

- **Vue publique** : liste de toutes les séries de la collection avec la progression par tome (possédés / manquants / total)
- **Vue admin** (protégée) : ajout de mangas via recherche AniList, cochage individuel de chaque tome possédé, suppression de séries
- **Recherche et filtres** : filtrer par titre, par statut (série terminée / en cours) ou par complétude de la collection

## Architecture

| Composant | Technologie |
|-----------|-------------|
| Frontend | HTML + CSS + JavaScript vanilla (ES6+) |
| Hébergement | GitHub Pages |
| Base de données | Google Sheets |
| API backend | Google Apps Script (Web App) |
| Référence manga | API GraphQL AniList |

> Voir les ADR dans [`docs/adr/`](docs/adr/) pour le détail de chaque décision.

## Structure du projet

```
manga-collection/
├── index.html              # Page publique
├── admin.html              # Interface admin (protégée)
├── generate-hash.html      # Utilitaire local : générer le hash du mot de passe
├── css/styles.css          # Feuille de style (thème clair, mobile-first)
├── js/
│   ├── config.js           # ⚠️ À configurer avant déploiement
│   ├── auth.js             # Authentification admin
│   ├── anilist.js          # API AniList (recherche manga)
│   ├── sheets.js           # API Apps Script (lecture/écriture collection)
│   ├── public.js           # Logique page publique
│   └── admin.js            # Logique page admin
├── scripts/apps-script/
│   └── Code.gs             # Code Google Apps Script (copier dans l'éditeur GAS)
└── docs/
    ├── adr/                # Architecture Decision Records
    └── setup/              # Guides de configuration
```

## Mise en route rapide

### 1. Google Sheets

Créer le Google Sheet selon [docs/setup/google-sheets-setup.md](docs/setup/google-sheets-setup.md).

### 2. Google Apps Script

Déployer l'API selon [docs/setup/apps-script-setup.md](docs/setup/apps-script-setup.md).

### 3. Choisir un mot de passe admin

Ouvrir `generate-hash.html` en local dans le navigateur pour générer le hash SHA-256 de votre mot de passe.

### 4. Configurer js/config.js

```javascript
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/VOTRE_URL/exec',
  PASSWORD_HASH:   'votre-hash-sha256-ici',
  SITE_NAME:       'Ma Collection Manga',
};
```

### 5. Déployer sur GitHub Pages

Pousser le code sur `main` et activer GitHub Pages selon [docs/setup/github-pages-setup.md](docs/setup/github-pages-setup.md).

## Guides de configuration

| Guide | Description |
|-------|-------------|
| [Google Sheets](docs/setup/google-sheets-setup.md) | Création et structure du classeur |
| [Apps Script](docs/setup/apps-script-setup.md) | Déploiement de l'API backend |
| [GitHub Pages](docs/setup/github-pages-setup.md) | Hébergement du site |
| [AniList](docs/setup/anilist-setup.md) | Utilisation de l'API manga (aucune clé requise) |

## ADR (Architecture Decision Records)

| Numéro | Titre | Statut |
|--------|-------|--------|
| [ADR-0001](docs/adr/0001-static-site-github-pages.md) | Site statique JavaScript sur GitHub Pages | Accepté |
| [ADR-0002](docs/adr/0002-google-sheets-persistence.md) | Persistance via Google Sheets + Apps Script | Accepté |
| [ADR-0003](docs/adr/0003-anilist-api.md) | API AniList comme référence manga | Accepté |
| [ADR-0004](docs/adr/0004-authentication-strategy.md) | Stratégie d'authentification admin | Accepté |
| [ADR-0005](docs/adr/0005-project-structure.md) | Structure du projet | Accepté |

