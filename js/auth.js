// ============================================================
// auth.js — Authentification administrateur
// cf. ADR-0004 : hash SHA-256 côté client, session en mémoire
// ============================================================

const Auth = (() => {
  // État de session en mémoire (volontairement non persisté — cf. ADR-0004)
  let _authenticated = false;

  /**
   * Hash une chaîne de caractères en SHA-256 (hexadécimal minuscule).
   * Utilise l'API Web Crypto native du navigateur.
   * @param {string} message
   * @returns {Promise<string>}
   */
  async function hashPassword(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Vérifie le mot de passe saisi par rapport au hash stocké dans config.js.
   * @param {string} password - Mot de passe en clair saisi par l'utilisateur
   * @returns {Promise<boolean>}
   */
  async function verify(password) {
    if (!CONFIG.PASSWORD_HASH) {
      console.error('auth.js : CONFIG.PASSWORD_HASH non configuré (cf. docs/setup/github-pages-setup.md)');
      return false;
    }
    const hash = await hashPassword(password);
    _authenticated = hash === CONFIG.PASSWORD_HASH;
    return _authenticated;
  }

  /**
   * @returns {boolean} Vrai si l'admin est authentifié pour cette session.
   */
  function isAuthenticated() {
    return _authenticated;
  }

  /**
   * Termine la session admin (sans recharger la page).
   */
  function logout() {
    _authenticated = false;
  }

  return { verify, isAuthenticated, logout };
})();
