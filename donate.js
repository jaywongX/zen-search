import { updateLanguage } from './i18n.js';
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'settings.html';
});

// Initialize translations
document.addEventListener('DOMContentLoaded', async () => {
  const { language } = await browserAPI.storage.local.get(['language']);
  await updateLanguage(language || 'en');
});