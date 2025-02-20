/**
 * Settings Page Controller
 * Handles settings page interactions and data management
 */

import { updateLanguage, getCurrentLanguage, getMessage } from './i18n.js';

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
      chrome.storage.local.set({ sites: [] }, () => {
        alert(getMessage('dataCleared'));
      });
    }
  });
}); 