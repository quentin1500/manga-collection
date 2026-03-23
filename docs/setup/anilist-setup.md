# Configuration AniList

Ce guide explique comment l'application utilise l'API AniList et ce qu'il faut (ou ne faut pas) configurer.

## Bonne nouvelle : aucune clé API requise

L'API publique GraphQL d'AniList (`https://graphql.anilist.co`) est accessible **sans authentification** pour les requêtes en lecture. Aucun compte ni clé API n'est nécessaire pour :
- Rechercher des mangas
- Récupérer les détails d'un manga (titre, couverture, volumes...)

## Fonctionnement dans l'application

L'application fait des requêtes `POST` vers `https://graphql.anilist.co` avec des requêtes GraphQL dans le body. Ces requêtes sont effectuées desde `js/anilist.js`.

### Requête de recherche (interface admin)

```graphql
query ($search: String, $page: Int) {
  Page(page: $page, perPage: 10) {
    media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        medium
      }
      volumes
      status
    }
  }
}
```

### Requête par ID (synchronisation)

```graphql
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    title { romaji english native }
    coverImage { medium }
    volumes
    status
  }
}
```

## Rate limiting

AniList impose une limite de **90 requêtes par minute**. Pour un usage personnel (un seul admin), cette limite est pratiquement impossible à atteindre.

En cas de dépassement, l'API retourne HTTP 429. Le code `js/anilist.js` gère ce cas avec un message d'erreur explicite.

## Compte AniList (optionnel)

Un compte AniList **n'est pas nécessaire** pour utiliser l'application. L'API publique suffit.

Si à l'avenir vous souhaitez synchroniser votre collection avec votre compte AniList personnel (liste personnelle AniList), cela nécessiterait un ADR dédié et une authentification OAuth2 — hors scope de la version initiale.

## Données utilisées

| Champ AniList | Colonne Google Sheets | Notes |
|---|---|---|
| `id` | `anilist_id` | Clé primaire |
| `title.romaji` | `title_romaji` | Titre principal affiché |
| `title.english` | `title_english` | Peut être `null` |
| `title.native` | `title_native` | Titre japonais |
| `coverImage.medium` | `cover_url` | URL image 230px |
| `volumes` | `total_volumes` | `null` si série en cours → stocké `0` |
| `status` | `status` | `FINISHED`, `RELEASING`, `NOT_YET_RELEASED`, `CANCELLED` |

## Ressources

- [Documentation API AniList](https://anilist.gitbook.io/anilist-apiv2-docs/)
- [Explorateur GraphQL AniList](https://anilist.co/graphiql)
- [Page de recherche manga AniList](https://anilist.co/search/manga)
