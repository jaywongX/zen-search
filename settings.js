import { updateLanguage, getCurrentLanguage, getMessage } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化国际化
  const currentLang = await getCurrentLanguage();
  await updateLanguage(currentLang);

  // 返回按钮处理
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // 清除数据按钮处理
  const clearDataBtn = document.getElementById('clearDataBtn');
  clearDataBtn.addEventListener('click', () => {
    if (confirm(getMessage('clearDataConfirm'))) {
      chrome.storage.local.set({ sites: [] }, () => {
        alert(getMessage('dataCleared'));
      });
    }
  });
}); 