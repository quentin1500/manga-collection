// ============================================================
// config.js — Configuration globale de l'application
// ⚠️ Renseigner les valeurs avant de déployer (cf. docs/setup/)
// cf. ADR-0001 : site statique, pas de secrets serveur
// cf. ADR-0004 : stratégie authentification admin
// ============================================================

const CONFIG = {
  // URL de la Web App Google Apps Script déployée
  // cf. docs/setup/apps-script-setup.md
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz_gSiR70Tqj8dw4VcUnQQ1G3XcRJ_KKaBD5UNAAYmvhju-jQn5S2TJqN7FotUbc3vW/exec',

  // Hash SHA-256 du mot de passe admin (en minuscules hexadécimaux)
  // Générer avec : ouvrir generate-hash.html dans le navigateur
  // cf. ADR-0004 : authentification par hash côté client
  PASSWORD_HASH: '72fe99030bf6574d7566f63ad2e61d851db77ef620d361499c4f016b496c86f5',

  // Nom du site (affiché dans le titre et les métadonnées)
  SITE_NAME: 'Ma Collection Manga',
};
