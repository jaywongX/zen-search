/**
 * 后台服务工作者(Service Worker)
 * 用于处理扩展的后台任务和事件监听
 */

/**
 * 监听扩展安装或更新事件
 * 用于初始化扩展的默认配置和数据
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装时初始化存储数据
    chrome.storage.local.set({
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
});

/**
 * 监听标签页更新事件
 * 用于在页面加载完成后执行必要的操作
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // 检查是否是搜索引擎页面
    const url = tab.url;
    const isSearchPage = url && (
      url.includes('google.com/search') ||
      url.includes('bing.com/search') ||
      url.includes('baidu.com/s')
    );
    
    if (isSearchPage) {
      // 向内容脚本发送刷新消息
      chrome.tabs.sendMessage(tabId, {
        type: 'refreshFilters'
      });
    }
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

/**
 * 监听卸载事件
 * 清理扩展数据和设置
 */
chrome.runtime.onSuspend.addListener(() => {
  // 执行必要的清理工作
  console.log('Extension is being unloaded');
});

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'mark-favorite',
    title: '标记为偏好网站 ❤️',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'mark-blocked',
    title: '屏蔽此网站 🚫',
    contexts: ['link']
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = new URL(info.linkUrl);
  const domain = url.hostname;

  chrome.storage.local.get(['favorites', 'blocked'], (data) => {
    const favorites = data.favorites || [];
    const blocked = data.blocked || [];
    
    // 从所有列表中移除
    const newFavorites = favorites.filter(site => site !== domain);
    const newBlocked = blocked.filter(site => site !== domain);

    // 添加到新列表
    if (info.menuItemId === 'mark-favorite') {
      newFavorites.push(domain);
      chrome.tabs.sendMessage(tab.id, {
        action: 'showToast',
        message: `已将 ${domain} 添加到偏好网站`
      });
    } else if (info.menuItemId === 'mark-blocked') {
      newBlocked.push(domain);
      chrome.tabs.sendMessage(tab.id, {
        action: 'showToast',
        message: `已屏蔽 ${domain}`
      });
    }

    // 保存更新
    chrome.storage.local.set({ 
      favorites: newFavorites, 
      blocked: newBlocked 
    }, () => {
      // 通知内容脚本刷新结果
      chrome.tabs.sendMessage(tab.id, { action: 'refreshResults' });
    });
  });
}); 