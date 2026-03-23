# ADR-0003 : API AniList comme référence manga

**Statut**: Accepté  
**Date**: 2026-03-23  
**Décideurs**: qlagonotte

## Contexte

Pour chaque manga de la collection, il faut disposer de :
- Titre (romanisé, anglais, japonais)
- Image de couverture
- Nombre total de volumes
- Statut de publication (en cours, terminé...)

Ces données doivent provenir d'une source fiable, complète et gratuite. Il faut aussi pouvoir rechercher des mangas pour les ajouter à la collection depuis l'interface admin.

## Décision

L'application utilisera l'**API GraphQL publique d'AniList** (`https://graphql.anilist.co`) comme source de référence pour les métadonnées manga.

L'API AniList est :
- Gratuite, sans clé API nécessaire pour les requêtes en lecture publique
- Complète (titres, couvertures, volumes, statut, genres...)
- Bien documentée

**Utilisation** :
- **Recherche** : requête GraphQL `Page > media(search: "...", type: MANGA)` depuis l'interface admin pour trouver et ajouter un manga
- **Chargement des détails** : requête par `id` AniList pour synchroniser les métadonnées

L'`anilist_id` (identifiant numérique AniList) est la clé primaire de chaque manga dans la collection (cf. ADR-0002).

Les métadonnées récupérées sont **persistées dans Google Sheets** lors de l'ajout — l'application ne rappelle pas AniList à chaque chargement de la page publique (performance et résilience).

## Conséquences

### Positives
- Aucun compte ni clé API à gérer pour la lecture publique
- Couverture exhaustive des mangas (base de données communautaire très riche)
- GraphQL permet de ne récupérer que les champs nécessaires (économie de bande passante)
- `anilist_id` comme clé primaire garantit l'unicité et permet une future re-synchronisation

### Compromis / Risques
- Dépendance à un service tiers : si AniList change son API ou la rend payante, il faudra s'adapter
- Rate limiting AniList : 90 requêtes/minute (très largement suffisant pour un admin solo)
- Le nombre de volumes (`volumes`) peut être `null` pour les séries en cours sans décompte final — géré en affichant "?" dans l'UI
- Les couvertures sont hébergées sur le CDN AniList (`s4.anilist.co`) : dépendance pour l'affichage des images en cache
