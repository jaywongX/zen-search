/**
 * Background Service Worker
 * Handles extension's background tasks and event listeners
 */

import { translations } from './i18n.js';

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const menuAPI = typeof browser !== 'undefined' ? browser.menus : chrome.contextMenus;

/**
 * Listen for messages from content scripts
 * Handle cross-domain communication and data requests
 */
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === 'getTranslation') {
    const { key, params } = message;
    browserAPI.storage.local.get(['language'], ({ language = 'en' }) => {
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

    browserAPI.contextMenus.update('add-to-favorites', {
      title: translations[lang].contextMenuFavorite
    });

    browserAPI.contextMenus.update('add-to-blocked', {
      title: translations[lang].contextMenuBlock
    });
  }
});

/**
 * Listen for keyboard shortcuts
 * Handle user's keyboard shortcut operations
 */
browserAPI.commands.onCommand.addListener((command) => {
  if (command === 'hide-current-result') {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        browserAPI.tabs.sendMessage(tabs[0].id, {
          action: 'hideCurrentResult'
        });
      }
    });
  }
});

browserAPI.runtime.onInstalled.addListener(async () => {
  const { language = 'en' } = await browserAPI.storage.local.get(['language']);


  menuAPI.create({
    id: 'sers-menu',
    title: translations[language]?.extName,
    contexts: ['link', 'page']
  });

  menuAPI.create({
    id: 'add-to-favorites',
    parentId: 'sers-menu',
    title: translations[language]?.contextMenuFavorite,
    contexts: ['link', 'page']
  });

  menuAPI.create({
    id: 'add-to-blocked',
    parentId: 'sers-menu',
    title: translations[language]?.contextMenuBlock,
    contexts: ['link', 'page']
  });
});

function updateContextMenus(language) {
  browserAPI.contextMenus.update('sers-menu', {
    title: translations[language]?.extName
  });

  browserAPI.contextMenus.update('add-to-favorites', {
    title: translations[language]?.contextMenuFavorite
  });

  browserAPI.contextMenus.update('add-to-blocked', {
    title: translations[language]?.contextMenuBlock
  });
}

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateContextMenus') {
    updateContextMenus(message.language);
  }
});

menuAPI.onClicked.addListener((info, tab) => {
  let domain;
  if (info.linkUrl) {
    let url = info.linkUrl;
    // handles redirected links to Google search results
    if (url.match(/^https?:\/\/(?:[\w-]+\.)*google\.[a-z.]+\/url\?/i)) {
      const urlParams = new URLSearchParams(new URL(url).search);
      url = urlParams.get('url') || url;
    }
    domain = new URL(url).hostname;
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
  browserAPI.storage.local.get(['sites', 'language'], (data) => {
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

      browserAPI.storage.local.set({ sites }, () => {
        const message = listType === 'favorites'
          ? translations[lang].addedToFavorites.replace('{domain}', domain)
          : translations[lang].siteBlocked.replace('{domain}', domain);

        browserAPI.tabs.sendMessage(tabId, {
          type: 'showToast',
          message: message
        });

        browserAPI.tabs.sendMessage(tabId, {
          type: 'updateResults'
        });
      });
    } else {
      existingSite.blocked = listType === 'blocked';
      browserAPI.storage.local.set({ sites }, () => {
        const message = listType === 'blocked'
          ? translations[lang].siteBlocked.replace('{domain}', domain)
          : translations[lang].addedToFavorites.replace('{domain}', domain);

        browserAPI.tabs.sendMessage(tabId, {
          type: 'showToast',
          message: message
        });

        browserAPI.tabs.sendMessage(tabId, {
          type: 'updateResults'
        });
      });
    }
  });
} 