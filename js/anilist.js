// ============================================================
// anilist.js — Appels à l'API GraphQL AniList
// cf. ADR-0003 : AniList comme référence manga (lecture seule)
// ============================================================

const AniList = (() => {
  const API_URL = 'https://graphql.anilist.co';

  /**
   * Exécute une requête GraphQL vers l'API AniList.
   * @param {string} query - Requête GraphQL
   * @param {Object} variables - Variables de la requête
   * @returns {Promise<Object>} - Données retournées par l'API
   * @throws {Error} En cas d'erreur réseau ou de rate limit
   */
  async function graphqlFetch(query, variables = {}) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    // Rate limit AniList : 90 req/min
    if (response.status === 429) {
      throw new Error('Limite de requêtes AniList atteinte. Veuillez patienter une minute.');
    }

    if (!response.ok) {
      throw new Error(`Erreur AniList (HTTP ${response.status})`);
    }

    const json = await response.json();

    if (json.errors?.length) {
      throw new Error(`Erreur AniList : ${json.errors[0].message}`);
    }

    return json.data;
  }

  /**
   * Recherche des mangas sur AniList par terme de recherche.
   * @param {string} searchTerm
   * @param {number} page
   * @returns {Promise<Array>} Liste de mangas (métadonnées AniList)
   */
  async function searchManga(searchTerm, page = 1) {
    const query = `
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
    `;
    const data = await graphqlFetch(query, { search: searchTerm, page });
    return data.Page.media;
  }

  /**
   * Récupère les détails d'un manga par son ID AniList.
   * @param {number} anilistId
   * @returns {Promise<Object>} Détails du manga
   */
  async function getMangaById(anilistId) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: MANGA) {
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
    `;
    const data = await graphqlFetch(query, { id: anilistId });
    return data.Media;
  }

  /**
   * Convertit un objet Media AniList en format stockable dans Google Sheets.
   * @param {Object} media - Objet Media de l'API AniList
   * @returns {Object}
   */
  function toSheetRow(media) {
    return {
      anilist_id:     media.id,
      title_romaji:   media.title.romaji ?? '',
      title_english:  media.title.english ?? '',
      title_native:   media.title.native ?? '',
      cover_url:      media.coverImage?.medium ?? '',
      total_volumes:  media.volumes ?? 0,
      owned_volumes:  [],
      status:         media.status ?? '',
      added_date:     new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Traduit le statut AniList en libellé français.
   * @param {string} status
   * @returns {string}
   */
  function formatStatus(status) {
    const labels = {
      FINISHED:         'Terminée',
      RELEASING:        'En cours',
      NOT_YET_RELEASED: 'À paraître',
      CANCELLED:        'Annulée',
      HIATUS:           'En pause',
    };
    return labels[status] ?? status;
  }

  return { searchManga, getMangaById, toSheetRow, formatStatus };
})();
