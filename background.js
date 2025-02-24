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

/**
 * Handles URL redirects from Google and Bing search results
 * @param {string} url - The URL to handle
 * @returns {string} The original or redirected URL
 */
function handleRedirect(url) {  
  // handles redirected links to Google search results
  if (url.match(/^https?:\/\/(?:[\w-]+\.)*google\.[a-z.]+\/url\?/i)) {
    const urlParams = new URLSearchParams(new URL(url).search);
    url = urlParams.get('url') || url;
  }
  // handles redirected links to Bing search results
  else if (url.match(/^https?:\/\/(?:[\w-]+\.)*bing\.[a-z.]+\/ck\/a\?/i)) {
    const urlParams = new URLSearchParams(new URL(url).search);
    const encodedUrl = urlParams.get('u');
    if (encodedUrl) {
      try { 
        url = atob(encodedUrl.slice(2)) || url;
      } catch (e) {
        console.error('Error decoding Bing URL:', e);
      }
    }
  }
  // handles redirected links to Yahoo search results
  else if (url.match(/^https?:\/\/r\.search\.yahoo\.com\/.+\/RU=/i)) {
    try {
      const matches = url.match(/\/RU=([^/]+)\/RK=/);
      if (matches && matches[1]) {
        url = decodeURIComponent(matches[1]);
      }
    } catch (e) {
      console.error('Error parsing Yahoo redirect URL:', e);
    }
  }
  // handles redirected links to AOL search results
  else if (url.match(/^https?:\/\/(?:[\w-]+\.)*search\.aol\.com\/click\/.+\/RU=/i)) {
    try {
      const matches = url.match(/\/RU=([^/]+)\/RK=/);
      if (matches && matches[1]) {
        url = decodeURIComponent(matches[1]);
      }
    } catch (e) {
      console.error('Error parsing AOL redirect URL:', e);
    }
  }
  return url;
}

menuAPI.onClicked.addListener((info, tab) => {
  let domain;
  if (info.linkUrl) {
    let url = info.linkUrl;
    url = handleRedirect(url);
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

      const storagePromise = typeof browser !== 'undefined' 
        ? browserAPI.storage.local.set({ sites })
        : new Promise((resolve) => browserAPI.storage.local.set({ sites }, resolve));

      storagePromise.then(() => {
        const message = listType === 'favorites'
          ? translations[lang].addedToFavorites.replace('{domain}', domain)
          : translations[lang].siteBlocked.replace('{domain}', domain);

        Promise.all([
          browserAPI.tabs.sendMessage(tabId, {
            type: 'showToast',
            message: message
          }),
          browserAPI.tabs.sendMessage(tabId, {
            type: 'updateResults'
          })
        ]).catch(console.error);
      });
    } else {
      existingSite.blocked = listType === 'blocked';
      const storagePromise = typeof browser !== 'undefined' 
        ? browserAPI.storage.local.set({ sites })
        : new Promise((resolve) => browserAPI.storage.local.set({ sites }, resolve));

      storagePromise.then(() => {
        const message = listType === 'blocked'
          ? translations[lang].siteBlocked.replace('{domain}', domain)
          : translations[lang].addedToFavorites.replace('{domain}', domain);

        Promise.all([
          browserAPI.tabs.sendMessage(tabId, {
            type: 'showToast',
            message: message
          }),
          browserAPI.tabs.sendMessage(tabId, {
            type: 'updateResults'
          })
        ]).catch(console.error);
      });
    }
  });
} 