// ============================================================
// Code.gs — Google Apps Script pour manga-collection
// cf. ADR-0002 : persistance via Google Sheets + Apps Script
// cf. ADR-0004 : authentification par mot de passe (Script Properties)
//
// INSTALLATION :
//   1. Extensions > Apps Script dans le Google Sheet
//   2. Coller ce code dans Code.gs
//   3. Ajouter dans Script Properties :
//      - SHEET_ID    → l'ID du Google Sheet
//      - ADMIN_PASSWORD → votre mot de passe admin en clair
//   4. Déployer > Nouveau déploiement > Web App
//      (Exécuter en tant que : Moi | Accès : Tout le monde)
//   cf. docs/setup/apps-script-setup.md
// ============================================================

// ── Configuration ──────────────────────────────────────────
const SHEET_NAME = 'manga_collection';

const COLUMNS = {
  ANILIST_ID:    0,
  TITLE_ROMAJI:  1,
  TITLE_ENGLISH: 2,
  TITLE_NATIVE:  3,
  COVER_URL:     4,
  TOTAL_VOLUMES: 5,
  OWNED_VOLUMES: 6,
  STATUS:        7,
  ADDED_DATE:    8,
};

// ── Entrée HTTP ────────────────────────────────────────────

/**
 * Gère les requêtes GET (lecture publique).
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getCollection') {
      return jsonResponse({ mangas: getCollection() });
    }
    return jsonResponse({ error: 'Action inconnue' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

/**
 * Gère les requêtes POST (opérations CRUD protégées par mot de passe).
 * @param {GoogleAppsScript.Events.DoPost} e
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (!verifyPassword(body.password)) {
      return jsonResponse({ error: 'Mot de passe incorrect' });
    }

    switch (body.action) {
      case 'addManga':
        return jsonResponse(addManga(body.manga));
      case 'updateOwnedVolumes':
        return jsonResponse(updateOwnedVolumes(body.anilist_id, body.owned_volumes));
      case 'deleteManga':
        return jsonResponse(deleteManga(body.anilist_id));
      default:
        return jsonResponse({ error: 'Action inconnue' });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Authentification ───────────────────────────────────────

/**
 * Vérifie le mot de passe par rapport à la Script Property ADMIN_PASSWORD.
 * @param {string} password
 * @returns {boolean}
 */
function verifyPassword(password) {
  const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!stored) {
    throw new Error('ADMIN_PASSWORD non configuré dans les Script Properties');
  }
  return password === stored;
}

// ── Lecture ────────────────────────────────────────────────

/**
 * Retourne tous les mangas de la collection.
 * @returns {Object[]}
 */
function getCollection() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  // Ignorer la ligne d'en-tête (index 0)
  return data.slice(1).map(row => rowToObject(row));
}

// ── Écriture ───────────────────────────────────────────────

/**
 * Ajoute un manga si l'anilist_id n'existe pas déjà.
 * @param {Object} manga
 * @returns {{ success: boolean, message: string }}
 */
function addManga(manga) {
  const sheet = getSheet();
  const anilistId = Number(manga.anilist_id);

  if (findRowIndex(anilistId) !== -1) {
    return { success: false, message: 'Ce manga est déjà dans la collection' };
  }

  const row = objectToRow(manga);
  sheet.appendRow(row);
  return { success: true, message: 'Manga ajouté' };
}

/**
 * Met à jour les volumes possédés d'un manga existant.
 * @param {number|string} anilistId
 * @param {string} ownedVolumesJson - Tableau JSON sérialisé
 * @returns {{ success: boolean }}
 */
function updateOwnedVolumes(anilistId, ownedVolumesJson) {
  const id = Number(anilistId);
  const rowIndex = findRowIndex(id);

  if (rowIndex === -1) {
    return { success: false, message: 'Manga introuvable' };
  }

  const sheet = getSheet();
  // +1 pour l'en-tête, +1 car Sheets est 1-indexé
  const sheetRow = rowIndex + 2;
  sheet.getRange(sheetRow, COLUMNS.OWNED_VOLUMES + 1).setValue(ownedVolumesJson);

  return { success: true };
}

/**
 * Supprime un manga par son anilist_id.
 * @param {number|string} anilistId
 * @returns {{ success: boolean }}
 */
function deleteManga(anilistId) {
  const id = Number(anilistId);
  const rowIndex = findRowIndex(id);

  if (rowIndex === -1) {
    return { success: false, message: 'Manga introuvable' };
  }

  const sheet = getSheet();
  sheet.deleteRow(rowIndex + 2);
  return { success: true };
}

// ── Utilitaires internes ───────────────────────────────────

/**
 * Retourne la feuille manga_collection.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Feuille "${SHEET_NAME}" introuvable`);
  return sheet;
}

/**
 * Trouve l'index (0-basé, sans en-tête) d'une ligne par anilist_id.
 * @param {number} anilistId
 * @returns {number} Index dans les données (sans en-tête), -1 si non trouvé
 */
function findRowIndex(anilistId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][COLUMNS.ANILIST_ID]) === anilistId) {
      return i - 1;
    }
  }
  return -1;
}

/**
 * Convertit une ligne Sheets en objet manga.
 * @param {Array} row
 * @returns {Object}
 */
function rowToObject(row) {
  return {
    anilist_id:    String(row[COLUMNS.ANILIST_ID]),
    title_romaji:  String(row[COLUMNS.TITLE_ROMAJI] || ''),
    title_english: String(row[COLUMNS.TITLE_ENGLISH] || ''),
    title_native:  String(row[COLUMNS.TITLE_NATIVE] || ''),
    cover_url:     String(row[COLUMNS.COVER_URL] || ''),
    total_volumes: String(row[COLUMNS.TOTAL_VOLUMES] || '0'),
    owned_volumes: String(row[COLUMNS.OWNED_VOLUMES] || '[]'),
    status:        String(row[COLUMNS.STATUS] || ''),
    added_date:    String(row[COLUMNS.ADDED_DATE] || ''),
  };
}

/**
 * Convertit un objet manga en ligne Sheets.
 * @param {Object} manga
 * @returns {Array}
 */
function objectToRow(manga) {
  return [
    manga.anilist_id,
    manga.title_romaji    || '',
    manga.title_english   || '',
    manga.title_native    || '',
    manga.cover_url       || '',
    manga.total_volumes   || 0,
    manga.owned_volumes   || '[]',
    manga.status          || '',
    manga.added_date      || new Date().toISOString().split('T')[0],
  ];
}

/**
 * Retourne un ContentService JSON avec les headers CORS appropriés.
 * @param {Object} data
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Fonction de test (exécuter manuellement dans l'éditeur GAS) ──

/**
 * @test Vérifie que getCollection fonctionne sans erreur.
 */
function testGetCollection() {
  const result = getCollection();
  Logger.log('Collection : ' + JSON.stringify(result));
}

/**
 * @test Vérifie que verifyPassword fonctionne.
 */
function testVerifyPassword() {
  // Remplacer 'monmotdepasse' par votre mot de passe réel pour tester
  const ok = verifyPassword('monmotdepasse');
  Logger.log('Mot de passe correct : ' + ok);
}
