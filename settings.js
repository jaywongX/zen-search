import { updateLanguage, getCurrentLanguage, getMessage } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  const currentLang = await getCurrentLanguage();
  await updateLanguage(currentLang);

  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  const clearDataBtn = document.getElementById('clearDataBtn');
  clearDataBtn.addEventListener('click', () => {
    if (confirm(getMessage('clearDataConfirm'))) {
      chrome.storage.local.set({ sites: [] }, () => {
        alert(getMessage('dataCleared'));
      });
    }
  });
}); 