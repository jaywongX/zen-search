/**
 * Background Service Worker
 * Handles extension's background tasks and event listeners
 */

const translations = {
  en: {
    extName: "ZenSearch - Search in Peace",
    searchPlaceholder: "Search sites...",
    sortByRating: "Sort by rating",
    sortByUrl: "Sort by URL",
    sortByBlocked: "Sort by Blocked",
    sortByColor: "Sort by Color",
    addSite: "Add",
    favorite: "Favorite",
    blocked: "Blocked",
    unblocked: "Unblocked",
    clearData: "Clear All Data",
    settings: "Settings",
    urlPlaceholder: "Enter domain, support regex",
    urlHint: "Examples: *://*.example.com/*",
    settingsTitle: "Settings",
    highlightColor: "Highlight Color",
    previewText: "This is how highlighted results will look",
    contextMenuFavorite: "Add to Favorites",
    contextMenuBlock: "Block this Site",
    addedToFavorites: "Added {domain} to favorites",
    siteBlocked: "Blocked {domain}",
    clearDataConfirm: "Are you sure you want to clear all data? This cannot be undone.",
    dataCleared: "All data has been cleared",
    urlUpdated: "Updated {oldUrl} to {newUrl}",
    ratingUpdated: "Updated rating for {url}",
    invalidUrl: "Please enter a valid URL or regex pattern",
    siteAdded: "Added {url}",
    top: "Top",
    untop: "Untop",
    delete: "Delete",
    back: "Back",
    reportIssue: "Report an Issue",
    proposeFeature: "Propose a New Feature",
    confirmHide: "Hide search results from {domain}?",
    confirm: "Confirm",
    cancel: "Cancel",
    donateDescription: "Buy me a coffee",
    donateTitle: "Support ZenSearch",
    kofiHint: "Buy me a coffee by ko-fi",
    afdianHint: "Buy me a coffee by afdian"
  },
  zh_CN: {
    extName: "ZenSearch - Search in Peace",
    searchPlaceholder: "搜索网站...",
    sortByRating: "按好感度排序",
    sortByUrl: "按网址排序",
    sortByBlocked: "按屏蔽排序",
    sortByColor: "按颜色排序",
    addSite: "添加",
    favorite: "偏好",
    blocked: "屏蔽",
    unblocked: "未屏蔽",
    clearData: "清除所有数据",
    settings: "设置",
    urlPlaceholder: "输入域名，支持正则表达式",
    urlHint: "示例: *://*.example.com/*",
    settingsTitle: "设置",
    highlightColor: "高亮颜色",
    previewText: "高亮结果将会是这个样子",
    contextMenuFavorite: "标记为偏好网站",
    contextMenuBlock: "屏蔽此网站",
    addedToFavorites: "已添加 {domain} 到偏好网站",
    siteBlocked: "已屏蔽 {domain}",
    clearDataConfirm: "确定要清除所有数据吗？此操作不可恢复。",
    dataCleared: "所有数据已清除",
    urlUpdated: "已更新 {oldUrl} 为 {newUrl}",
    ratingUpdated: "已更新 {url} 的好感度",
    invalidUrl: "请输入有效的URL或正则表达式",
    siteAdded: "已添加 {url}",
    top: "置顶",
    untop: "取消置顶",
    delete: "删除",
    back: "返回",
    reportIssue: "报告问题",
    proposeFeature: "提出新功能",
    confirmHide: "是否隐藏来自 {domain} 的搜索结果？",
    confirm: "确认",
    cancel: "取消",
    donateDescription: "请我喝杯咖啡",
    donateTitle: "支持 ZenSearch",
    kofiHint: "通过Ko-fi请我喝杯咖啡",
    afdianHint: "通过爱发电请我喝杯咖啡"
  }
};

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
    browserAPI.contextMenus.update('add-to-favorites', {
      title: message.contextMenuFavoriteTitle
    });
    browserAPI.contextMenus.update('add-to-blocked', {
      title: message.contextMenuBlockTitle
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