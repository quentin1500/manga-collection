# ADR-0002 : Persistance des données via Google Sheets + Apps Script

**Statut**: Accepté  
**Date**: 2026-03-23  
**Décideurs**: qlagonotte

## Contexte

Le site statique (cf. ADR-0001) n'a pas de base de données ni de backend. Il faut pourtant persister :
- La liste des mangas dans la collection
- Pour chaque manga : les volumes possédés

Les contraintes sont :
- Gratuit
- Pas de service backend à maintenir
- Accessible en lecture publique (pour la vue visiteur)
- Accessible en écriture uniquement pour l'admin
- Interface de gestion des données lisible et modifiable manuellement si besoin (backup, correction)

## Décision

Les données seront stockées dans un **Google Sheet** (format tabulaire), exposé via une **Google Apps Script Web App** qui fournit une API REST JSON.

**Structure de la feuille** (`manga_collection`) :

| Colonne | Type | Description |
|---------|------|-------------|
| `anilist_id` | Nombre | Identifiant unique AniList |
| `title_romaji` | Texte | Titre romanisé |
| `title_english` | Texte | Titre anglais (peut être vide) |
| `title_native` | Texte | Titre japonais original |
| `cover_url` | URL | URL de la couverture (AniList CDN) |
| `total_volumes` | Nombre | Nombre total de volumes (0 = inconnu) |
| `owned_volumes` | JSON | Tableau JSON des numéros de volumes possédés (ex: `[1,2,3,5]`) |
| `status` | Texte | Statut AniList : `FINISHED`, `RELEASING`, etc. |
| `added_date` | Date ISO | Date d'ajout à la collection |

**API Apps Script** :
- `GET ?action=getCollection` → retourne `{ mangas: [...] }` (public, sans auth)
- `POST /` → opérations CRUD (requiert le mot de passe dans le body)

## Conséquences

### Positives
- Gratuit (quota Google Sheets et Apps Script largement suffisant pour un usage personnel)
- Les données sont lisibles et éditables directement dans Google Sheets (backup manuel facile)
- Pas de base de données à maintenir
- Apps Script inclut un éditeur en ligne pour modifier l'API si besoin
- Exports CSV/JSON natifs depuis Google Sheets

### Compromis / Risques
- Latence : les appels Apps Script peuvent prendre 1-3 secondes (cold start)
- Quotas Google Apps Script : 20 000 requêtes/jour (largement suffisant pour un usage personnel)
- L'URL de l'Apps Script web app est visible dans le code source public — les requêtes en lecture sont volontairement publiques, les écritures sont protégées par mot de passe
- Pas de transactions ni de rollback en cas d'erreur partielle
- Pas de recherche full-text efficace (non nécessaire : le filtrage se fait côté client après chargement)
