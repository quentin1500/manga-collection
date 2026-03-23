# ADR-0005 : Structure du projet

**Statut**: Accepté  
**Date**: 2026-03-23  
**Décideurs**: qlagonotte

## Contexte

Le projet étant un site statique vanilla JS (cf. ADR-0001), la structure des fichiers doit être simple, lisible et cohérente pour faciliter la maintenance et les contributions futures de GitHub Copilot.

## Décision

```
manga-collection/
│
├── index.html                  # Page publique (vue visiteur)
├── admin.html                  # Page admin (protégée par mot de passe)
├── generate-hash.html          # Utilitaire local : générer le hash du mot de passe
│
├── css/
│   └── styles.css              # Feuille de style unique (thème clair, mobile-first)
│
├── js/
│   ├── config.js               # Configuration globale (URL Apps Script, hash MDP)
│   ├── auth.js                 # Authentification admin (hash SHA-256, vérification)
│   ├── anilist.js              # Appels API AniList (GraphQL)
│   ├── sheets.js               # Appels API Apps Script / Google Sheets
│   ├── public.js               # Logique page publique
│   └── admin.js                # Logique page admin
│
├── scripts/
│   └── apps-script/
│       └── Code.gs             # Code Google Apps Script (à copier dans l'éditeur GAS)
│
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   │   ├── 0001-static-site-github-pages.md
│   │   ├── 0002-google-sheets-persistence.md
│   │   ├── 0003-anilist-api.md
│   │   ├── 0004-authentication-strategy.md
│   │   └── 0005-project-structure.md
│   └── setup/                  # Guides de configuration
│       ├── google-sheets-setup.md
│       ├── apps-script-setup.md
│       ├── github-pages-setup.md
│       └── anilist-setup.md
│
├── .github/
│   └── instructions/           # Skills GitHub Copilot
│       ├── adr-compliance.instructions.md
│       ├── architecture.instructions.md
│       └── code-style.instructions.md
│
└── README.md
```

### Règles de structure

1. **Un CSS unique** : pas de CSS par page, tout dans `styles.css` avec des sections commentées
2. **Un JS par responsabilité** : pas de logique métier dans les HTML, pas de mélange des couches
3. **`config.js` chargé en premier** : toujours le premier `<script>` dans les HTML
4. **`scripts/apps-script/`** : le code Google Apps Script est versionné ici mais doit être copié manuellement dans l'éditeur GAS (pas de déploiement automatique possible)
5. **`generate-hash.html`** : fichier utilitaire local, ne pas déployer (ajouter à `.gitignore` si confidentialité souhaitée)

## Conséquences

### Positives
- Structure plate et lisible : tous les fichiers importants sont accessibles en 1-2 niveaux
- Séparation claire des responsabilités entre les fichiers JS
- Les guides `docs/setup/` centralisent toute la documentation de configuration
- Les ADRs sont dans le dépôt : traçabilité des décisions co-localisée avec le code

### Compromis / Risques
- Un seul CSS peut devenir volumineux avec le temps : acceptable pour un projet de cette taille
- `generate-hash.html` à la racine peut surprendre : le README l'explique clairement
