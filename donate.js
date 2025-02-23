import { updateLanguage } from './i18n.js';

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'settings.html';
});

// Initialize translations
document.addEventListener('DOMContentLoaded', async () => {
  const { language } = await chrome.storage.local.get(['language']);
  await updateLanguage(language || 'en');
});