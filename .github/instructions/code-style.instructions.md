---
applyTo: "**/*.{js,html,css}"
---

# Skill : Style de code — manga-collection

## JavaScript

### Style général
- **ES6+** : `const`/`let` (jamais `var`), arrow functions, template literals, destructuring
- **`async/await`** pour toutes les opérations asynchrones
- Fonctions nommées explicitement (pas de fonctions anonymes sauf pour les callbacks courts)
- Déclarations de fonctions en bas de fichier, initialisations et event listeners en haut

### Nommage
- Variables et fonctions : `camelCase`
- Constantes globales : `UPPER_SNAKE_CASE`
- Fonctions : verbe + nom (ex: `loadCollection`, `renderMangaCard`, `handleLogin`)
- Préfixes : `handle` pour les event handlers, `render` pour les fonctions d'affichage, `fetch`/`get`/`load` pour les appels réseau

### Gestion d'erreurs
- Toujours `try/catch` autour des appels `fetch`
- Afficher un message d'erreur en français à l'utilisateur (jamais une erreur technique brute)
- Logger les erreurs techniques dans la console (`console.error`) pour le débogage

### Sécurité
- **Jamais** de `innerHTML` avec du contenu provenant d'une API externe ou de l'utilisateur
- Utiliser `document.createElement` + `textContent` ou `element.setAttribute` pour créer du DOM dynamique
- Encoder les données utilisateur avant injection (utiliser `escapeHtml()` si `innerHTML` inévitable)

### Exemple de pattern correct
```javascript
function createMangaCard(manga) {
  const card = document.createElement('div');
  card.className = 'manga-card';

  const title = document.createElement('h3');
  title.className = 'manga-title';
  title.textContent = manga.title_romaji; // ✅ textContent, pas innerHTML

  card.appendChild(title);
  return card;
}
```

## HTML

- `lang="fr"` sur `<html>`
- `<meta charset="UTF-8">` et `<meta name="viewport">` toujours présents
- Balises sémantiques : `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- `alt` sur toutes les images (description significative)
- `aria-label` ou `aria-labelledby` sur les éléments interactifs sans texte visible
- Scripts en fin de `<body>`, dans l'ordre : `config.js` en premier

## CSS

- **CSS custom properties** pour toutes les couleurs, espacements et border-radius
- Définies dans `:root` dans `styles.css`
- Classe `.hidden` = `display: none` pour masquer/afficher des éléments via JS
- Préférer les classes utilitaires aux styles inline
- Media queries : mobile-first (`min-width`)
- Unités : `rem` pour les tailles de texte, `px` pour les petits détails (border, shadow)

### Nommage CSS (BEM simplifié)
- Bloc : `.manga-card`
- Élément : `.manga-card__title` ou classe standalone `.manga-title`
- Modificateur : `.manga-card--featured`, `.btn--primary`

## Commentaires

- Commenter le **pourquoi**, pas le **quoi**
- Référencer les ADR concernés : `// cf. ADR-0003 : données issues d'AniList`
- Pas de commentaires évidents (`// boucle for`, `// retourne true`)
- JSDoc sur les fonctions publiques et les modules

## Organisation des fichiers JS

Chaque fichier commence par :
```javascript
// ============================================================
// [NOM DU MODULE] - [Description courte]
// cf. ADR-XXXX si pertinent
// ============================================================
```
