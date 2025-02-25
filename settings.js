/**
 * Settings Page Controller
 * Handles settings page interactions and data management
 */

import { updateLanguage } from './i18n.js';
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;


function getCurrentLanguage() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['language'], ({ language }) => {
      resolve(language || 'en');
    });
  });
}

function getMessage(key) {
  const lang = getCurrentLanguage();
  return translations[lang]?.[key] || translations.en[key];
}

/**
 * Initialize settings page
 * Set up event listeners and load initial state
 */
document.addEventListener('DOMContentLoaded', async () => {
  const currentLang = await getCurrentLanguage();
  await updateLanguage(currentLang);

  // Set up back button handler
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // Set up clear data button handler
  const clearDataBtn = document.getElementById('clearDataBtn');
  clearDataBtn.addEventListener('click', () => {
    if (confirm(getMessage('clearDataConfirm'))) {
      browserAPI.storage.local.set({ sites: [] }, () => {
        alert(getMessage('dataCleared'));
      });
    }
  });
}); 