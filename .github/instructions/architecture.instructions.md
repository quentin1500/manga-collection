---
applyTo: "**/*.{js,html,css}"
---

# Skill : Architecture du projet manga-collection

## Vue d'ensemble

Ce projet est un site statique JavaScript hébergé sur **GitHub Pages**, sans backend dédié. Toute la logique métier s'exécute côté client. La persistance passe par **Google Apps Script** (API REST sur Google Sheets). Les métadonnées manga proviennent de l'**API GraphQL AniList**.

## Contraintes architecturales fondamentales

### 1. Pas de build step
- **Vanilla JavaScript uniquement** (ES6+). Pas de framework (React, Vue, Angular).
- Pas de bundler (Webpack, Vite, etc.).
- Les fichiers sont servis directement par GitHub Pages.
- Les dépendances externes se font via CDN si absolument nécessaire (à éviter).

### 2. Séparation des responsabilités (fichiers JS)

| Fichier | Rôle |
|---------|------|
| `js/config.js` | Configuration (URLs, hash mot de passe). **Jamais de secrets** |
| `js/auth.js` | Authentification admin (hash, session) |
| `js/anilist.js` | Appels API AniList (GraphQL, lecture seule) |
| `js/sheets.js` | Appels API Apps Script (lecture + écriture collection) |
| `js/public.js` | Logique de la page publique (`index.html`) |
| `js/admin.js` | Logique de la page admin (`admin.html`) |

### 3. Deux interfaces HTML distinctes
- `index.html` : vue **publique**, lecture seule, pas d'authentification.
- `admin.html` : vue **admin**, protégée par mot de passe, CRUD sur la collection.

### 4. Structure de données (Google Sheets)
Feuille `manga_collection` avec les colonnes dans cet ordre exact :

```
anilist_id | title_romaji | title_english | title_native | cover_url | total_volumes | owned_volumes | status | added_date
```

- `owned_volumes` : tableau JSON sérialisé (ex: `[1,2,3,5]`)
- `total_volumes` : `0` si inconnu (série en cours sans count AniList)

### 5. API Apps Script (contrat)
- `GET ?action=getCollection` → retourne `{ mangas: [...] }`
- `POST /` body JSON `{ action, password, ... }` → opérations d'écriture
- Toujours répondre avec `ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)`

### 6. Authentification (cf. ADR-0004)
- Hash SHA-256 du mot de passe stocké dans `CONFIG.PASSWORD_HASH` (`js/config.js`)
- Comparaison côté client pour afficher/masquer l'interface admin
- Mot de passe envoyé en clair (HTTPS) dans le corps des requêtes POST pour vérification côté Apps Script
- Apps Script stocke le mot de passe dans **Script Properties** (jamais dans la feuille)

## Principes de code

- Préférer `async/await` à `.then()/.catch()`
- Toujours gérer les erreurs réseau (afficher un message utilisateur, ne pas crasher)
- Utiliser les CSS custom properties (variables) pour les couleurs et espacements
- Pas de `innerHTML` avec du contenu non maîtrisé (prévention XSS) — utiliser `textContent` ou des fonctions de création de DOM
- `loading="lazy"` sur toutes les images

## Anti-patterns à éviter

- ❌ Ne pas mettre de logique métier dans les fichiers HTML
- ❌ Ne pas dupliquer la configuration (tout dans `config.js`)
- ❌ Ne pas committer un `CONFIG.APPS_SCRIPT_URL` ou `CONFIG.PASSWORD_HASH` vide en production
- ❌ Ne pas exposer le mot de passe admin dans les logs console ou les commentaires
