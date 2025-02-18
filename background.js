/**
 * 后台服务工作者(Service Worker)
 * 用于处理扩展的后台任务和事件监听
 */

import { translations } from './i18n.js';

/**
 * 监听来自内容脚本的消息
 * 处理跨域通信和数据请求
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // 更新右键菜单文本
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
 * 监听快捷键命令
 * 处理用户的键盘快捷操作
 */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'hide-current-result') {
    // 获取当前活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // 向内容脚本发送隐藏当前结果的命令
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'hideCurrentResult'
        });
      }
    });
  }
});

// 创建右键菜单
chrome.runtime.onInstalled.addListener(async () => {
  // 获取当前语言
  const { language = 'en' } = await chrome.storage.local.get(['language']);

  // 创建父菜单（同时支持链接和页面）
  chrome.contextMenus.create({
    id: 'sers-menu',
    title: translations[language]?.extName,
    contexts: ['link', 'page'] // 添加 page 上下文
  });

  // 添加子菜单
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

// 更新右键菜单语言
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

// 监听语言变更消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateContextMenus') {
    updateContextMenus(message.language);
  }
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // 根据上下文获取域名
  let domain;
  if (info.linkUrl) {
    // 如果点击的是链接
    domain = new URL(info.linkUrl).hostname;
  } else {
    // 如果点击的是页面
    domain = new URL(tab.url).hostname;
  }

  if (info.menuItemId === 'add-to-favorites') {
    addToList(domain, 'favorites', tab.id);
  } else if (info.menuItemId === 'add-to-blocked') {
    addToList(domain, 'blocked', tab.id);
  }
});

// 添加到列表
function addToList(domain, listType, tabId) {
  chrome.storage.local.get(['sites', 'language'], (data) => {
    const sites = data.sites || [];
    const lang = data.language || 'en';

    // 转换域名为通配符格式，只取主域名
    const parts = domain.split('.');
    const mainDomain = parts.length > 2
      ? parts.slice(-2).join('.') // 例如 apps.apple.com -> apple.com
      : domain;                   // 例如 example.com -> example.com

    const wildcardDomain = `*://*.${mainDomain}/*`;

    // 检查网站是否已存在
    const existingSite = sites.find(site => site.url === wildcardDomain);

    if (!existingSite) {
      // 添加新网站
      sites.push({
        url: wildcardDomain,
        blocked: listType === 'blocked',
        color: '#e6ffe6',
        top: false
      });

      // 更新存储
      chrome.storage.local.set({ sites }, () => {
        // 显示本地化的提示消息
        const message = listType === 'favorites'
          ? translations[lang].addedToFavorites.replace('{domain}', domain)
          : translations[lang].siteBlocked.replace('{domain}', domain);

        chrome.tabs.sendMessage(tabId, {
          type: 'showToast',
          message: message
        });

        // 更新搜索结果
        chrome.tabs.sendMessage(tabId, {
          type: 'updateResults'
        });
      });
    } else {
      // 如果网站已存在，更新其状态
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