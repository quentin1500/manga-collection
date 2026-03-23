# ADR-0004 : Stratégie d'authentification admin

**Statut**: Accepté  
**Date**: 2026-03-23  
**Décideurs**: qlagonotte

## Contexte

L'interface admin permet de modifier la collection (ajout/suppression de mangas, cochage des volumes possédés). Elle doit être protégée contre les accès non autorisés. 

Contraintes :
- Site statique hébergé sur GitHub Pages (cf. ADR-0001) : pas de session serveur possible
- Admin unique : qlagonotte
- Pas de gestion multi-utilisateurs, pas de rôles
- Solution simple à maintenir

## Décision

L'authentification repose sur un **mot de passe unique hashé en SHA-256**, selon le schéma suivant :

### Côté client (`js/auth.js`)
1. L'utilisateur saisit son mot de passe dans `admin.html`
2. Le mot de passe est hashé en SHA-256 via l'API Web Crypto (`crypto.subtle.digest`)
3. Le hash est comparé à `CONFIG.PASSWORD_HASH` stocké dans `js/config.js`
4. Si correspondance : l'interface admin est déverrouillée (état local en mémoire, pas de cookie ni localStorage persistant)
5. Le hash du mot de passe en clair n'est **jamais** stocké

### Côté Apps Script
- Le mot de passe en clair est envoyé dans le corps des requêtes POST (HTTPS)
- Apps Script le compare au mot de passe stocké dans **Script Properties** (non visible dans le code source)
- Cela double la sécurité : même si quelqu'un bypasse le hash côté client, l'API refusera les écritures

### Ce que cette solution N'est PAS
- Ce n'est pas une authentification robuste au sens sécurité web professionnelle
- Le hash SHA-256 dans `config.js` est visible si le dépôt est public — acceptable pour un usage personnel

### Génération du hash
Un utilitaire HTML `generate-hash.html` (en local, non déployé) permet de générer le hash SHA-256 du mot de passe choisi.

## Conséquences

### Positives
- Zéro infrastructure : pas de serveur d'authentification, pas de JWT, pas de sessions
- Compatible site statique GitHub Pages
- La double vérification (client + Apps Script) protège efficacement les données
- Simple à changer : regénérer le hash et mettre à jour `config.js` + Script Properties

### Compromis / Risques
- Le hash est visible dans `config.js` si le dépôt est public : une attaque par dictionnaire/rainbow table est théoriquement possible sur un mot de passe faible — mitigation : utiliser un mot de passe fort (>12 caractères, mixte)
- La session admin n'est pas persistée entre rechargements de page (choix délibéré — pas de localStorage pour le hash)
- Pas de protection contre le brute-force côté client (acceptable pour un usage personnel non critique)
