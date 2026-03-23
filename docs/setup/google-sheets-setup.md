# Configuration Google Sheets

Ce guide explique comment créer et configurer le Google Sheet qui sert de base de données à "Ma Collection Manga".

## 1. Créer le Google Sheet

1. Ouvrir [Google Sheets](https://sheets.google.com)
2. Créer un nouveau classeur
3. Le nommer : **"manga-collection-db"** (ou tout autre nom explicite)
4. Renommer l'onglet par défaut (en bas) : **`manga_collection`**

## 2. Créer les en-têtes de colonnes

Dans l'onglet `manga_collection`, saisir les en-têtes suivants **exactement** (sensible à la casse) en ligne 1 :

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| `anilist_id` | `title_romaji` | `title_english` | `title_native` | `cover_url` | `total_volumes` | `owned_volumes` | `status` | `added_date` |

> ⚠️ L'ordre des colonnes est important. Le code Apps Script s'appuie sur ces noms exacts.

## 3. Figer la ligne d'en-tête

1. Cliquer sur le numéro de ligne `1` pour sélectionner toute la ligne
2. Menu **Affichage > Figer > 1 ligne**

## 4. Formater la colonne `owned_volumes`

La colonne G (`owned_volumes`) contient des tableaux JSON au format texte (ex: `[1,2,3,5]`).

Pour éviter que Google Sheets tente d'interpréter ce contenu :
1. Sélectionner la colonne G entière
2. Menu **Format > Nombre > Texte brut**

## 5. Ajouter une feuille de configuration (optionnel mais recommandé)

Créer un second onglet nommé **`config`** avec :

| A | B |
|---|---|
| `last_updated` | *(laissé vide, sera rempli automatiquement par Apps Script)* |

Ce n'est pas requis pour le fonctionnement mais utile pour déboguer.

## 6. Récupérer l'ID du Sheet

L'URL du classeur a la forme :
```
https://docs.google.com/spreadsheets/d/SHEET_ID_ICI/edit
```

Noter le `SHEET_ID` : il sera nécessaire dans la configuration Apps Script.

## 7. Permissions

Le Google Sheet **ne doit pas** être partagé publiquement en écriture. L'accès en lecture/écriture se fait exclusivement via Apps Script, qui s'exécute avec le compte du propriétaire.

---

## Vérification

Une fois configuré, une ligne de test peut être ajoutée manuellement :

```
20654 | Naruto | Naruto | ナルト | https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx20654-NLlAQ84JCkUC.jpg | 72 | [1,2,3] | FINISHED | 2026-03-23
```

Cette ligne sera supprimable depuis l'interface admin ou directement dans le sheet.
