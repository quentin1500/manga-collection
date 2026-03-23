// ============================================================
// admin.js — Logique de la page d'administration (admin.html)
// cf. ADR-0004 : authentification admin par hash SHA-256
// cf. ADR-0002 : persistance via Apps Script / Google Sheets
// cf. ADR-0003 : recherche manga via AniList
// ============================================================

// ── État global ────────────────────────────────────────────
let adminCollection = [];
let pendingDeleteId = null;

// ── Initialisation ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initConfirmModal();
});

// ── Authentification ───────────────────────────────────────
function initLoginForm() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const input = document.getElementById('password-input');
  const errorEl = document.getElementById('login-error');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  errorEl.classList.add('hidden');
  input.classList.remove('is-invalid');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Vérification…';

  try {
    const ok = await Auth.verify(input.value);
    if (ok) {
      showAdminPanel();
    } else {
      input.classList.add('is-invalid');
      errorEl.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  } catch (err) {
    console.error('admin.js : erreur lors de la vérification', err);
    errorEl.textContent = 'Une erreur est survenue. Réessayez.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
  }
}

function showAdminPanel() {
  document.getElementById('login-panel').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('btn-logout').classList.remove('hidden');

  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  initAnilistSearch();
  initAdminFilter();
  loadAdminCollection();
}

function handleLogout() {
  Auth.logout();
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('login-panel').classList.remove('hidden');
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('password-input').value = '';
}

// ── Chargement collection admin ────────────────────────────
async function loadAdminCollection() {
  const loader = document.getElementById('admin-loading');
  const errorEl = document.getElementById('admin-error');
  const emptyEl = document.getElementById('admin-empty');

  loader.classList.remove('hidden');
  errorEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  try {
    adminCollection = await Sheets.getCollection();
    loader.classList.add('hidden');
    renderAdminCollection(adminCollection);
  } catch (err) {
    console.error('admin.js : erreur chargement collection', err);
    loader.classList.add('hidden');
    errorEl.textContent = 'Impossible de charger la collection : ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

// ── Rendu de la collection admin ───────────────────────────
function renderAdminCollection(mangas) {
  const container = document.getElementById('admin-collection');
  const emptyEl = document.getElementById('admin-empty');

  container.innerHTML = '';

  if (mangas.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  mangas.forEach(manga => {
    container.appendChild(createAdminMangaItem(manga));
  });
}

function createAdminMangaItem(manga) {
  const item = document.createElement('div');
  item.className = 'admin-manga-item';
  item.dataset.anilistId = manga.anilist_id;

  // En-tête
  const header = document.createElement('div');
  header.className = 'admin-manga-item__header';

  const cover = document.createElement('img');
  cover.className = 'admin-manga-item__cover';
  cover.src = manga.cover_url || '';
  cover.alt = `Couverture de ${manga.title_romaji}`;
  cover.loading = 'lazy';

  const info = document.createElement('div');
  info.className = 'admin-manga-item__info';

  const title = document.createElement('h3');
  title.className = 'admin-manga-item__title';
  title.textContent = manga.title_romaji;

  const metaText = buildAdminMetaText(manga);
  const metaEl = document.createElement('p');
  metaEl.className = 'admin-manga-item__meta';
  metaEl.textContent = metaText;

  info.appendChild(title);
  info.appendChild(metaEl);

  const actions = document.createElement('div');
  actions.className = 'admin-manga-item__actions';
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--danger btn--sm';
  deleteBtn.textContent = 'Supprimer';
  deleteBtn.setAttribute('aria-label', `Supprimer ${manga.title_romaji}`);
  deleteBtn.addEventListener('click', () => openConfirmDelete(manga));
  actions.appendChild(deleteBtn);

  header.appendChild(cover);
  header.appendChild(info);
  header.appendChild(actions);

  // Section volumes
  const volumesSection = document.createElement('div');
  volumesSection.className = 'admin-manga-item__volumes-section';

  const volumesLabel = document.createElement('div');
  volumesLabel.className = 'admin-manga-item__volumes-label';

  const labelText = document.createElement('span');
  labelText.textContent = buildVolumesLabelText(manga);
  labelText.id = `volumes-label-${manga.anilist_id}`;

  const saveStatus = document.createElement('span');
  saveStatus.className = 'admin-manga-item__save-status';
  saveStatus.id = `save-status-${manga.anilist_id}`;
  saveStatus.style.opacity = '0';
  saveStatus.setAttribute('aria-live', 'polite');
  saveStatus.textContent = 'Sauvegardé ✓';

  volumesLabel.appendChild(labelText);
  volumesLabel.appendChild(saveStatus);

  const grid = createVolumeCheckboxGrid(manga);

  volumesSection.appendChild(volumesLabel);
  volumesSection.appendChild(grid);

  item.appendChild(header);
  item.appendChild(volumesSection);
  return item;
}

function buildAdminMetaText(manga) {
  const parts = [AniList.formatStatus(manga.status)];
  if (manga.total_volumes > 0) parts.push(`${manga.total_volumes} tome(s)`);
  parts.push(`${manga.owned_volumes.length} possédé(s)`);
  return parts.join(' · ');
}

function buildVolumesLabelText(manga) {
  const total = manga.total_volumes;
  const owned = manga.owned_volumes.length;
  if (total > 0) return `Tomes (${owned}/${total}) — cliquer pour cocher/décocher`;
  return `Tomes possédés : ${owned} — cliquer pour cocher/décocher`;
}

// ── Grille de checkboxes volumes ───────────────────────────
function createVolumeCheckboxGrid(manga) {
  const grid = document.createElement('div');
  grid.className = 'volumes-grid';
  grid.id = `volumes-grid-${manga.anilist_id}`;

  const totalToShow = manga.total_volumes > 0
    ? manga.total_volumes
    : (manga.owned_volumes.length > 0 ? Math.max(...manga.owned_volumes) + 5 : 10);

  renderVolumeChips(grid, manga, totalToShow);
  return grid;
}

function renderVolumeChips(grid, manga, count) {
  grid.innerHTML = '';
  const ownedSet = new Set(manga.owned_volumes);

  for (let i = 1; i <= count; i++) {
    const chip = document.createElement('button');
    chip.className = `volume-chip volume-chip--checkbox${ownedSet.has(i) ? ' is-owned' : ''}`;
    chip.textContent = i;
    chip.setAttribute('type', 'button');
    chip.setAttribute('aria-label', `Tome ${i} : ${ownedSet.has(i) ? 'possédé' : 'non possédé'}`);
    chip.setAttribute('aria-pressed', ownedSet.has(i) ? 'true' : 'false');

    chip.addEventListener('click', () => handleVolumeToggle(manga, i, chip, grid));
    grid.appendChild(chip);
  }

  // Bouton "+" pour les séries sans total défini
  if (manga.total_volumes === 0) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn--ghost btn--sm';
    addBtn.textContent = '+5';
    addBtn.setAttribute('aria-label', 'Afficher 5 tomes supplémentaires');
    addBtn.addEventListener('click', () => renderVolumeChips(grid, manga, count + 5));
    grid.appendChild(addBtn);
  }
}

async function handleVolumeToggle(manga, volumeNumber, chipEl, grid) {
  // Mise à jour optimiste de l'état local
  const ownedSet = new Set(manga.owned_volumes);
  if (ownedSet.has(volumeNumber)) {
    ownedSet.delete(volumeNumber);
  } else {
    ownedSet.add(volumeNumber);
  }
  manga.owned_volumes = Array.from(ownedSet).sort((a, b) => a - b);

  // Mise à jour visuelle immédiate
  chipEl.classList.toggle('is-owned');
  const isNowOwned = chipEl.classList.contains('is-owned');
  chipEl.setAttribute('aria-pressed', isNowOwned ? 'true' : 'false');
  chipEl.setAttribute('aria-label', `Tome ${volumeNumber} : ${isNowOwned ? 'possédé' : 'non possédé'}`);

  // Mise à jour du label
  const labelEl = document.getElementById(`volumes-label-${manga.anilist_id}`);
  if (labelEl) {
    labelEl.querySelector('span')?.remove();
    const span = document.createElement('span');
    span.textContent = buildVolumesLabelText(manga);
    labelEl.prepend(span);
  }

  // Persistance en arrière-plan
  try {
    // Récupérer le mot de passe depuis la session (re-demander si nécessaire est hors scope)
    const password = getSessionPassword();
    await Sheets.updateOwnedVolumes(manga.anilist_id, manga.owned_volumes, password);
    showSaveStatus(manga.anilist_id, true);
  } catch (err) {
    console.error('admin.js : erreur sauvegarde volumes', err);
    showSaveStatus(manga.anilist_id, false, err.message);
    // Rollback visuel
    if (ownedSet.has(volumeNumber)) {
      ownedSet.delete(volumeNumber);
    } else {
      ownedSet.add(volumeNumber);
    }
    manga.owned_volumes = Array.from(ownedSet).sort((a, b) => a - b);
    chipEl.classList.toggle('is-owned');
  }
}

function showSaveStatus(anilistId, success, errorMsg = '') {
  const el = document.getElementById(`save-status-${anilistId}`);
  if (!el) return;
  el.textContent = success ? 'Sauvegardé ✓' : `Erreur : ${errorMsg}`;
  el.style.color = success ? 'var(--color-success)' : 'var(--color-danger)';
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ── Gestion du mot de passe de session ────────────────────
// Stocké en variable module (jamais en localStorage — cf. ADR-0004)
let _sessionPassword = '';

function getSessionPassword() {
  return _sessionPassword;
}

// Récupérer le mot de passe au moment de la connexion
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', (e) => {
    // Capturer la valeur avant que handleLogin ne vide le champ
    _sessionPassword = document.getElementById('password-input').value;
  }, { capture: true });
});

// ── Recherche AniList ──────────────────────────────────────
function initAnilistSearch() {
  const searchInput = document.getElementById('anilist-search-input');
  const searchBtn = document.getElementById('btn-anilist-search');

  searchBtn.addEventListener('click', handleAnilistSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAnilistSearch();
  });
}

async function handleAnilistSearch() {
  const input = document.getElementById('anilist-search-input');
  const resultsEl = document.getElementById('anilist-results');
  const query = input.value.trim();
  const btn = document.getElementById('btn-anilist-search');

  if (!query) return;

  btn.disabled = true;
  btn.textContent = 'Recherche…';
  resultsEl.innerHTML = '';
  resultsEl.classList.remove('hidden');

  try {
    const results = await AniList.searchManga(query);
    renderAnilistResults(results, resultsEl);
  } catch (err) {
    console.error('admin.js : erreur recherche AniList', err);
    const errEl = document.createElement('p');
    errEl.className = 'error-message';
    errEl.textContent = err.message;
    resultsEl.appendChild(errEl);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Rechercher';
  }
}

function renderAnilistResults(results, container) {
  const alreadyAdded = new Set(adminCollection.map(m => m.anilist_id));

  if (results.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.style.padding = '0.5rem 0';
    empty.textContent = 'Aucun résultat sur AniList.';
    container.appendChild(empty);
    return;
  }

  results.forEach(media => {
    const item = createAnilistResultItem(media, alreadyAdded.has(media.id));
    container.appendChild(item);
  });
}

function createAnilistResultItem(media, alreadyAdded) {
  const item = document.createElement('div');
  item.className = `anilist-result-item${alreadyAdded ? ' anilist-result-item--already-added' : ''}`;

  const cover = document.createElement('img');
  cover.className = 'anilist-result-item__cover';
  cover.src = media.coverImage?.medium || '';
  cover.alt = `Couverture de ${media.title.romaji}`;
  cover.loading = 'lazy';

  const info = document.createElement('div');
  info.className = 'anilist-result-item__info';

  const title = document.createElement('p');
  title.className = 'anilist-result-item__title';
  title.textContent = media.title.romaji;

  const metaParts = [AniList.formatStatus(media.status)];
  if (media.volumes) metaParts.push(`${media.volumes} tomes`);
  const meta = document.createElement('p');
  meta.className = 'anilist-result-item__meta';
  meta.textContent = metaParts.join(' · ');

  info.appendChild(title);
  info.appendChild(meta);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary btn--sm anilist-result-item__add-btn';
  addBtn.setAttribute('aria-label', `Ajouter ${media.title.romaji} à la collection`);

  if (alreadyAdded) {
    addBtn.textContent = 'Déjà ajouté';
    addBtn.disabled = true;
  } else {
    addBtn.textContent = 'Ajouter';
    addBtn.addEventListener('click', () => handleAddManga(media, addBtn));
  }

  item.appendChild(cover);
  item.appendChild(info);
  item.appendChild(addBtn);
  return item;
}

async function handleAddManga(media, btn) {
  btn.disabled = true;
  btn.textContent = 'Ajout…';

  try {
    const newManga = AniList.toSheetRow(media);
    await Sheets.addManga(newManga, getSessionPassword());

    // Mettre à jour la liste locale et re-rendre
    adminCollection.push({ ...newManga });
    renderAdminCollection(adminCollection);

    btn.textContent = 'Ajouté ✓';
    btn.className = 'btn btn--ghost btn--sm anilist-result-item__add-btn';
  } catch (err) {
    console.error('admin.js : erreur ajout manga', err);
    btn.disabled = false;
    btn.textContent = 'Erreur — Réessayer';
    const errorEl = document.getElementById('admin-error');
    errorEl.textContent = 'Erreur lors de l\'ajout : ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

// ── Filtre admin ───────────────────────────────────────────
function initAdminFilter() {
  document.getElementById('admin-filter-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderAdminCollection(adminCollection);
      return;
    }
    const filtered = adminCollection.filter(m =>
      m.title_romaji.toLowerCase().includes(query) ||
      (m.title_english && m.title_english.toLowerCase().includes(query))
    );
    renderAdminCollection(filtered);
  });
}

// ── Suppression avec confirmation ─────────────────────────
function initConfirmModal() {
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-backdrop').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-ok').addEventListener('click', handleConfirmDelete);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeConfirmModal();
  });
}

function openConfirmDelete(manga) {
  pendingDeleteId = manga.anilist_id;
  const msgEl = document.getElementById('confirm-message');
  msgEl.textContent = `Supprimer "${manga.title_romaji}" définitivement de la collection ?`;
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-ok').focus();
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
  pendingDeleteId = null;
}

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const okBtn = document.getElementById('confirm-ok');
  okBtn.disabled = true;
  okBtn.textContent = 'Suppression…';

  try {
    await Sheets.deleteManga(pendingDeleteId, getSessionPassword());
    adminCollection = adminCollection.filter(m => m.anilist_id !== pendingDeleteId);
    renderAdminCollection(adminCollection);
    closeConfirmModal();
  } catch (err) {
    console.error('admin.js : erreur suppression', err);
    const errorEl = document.getElementById('admin-error');
    errorEl.textContent = 'Erreur lors de la suppression : ' + err.message;
    errorEl.classList.remove('hidden');
    closeConfirmModal();
  } finally {
    okBtn.disabled = false;
    okBtn.textContent = 'Supprimer';
  }
}
