/**
 * 后台服务工作者(Service Worker)
 * 用于处理扩展的后台任务和事件监听
 */

import { translations } from './i18n.js';

/**
 * 监听扩展安装或更新事件
 * 用于初始化扩展的默认配置和数据
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装时初始化存储数据
    chrome.storage.local.set({
      sites: [
        {
          url: '*.example.com',
          blocked: false,
          color: '#e6ffe6',
          top: false
        }
      ],
      // 屏蔽列表，存储要过滤的网站规则
      blocked: [
        '*.example.com',
        '*.spam-site.com'
      ],
      // 偏好列表，存储要高亮的网站规则
      favorites: [],
      // 统计数据
      stats: {
        filteredCount: 0,        // 已过滤数量
        highlightedCount: 0,     // 已高亮数量
        startTime: Date.now(),   // 安装时间
        estimatedTimeSaved: 0    // 预计节省时间
      },
      // 样式配置
      styles: {
        highlightColor: '#e6ffe6',
        highlightBorder: '#4CAF50'
      }
    });
  }
});

/**
 * 监听来自内容脚本的消息
 * 处理跨域通信和数据请求
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理统计数据更新
  if (message.type === 'updateStats') {
    chrome.storage.local.get(['stats'], (data) => {
      const stats = data.stats || {};
      stats[message.statType]++;
      
      // 更新存储
      chrome.storage.local.set({ stats }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // 保持消息通道开放
  }
  
  // 处理规则更新
  if (message.type === 'updateRules') {
    chrome.storage.local.get(['blocked', 'favorites'], (data) => {
      const { domain, action, operation } = message;
      const list = action === 'block' ? 'blocked' : 'favorites';
      const rules = data[list] || [];
      
      if (operation === 'add') {
        // 添加新规则
        if (!rules.includes(domain)) {
          rules.push(domain);
        }
      } else if (operation === 'remove') {
        // 移除规则
        const index = rules.indexOf(domain);
        if (index > -1) {
          rules.splice(index, 1);
        }
      }
      
      // 更新存储
      chrome.storage.local.set({ [list]: rules }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

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
  chrome.storage.local.get([listType, 'language'], (data) => {
    const list = data[listType] || [];
    const lang = data.language || 'en';
    
    if (!list.includes(domain)) {
      list.push(domain);
      chrome.storage.local.set({ [listType]: list }, () => {
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
    }
  });
} 