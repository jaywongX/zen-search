/**
 * Background Service Worker
 * Handles extension's background tasks and event listeners
 */

import { translations } from './i18n.js';

/**
 * Listen for messages from content scripts
 * Handle cross-domain communication and data requests
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === 'getTranslation') {
    const { key, params } = message;
    chrome.storage.local.get(['language'], ({ language = 'en' }) => {
      let translatedText = translations[language]?.[key] || translations.en[key];
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          translatedText = translatedText.replace(`{${key}}`, value);
        });
      }
      sendResponse(translatedText);
    });
    return true;
  }

  if (message.type === 'updateContextMenus') {
    const lang = message.language;

    chrome.contextMenus.update('add-to-favorites', {
      title: translations[lang].contextMenuFavorite
    });

    chrome.contextMenus.update('add-to-blocked', {
      title: translations[lang].contextMenuBlock
    });
  }
});

/**
 * Listen for keyboard shortcuts
 * Handle user's keyboard shortcut operations
 */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'hide-current-result') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'hideCurrentResult'
        });
      }
    });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const { language = 'en' } = await chrome.storage.local.get(['language']);

  chrome.contextMenus.create({
    id: 'sers-menu',
    title: translations[language]?.extName,
    contexts: ['link', 'page']
  });

  chrome.contextMenus.create({
    id: 'add-to-favorites',
    parentId: 'sers-menu',
    title: translations[language]?.contextMenuFavorite,
    contexts: ['link', 'page']
  });

  chrome.contextMenus.create({
    id: 'add-to-blocked',
    parentId: 'sers-menu',
    title: translations[language]?.contextMenuBlock,
    contexts: ['link', 'page']
  });
});

function updateContextMenus(language) {
  chrome.contextMenus.update('sers-menu', {
    title: translations[language]?.extName
  });

  chrome.contextMenus.update('add-to-favorites', {
    title: translations[language]?.contextMenuFavorite
  });

  chrome.contextMenus.update('add-to-blocked', {
    title: translations[language]?.contextMenuBlock
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateContextMenus') {
    updateContextMenus(message.language);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let domain;
  if (info.linkUrl) {
    domain = new URL(info.linkUrl).hostname;
  } else {
    domain = new URL(tab.url).hostname;
  }

  if (info.menuItemId === 'add-to-favorites') {
    addToList(domain, 'favorites', tab.id);
  } else if (info.menuItemId === 'add-to-blocked') {
    addToList(domain, 'blocked', tab.id);
  }
});

function addToList(domain, listType, tabId) {
  chrome.storage.local.get(['sites', 'language'], (data) => {
    const sites = data.sites || [];
    const lang = data.language || 'en';

    const parts = domain.split('.');
    const mainDomain = parts.length > 2
      ? parts.slice(-2).join('.')
      : domain;

    const wildcardDomain = `*://*.${mainDomain}/*`;

    const existingSite = sites.find(site => site.url === wildcardDomain);

    if (!existingSite) {
      sites.push({
        url: wildcardDomain,
        blocked: listType === 'blocked',
        color: '#e6ffe6',
        top: false
      });

      chrome.storage.local.set({ sites }, () => {
        const message = listType === 'favorites'
          ? translations[lang].addedToFavorites.replace('{domain}', domain)
          : translations[lang].siteBlocked.replace('{domain}', domain);

        chrome.tabs.sendMessage(tabId, {
          type: 'showToast',
          message: message
        });

        chrome.tabs.sendMessage(tabId, {
          type: 'updateResults'
        });
      });
    } else {
      existingSite.blocked = listType === 'blocked';
      chrome.storage.local.set({ sites }, () => {
        const message = listType === 'blocked'
          ? translations[lang].siteBlocked.replace('{domain}', domain)
          : translations[lang].addedToFavorites.replace('{domain}', domain);

        chrome.tabs.sendMessage(tabId, {
          type: 'showToast',
          message: message
        });

        chrome.tabs.sendMessage(tabId, {
          type: 'updateResults'
        });
      });
    }
  });
} 