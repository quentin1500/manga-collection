# ADR-0001 : Site statique JavaScript hébergé sur GitHub Pages

**Statut**: Accepté  
**Date**: 2026-03-23  
**Décideurs**: qlagonotte

## Contexte

Le projet nécessite un hébergement web accessible publiquement pour présenter une collection de mangas. Le site doit être :
- Gratuit à héberger
- Simple à déployer (pas de serveur à administrer)
- Versionné et traçable (modifications contrôlées)
- Accessible à des visiteurs sans authentification pour la vue publique

Le propriétaire est développeur et à l'aise avec Git/GitHub.

## Décision

Le site sera un **site statique en JavaScript vanilla (ES6+)**, hébergé sur **GitHub Pages**, servi directement depuis le dépôt GitHub (`main` branch, dossier racine `/`).

Pas de framework JavaScript (React, Vue, Angular) ni de bundler (Webpack, Vite). Les fichiers HTML, CSS et JS sont servis en l'état.

## Conséquences

### Positives
- Hébergement gratuit, illimité dans le temps (tant que GitHub Pages existe)
- Déploiement automatique à chaque `git push` sur `main`
- Pas de serveur à maintenir, pas de mise à jour de dépendances côté serveur
- Code source entièrement versionné, historique des décisions traçable
- Accès 24/7 sans maintenance infrastructure

### Compromis / Risques
- Pas de logique serveur : toute la logique métier doit être côté client (JS)
- Les fichiers de configuration (`config.js`) avec l'URL Apps Script seront visibles dans le dépôt public — acceptable car l'URL Apps Script est protégée par mot de passe pour les écritures
- Pas de rendu côté serveur (SSR) : le SEO est limité (non critique pour un usage personnel)
- Si le dépôt est public, le code source (y compris le hash du mot de passe admin) est visible — mitigation documentée dans ADR-0004
