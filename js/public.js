// ============================================================
// public.js — Logique de la page publique (index.html)
// cf. ADR-0001 : site statique, vue lecture seule pour visiteurs
// cf. ADR-0002 : données chargées depuis Google Sheets
// ============================================================

// ── État global ────────────────────────────────────────────
let allMangas = [];

// ── Initialisation ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCollection();
  initSearch();
  initModal();
});

// ── Chargement de la collection ────────────────────────────
async function loadCollection() {
  const grid = document.getElementById('manga-grid');
  const loader = document.getElementById('loading-indicator');
  const errorEl = document.getElementById('error-message');

  try {
    allMangas = await Sheets.getCollection();
    loader.classList.add('hidden');
    updateStats(allMangas);
    renderGrid(allMangas);
  } catch (err) {
    console.error('public.js : erreur chargement collection', err);
    loader.classList.add('hidden');
    errorEl.textContent = 'Impossible de charger la collection. Veuillez réessayer plus tard.';
    errorEl.classList.remove('hidden');
  }
}

// ── Rendu de la grille ─────────────────────────────────────
function renderGrid(mangas) {
  const grid = document.getElementById('manga-grid');
  const emptyEl = document.getElementById('empty-message');

  grid.innerHTML = '';

  if (mangas.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  mangas.forEach(manga => {
    const card = createMangaCard(manga);
    grid.appendChild(card);
  });
}

// ── Création d'une carte manga ─────────────────────────────
function createMangaCard(manga) {
  const totalVolumes = manga.total_volumes;
  const ownedCount = manga.owned_volumes.length;
  const isComplete = totalVolumes > 0 && ownedCount >= totalVolumes;
  const hasMissing = totalVolumes > 0 && ownedCount < totalVolumes;

  const card = document.createElement('article');
  card.className = 'manga-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Voir les détails de ${manga.title_romaji}`);

  // Couverture
  const cover = document.createElement('img');
  cover.className = 'manga-card__cover';
  cover.src = manga.cover_url || '';
  cover.alt = `Couverture de ${manga.title_romaji}`;
  cover.loading = 'lazy';

  // Corps
  const body = document.createElement('div');
  body.className = 'manga-card__body';

  const title = document.createElement('h2');
  title.className = 'manga-card__title';
  title.textContent = manga.title_romaji;

  const progress = document.createElement('p');
  progress.className = 'manga-card__progress';
  progress.textContent = buildProgressText(ownedCount, totalVolumes);

  const badges = document.createElement('div');
  badges.className = 'manga-card__badges';

  if (isComplete) {
    badges.appendChild(createBadge('Complète', 'complete'));
  } else if (hasMissing) {
    badges.appendChild(createBadge(`${totalVolumes - ownedCount} manquant(s)`, 'incomplete'));
  }

  body.appendChild(title);
  body.appendChild(progress);
  body.appendChild(badges);
  card.appendChild(cover);
  card.appendChild(body);

  // Ouverture de la modale au clic ou Entrée
  const openDetail = () => openMangaModal(manga);
  card.addEventListener('click', openDetail);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
  });

  return card;
}

function createBadge(text, modifier) {
  const badge = document.createElement('span');
  badge.className = `badge badge--${modifier}`;
  badge.textContent = text;
  return badge;
}

function buildProgressText(owned, total) {
  if (total === 0) return `${owned} tome(s) possédé(s)`;
  return `${owned} / ${total} tome(s)`;
}

// ── Stats ──────────────────────────────────────────────────
function updateStats(mangas) {
  let totalOwned = 0;
  let totalMissing = 0;

  mangas.forEach(manga => {
    totalOwned += manga.owned_volumes.length;
    if (manga.total_volumes > 0) {
      totalMissing += Math.max(0, manga.total_volumes - manga.owned_volumes.length);
    }
  });

  document.getElementById('stat-series').textContent = mangas.length;
  document.getElementById('stat-volumes-owned').textContent = totalOwned;
  document.getElementById('stat-volumes-missing').textContent = totalMissing;
}

// ── Recherche et filtres ───────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const filterSelect = document.getElementById('filter-status');

  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);
}

function applyFilters() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const status = document.getElementById('filter-status').value;

  const filtered = allMangas.filter(manga => {
    const matchesSearch =
      !query ||
      manga.title_romaji.toLowerCase().includes(query) ||
      (manga.title_english && manga.title_english.toLowerCase().includes(query)) ||
      (manga.title_native && manga.title_native.toLowerCase().includes(query));

    let matchesStatus = true;
    if (status === 'complete') {
      matchesStatus = manga.total_volumes > 0 && manga.owned_volumes.length >= manga.total_volumes;
    } else if (status === 'incomplete') {
      matchesStatus = manga.total_volumes > 0 && manga.owned_volumes.length < manga.total_volumes;
    } else if (status !== 'all') {
      matchesStatus = manga.status === status;
    }

    return matchesSearch && matchesStatus;
  });

  renderGrid(filtered);
}

// ── Modale détail manga ────────────────────────────────────
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeMangaModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeMangaModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMangaModal();
  });
}

function openMangaModal(manga) {
  const modal = document.getElementById('manga-modal');
  const body = document.getElementById('modal-body');

  body.innerHTML = '';
  body.appendChild(buildMangaDetail(manga));

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close').focus();

  // Pour les séries sans total connu, tenter de récupérer le total actuel depuis AniList
  // cf. ADR-0003 : AniList comme référence manga
  if (manga.total_volumes === 0) {
    refreshVolumesFromAniList(manga, body);
  }
}

/**
 * Rafraîchit la section volumes d'un manga depuis AniList (cas total inconnu).
 * Mise à jour silencieuse : si AniList échoue, l'affichage existant est conservé.
 * @param {Object} manga
 * @param {HTMLElement} modalBody
 */
async function refreshVolumesFromAniList(manga, modalBody) {
  try {
    const fresh = await AniList.getMangaById(manga.anilist_id);
    if (fresh?.volumes && fresh.volumes > 0) {
      manga.total_volumes = fresh.volumes;
      manga.status = fresh.status || manga.status;
      // Remplacer uniquement la section volumes
      const existing = modalBody.querySelector('.manga-detail__volumes-section');
      if (existing) {
        existing.replaceWith(buildVolumesSection(manga));
      }
    }
  } catch (err) {
    // Non bloquant : AniList indisponible, affichage conservé
    console.error('public.js : impossible de rafraîchir depuis AniList', err);
  }
}

function closeMangaModal() {
  const modal = document.getElementById('manga-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function buildMangaDetail(manga) {
  const detail = document.createElement('div');
  detail.className = 'manga-detail';

  // En-tête : couverture + titres
  const header = document.createElement('div');
  header.className = 'manga-detail__header';

  const cover = document.createElement('img');
  cover.className = 'manga-detail__cover';
  cover.src = manga.cover_url || '';
  cover.alt = `Couverture de ${manga.title_romaji}`;
  cover.loading = 'lazy';

  const titles = document.createElement('div');
  titles.className = 'manga-detail__titles';

  const titleMain = document.createElement('h2');
  titleMain.className = 'manga-detail__title-main';
  titleMain.textContent = manga.title_romaji;

  const titleAlt = document.createElement('p');
  titleAlt.className = 'manga-detail__title-alt';
  const altParts = [];
  if (manga.title_english) altParts.push(manga.title_english);
  if (manga.title_native) altParts.push(manga.title_native);
  titleAlt.textContent = altParts.join(' · ');

  const meta = document.createElement('div');
  meta.className = 'manga-detail__meta';
  meta.appendChild(createBadge(AniList.formatStatus(manga.status), 'status'));
  if (manga.total_volumes > 0) {
    const volBadge = createBadge(`${manga.total_volumes} tomes`, 'status');
    meta.appendChild(volBadge);
  }

  titles.appendChild(titleMain);
  if (altParts.length) titles.appendChild(titleAlt);
  titles.appendChild(meta);

  header.appendChild(cover);
  header.appendChild(titles);

  detail.appendChild(header);
  detail.appendChild(buildVolumesSection(manga));
  return detail;
}

/**
 * Construit la section complète des volumes (titre + légende + grille).
 * Extraite pour pouvoir être remplacée dynamiquement après un appel AniList.
 * @param {Object} manga
 * @returns {HTMLElement}
 */
function buildVolumesSection(manga) {
  const section = document.createElement('div');
  section.className = 'manga-detail__volumes-section';

  const ownedCount = manga.owned_volumes.length;
  const total = manga.total_volumes;

  // Titre de section
  const sectionTitle = document.createElement('p');
  sectionTitle.className = 'manga-detail__section-title';
  sectionTitle.textContent = total > 0
    ? `Tomes (${ownedCount} possédé${ownedCount > 1 ? 's' : ''} sur ${total})`
    : `Tomes possédés : ${ownedCount}`;
  section.appendChild(sectionTitle);

  if (total > 0) {
    section.appendChild(buildVolumesLegend(ownedCount, total - ownedCount));
    section.appendChild(buildVolumesGrid(manga.owned_volumes, total));
  } else if (ownedCount > 0) {
    // Total inconnu (en cours de publication, AniList non renseigné) :
    // on affiche les tomes possédés et on indique l'incertitude
    const note = document.createElement('p');
    note.className = 'manga-detail__section-note';
    note.textContent = 'Total de la série non connu — tomes possédés uniquement.';
    section.appendChild(note);
    section.appendChild(buildVolumesLegend(ownedCount, 0));
    section.appendChild(buildVolumesGrid(manga.owned_volumes, Math.max(...manga.owned_volumes)));
  } else {
    const none = document.createElement('p');
    none.className = 'empty-message';
    none.style.padding = '0';
    none.textContent = 'Aucun tome possédé.';
    section.appendChild(none);
  }

  return section;
}

/**
 * Construit la légende visuelle de la grille de volumes.
 * @param {number} ownedCount
 * @param {number} missingCount
 * @returns {HTMLElement}
 */
function buildVolumesLegend(ownedCount, missingCount) {
  const legend = document.createElement('div');
  legend.className = 'volumes-legend';

  const ownedItem = document.createElement('span');
  ownedItem.className = 'volumes-legend__item volumes-legend__item--owned';
  ownedItem.textContent = `✓ Possédé (${ownedCount})`;

  legend.appendChild(ownedItem);

  if (missingCount > 0) {
    const missingItem = document.createElement('span');
    missingItem.className = 'volumes-legend__item volumes-legend__item--missing';
    missingItem.textContent = `✕ Manquant (${missingCount})`;
    legend.appendChild(missingItem);
  }

  return legend;
}

function buildVolumesGrid(ownedVolumes, maxVolume) {
  const grid = document.createElement('div');
  grid.className = 'volumes-grid';

  const ownedSet = new Set(ownedVolumes);

  for (let i = 1; i <= maxVolume; i++) {
    const chip = document.createElement('div');
    chip.className = `volume-chip ${ownedSet.has(i) ? 'volume-chip--owned' : 'volume-chip--missing'}`;
    chip.textContent = i;
    chip.setAttribute('aria-label', `Tome ${i} : ${ownedSet.has(i) ? 'possédé' : 'manquant'}`);
    grid.appendChild(chip);
  }

  return grid;
}
