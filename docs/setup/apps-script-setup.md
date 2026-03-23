# Configuration Google Apps Script

Ce guide explique comment déployer l'API backend qui connecte le site à Google Sheets.

## Prérequis

- Le Google Sheet créé selon [google-sheets-setup.md](./google-sheets-setup.md)
- Un compte Google (le même que propriétaire du Sheet)

## 1. Ouvrir l'éditeur Apps Script

Depuis le Google Sheet :
1. Menu **Extensions > Apps Script**
2. L'éditeur s'ouvre dans un nouvel onglet
3. Supprimer le code par défaut dans `Code.gs`

## 2. Copier le code

Copier intégralement le contenu du fichier [`scripts/apps-script/Code.gs`](../../scripts/apps-script/Code.gs) dans l'éditeur.

## 3. Configurer le mot de passe admin

Dans l'éditeur Apps Script :
1. Menu **Projet > Propriétés du projet** (ou icône ⚙️ > **Propriétés du projet**)
2. Onglet **Propriétés de script**
3. Ajouter une propriété :
   - **Nom** : `ADMIN_PASSWORD`
   - **Valeur** : votre mot de passe en clair (celui que vous utilisez sur `admin.html`)
4. Cliquer **Enregistrer**

> 🔒 Le mot de passe est stocké dans les Script Properties, invisible depuis le code source ou le Google Sheet.

## 4. Configurer l'ID du Sheet

Dans le code `Code.gs`, vérifier la constante en haut du fichier :
```javascript
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
```

Ajouter une seconde propriété de script :
- **Nom** : `SHEET_ID`
- **Valeur** : l'identifiant de votre Google Sheet (cf. [google-sheets-setup.md](./google-sheets-setup.md#6-récupérer-lid-du-sheet))

## 5. Tester le script

1. Dans l'éditeur, sélectionner la fonction `testGetCollection` dans le menu déroulant
2. Cliquer **Exécuter** (▶️)
3. Autoriser les permissions demandées (accès au Sheet)
4. Vérifier dans le journal d'exécution que la fonction retourne `[]` (tableau vide) sans erreur

## 6. Déployer en Web App

1. Cliquer **Déployer > Nouveau déploiement**
2. Type : **Application Web**
3. Paramètres :
   - **Description** : `manga-collection-api v1`
   - **Exécuter en tant que** : `Moi (votre email)`
   - **Qui a accès** : `Tout le monde` ⚠️ (nécessaire pour les lectures publiques depuis GitHub Pages)
4. Cliquer **Déployer**
5. **Autoriser l'accès** (fenêtre de permissions Google)
6. Copier l'**URL de déploiement** : elle ressemble à `https://script.google.com/macros/s/XXXX/exec`

> ⚠️ "Tout le monde" signifie que les lectures sont publiques. Les écritures sont protégées par le mot de passe dans le body de la requête POST — cf. ADR-0004.

## 7. Configurer l'URL dans le site

Ouvrir `js/config.js` et renseigner l'URL copiée :

```javascript
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/VOTRE_URL_ICI/exec',
```

## 8. Mettre à jour après modification du code

Si vous modifiez `Code.gs` à l'avenir :
1. **Déployer > Gérer les déploiements**
2. Modifier le déploiement existant
3. Sélectionner **Nouvelle version**
4. Cliquer **Déployer**

> ⚠️ Chaque nouveau déploiement génère une **nouvelle URL**. Pensez à mettre à jour `config.js` si l'URL change.

## Tester l'API déployée

Ouvrir dans le navigateur :
```
https://script.google.com/macros/s/VOTRE_URL/exec?action=getCollection
```

Résultat attendu :
```json
{"mangas":[]}
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Erreur 401 / accès refusé | Re-déployer avec "Tout le monde" et réautoriser |
| Erreur de propriété introuvable | Vérifier SHEET_ID et ADMIN_PASSWORD dans Script Properties |
| Réponse HTML au lieu de JSON | L'Apps Script a une erreur : consulter **Exécutions** dans l'éditeur |
| URL changée après redéploiement | Mettre à jour `APPS_SCRIPT_URL` dans `js/config.js` |
