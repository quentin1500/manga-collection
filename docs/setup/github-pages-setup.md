# Configuration GitHub Pages

Ce guide explique comment activer l'hébergement du site "Ma Collection Manga" sur GitHub Pages.

## Prérequis

- Un compte GitHub
- Ce dépôt forké/créé sous votre compte

## 1. Configurer js/config.js avant de déployer

Avant de pousser le code, renseigner les valeurs dans `js/config.js` :

```javascript
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/VOTRE_URL/exec',
  PASSWORD_HASH: 'VOTRE_HASH_SHA256_ICI',
};
```

- `APPS_SCRIPT_URL` : obtenu après déploiement Apps Script (cf. [apps-script-setup.md](./apps-script-setup.md))
- `PASSWORD_HASH` : généré avec l'utilitaire `generate-hash.html` (ouvrir en local dans le navigateur)

> ⚠️ Ces valeurs seront visibles publiquement si le dépôt est public. C'est acceptable : cf. ADR-0001 et ADR-0004 pour le raisonnement de sécurité.

## 2. Pousser le code sur GitHub

```bash
git add .
git commit -m "feat: initial project setup"
git push origin main
```

## 3. Activer GitHub Pages

1. Aller dans votre dépôt sur GitHub
2. Cliquer **Settings** (onglet en haut)
3. Rubrique **Pages** dans le menu de gauche
4. Section **Build and deployment** :
   - **Source** : `Deploy from a branch`
   - **Branch** : `main` / `/ (root)`
5. Cliquer **Save**

Le site sera disponible dans quelques instants à l'adresse :
```
https://VOTRE_USERNAME.github.io/manga-collection/
```

## 4. Vérifier le déploiement

Après quelques minutes, accéder à l'URL. La page publique doit s'afficher.

Pour l'interface admin : `https://VOTRE_USERNAME.github.io/manga-collection/admin.html`

## 5. Domaine personnalisé (optionnel)

Si vous souhaitez utiliser un domaine custom (ex: `manga.votresite.fr`) :
1. Dans **Settings > Pages > Custom domain**, saisir votre domaine
2. Configurer un enregistrement DNS CNAME chez votre registrar :
   ```
   manga.votresite.fr → VOTRE_USERNAME.github.io
   ```
3. Cocher **Enforce HTTPS** une fois le certificat généré

## 6. Déploiements automatiques

Chaque `git push` sur la branche `main` déclenchera automatiquement un nouveau déploiement GitHub Pages. Pas de configuration CI/CD supplémentaire nécessaire.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Page 404 | Attendre 2-5 minutes, le déploiement peut prendre du temps |
| Page blanche | Ouvrir la console navigateur (F12) pour voir les erreurs JS |
| CORS error sur l'API | Vérifier que `APPS_SCRIPT_URL` est correct dans `config.js` |
| Ancienne version affichée | Vider le cache navigateur (Ctrl+Shift+R) |
