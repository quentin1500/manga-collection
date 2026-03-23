// ============================================================
// sheets.js — Appels à l'API Google Apps Script (Google Sheets)
// cf. ADR-0002 : persistance via Google Sheets + Apps Script
// ============================================================

const Sheets = (() => {

  /**
   * Vérifie que l'URL Apps Script est configurée.
   * @throws {Error}
   */
  function assertConfigured() {
    if (!CONFIG.APPS_SCRIPT_URL) {
      throw new Error(
        'APPS_SCRIPT_URL non configurée dans js/config.js. ' +
        'Consulter docs/setup/apps-script-setup.md'
      );
    }
  }

  /**
   * Récupère toute la collection depuis Google Sheets (lecture publique).
   * @returns {Promise<Array>} Tableau de mangas
   */
  async function getCollection() {
    assertConfigured();
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=getCollection`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur serveur (HTTP ${response.status}) lors du chargement de la collection.`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    // Désérialiser owned_volumes (stocké en JSON string dans Sheets)
    return (json.mangas ?? []).map(manga => ({
      ...manga,
      anilist_id:    Number(manga.anilist_id),
      total_volumes: Number(manga.total_volumes),
      owned_volumes: parseOwnedVolumes(manga.owned_volumes),
    }));
  }

  /**
   * Ajoute un manga à la collection (requiert authentification admin).
   * @param {Object} manga - Objet manga au format sheet row (cf. anilist.js#toSheetRow)
   * @param {string} password - Mot de passe admin en clair
   * @returns {Promise<void>}
   */
  async function addManga(manga, password) {
    assertConfigured();
    await postAction({
      action:   'addManga',
      password,
      manga: {
        ...manga,
        owned_volumes: JSON.stringify(manga.owned_volumes ?? []),
      },
    });
  }

  /**
   * Met à jour les volumes possédés d'un manga (requiert authentification admin).
   * @param {number} anilistId
   * @param {number[]} ownedVolumes - Tableau des numéros de tomes possédés
   * @param {string} password
   * @returns {Promise<void>}
   */
  async function updateOwnedVolumes(anilistId, ownedVolumes, password) {
    assertConfigured();
    await postAction({
      action:       'updateOwnedVolumes',
      password,
      anilist_id:   anilistId,
      owned_volumes: JSON.stringify(ownedVolumes),
    });
  }

  /**
   * Supprime un manga de la collection (requiert authentification admin).
   * @param {number} anilistId
   * @param {string} password
   * @returns {Promise<void>}
   */
  async function deleteManga(anilistId, password) {
    assertConfigured();
    await postAction({
      action:     'deleteManga',
      password,
      anilist_id: anilistId,
    });
  }

  /**
   * Effectue un POST vers l'Apps Script avec un body JSON.
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async function postAction(body) {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method:  'POST',
      // Content-Type omis volontairement : Apps Script accepte mieux text/plain pour les POST cross-origin
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur (HTTP ${response.status}).`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    return json;
  }

  /**
   * Parse la valeur owned_volumes depuis Google Sheets.
   * Accepte un tableau déjà parsé, une string JSON ou une string vide.
   * @param {string|Array} value
   * @returns {number[]}
   */
  function parseOwnedVolumes(value) {
    if (Array.isArray(value)) return value.map(Number);
    if (!value || value === '') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }

  return { getCollection, addManga, updateOwnedVolumes, deleteManga };
})();
