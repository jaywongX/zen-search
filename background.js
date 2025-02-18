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
chrome.runtime.onInstalled.addListener(() => {
  // 创建父菜单
  chrome.contextMenus.create({
    id: 'sers-menu',
    title: 'Search Engine Results Selector',
    contexts: ['link']
  });

  // 添加子菜单
  chrome.contextMenus.create({
    id: 'add-to-favorites',
    parentId: 'sers-menu',
    title: '标记为偏好网站',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'add-to-blocked',
    parentId: 'sers-menu',
    title: '屏蔽此网站',
    contexts: ['link']
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl;
  const domain = new URL(url).hostname;

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

    // 检查网站是否已存在
    const existingSite = sites.find(site => site.url === domain);

    if (!existingSite) {
      // 添加新网站
      sites.push({
        url: domain,
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