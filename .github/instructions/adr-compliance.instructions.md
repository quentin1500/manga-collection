---
applyTo: "**"
---

# Skill : Conformité aux ADR (Architecture Decision Records)

## Règle principale

Avant toute modification de code, d'architecture ou de configuration dans ce projet, **consulter obligatoirement** les ADR situés dans `docs/adr/`.

## Procédure

1. **Lire tous les ADR** ayant le statut `Accepté` avant de proposer ou d'implémenter une solution.
2. **Ne pas contredire** une décision `Acceptée` sans d'abord proposer un nouvel ADR.
3. **Référencer l'ADR concerné** dans tout code ou commentaire lié à une décision architecturale (ex: `// cf. ADR-0002 : Google Sheets comme persistence`).
4. **Proposer un nouvel ADR** si une décision architecturale significative doit être prise ou modifiée. Utiliser le template ci-dessous.

## Template ADR

```markdown
# ADR-XXXX: [Titre court et explicite]

**Statut**: Proposé | Accepté | Déprécié | Remplacé par ADR-XXXX
**Date**: YYYY-MM-DD
**Décideurs**: qlagonotte

## Contexte
[Décrit le problème ou la situation qui nécessite une décision.]

## Décision
[Décrit la décision prise de façon claire et concise.]

## Conséquences
### Positives
- ...
### Compromis / Risques
- ...
```

## Liste des ADR actifs

| Numéro | Titre | Statut |
|--------|-------|--------|
| ADR-0001 | Site statique JavaScript sur GitHub Pages | Accepté |
| ADR-0002 | Persistance via Google Sheets + Apps Script | Accepté |
| ADR-0003 | API AniList comme référence manga | Accepté |
| ADR-0004 | Stratégie d'authentification admin | Accepté |
| ADR-0005 | Structure du projet | Accepté |

## Rappel

Cette règle est **non négociable**. Si une implémentation semble entrer en conflit avec un ADR existant, signaler le conflit avant de procéder.
