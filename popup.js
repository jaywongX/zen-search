import { updateLanguage, getCurrentLanguage, getMessage, translations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {

  const siteList = document.getElementById('siteList');
  const searchInput = document.getElementById('searchInput');
  const settingsBtn = document.getElementById('settingsBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const urlInput = document.getElementById('urlInput');
  const ratingSelect = document.getElementById('ratingSelect');
  const addSiteBtn = document.getElementById('addSiteBtn');
  const sortSelect = document.getElementById('sortSelect');
  const defaultColor = '#e6ffe6';
  const defaultLang = 'en'

  // 加载网站列表
  function loadSites() {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      
      renderSites(sites);
    });
  }

  // 渲染网站列表
  function renderSites(sites = []) {
    // 按置顶和URL排序
    const sortedSites = sites.sort((a, b) => {
      if (a.top !== b.top) return b.top ? 1 : -1;
      return a.url.localeCompare(b.url);
    });

    siteList.innerHTML = sortedSites.map(site => `
      <div class="site-item" data-url="${site.url}">
        <input type="text" class="site-url-input" value="${site.url}">
        <div class="site-actions">
          <button class="block-btn ${site.blocked ? 'blocked' : ''}" title="${site.blocked ? translations[getCurrentLanguage()].unblocked : translations[getCurrentLanguage()].blocked}">
            ${site.blocked ? '🚫' : '👁️'}
          </button>
          <div class="color-picker-container">
            <input type="color" class="color-picker" value="${site.color}" title="${translations[getCurrentLanguage()].highlightColor}"
              ${site.blocked ? 'disabled' : ''}>
          </div>
          <button class="pin-btn ${site.top ? 'pinned' : ''}" title="${site.top ? translations[getCurrentLanguage()].untop : translations[getCurrentLanguage()].top}">
            ${site.top ? '📌' : '📍'}
          </button>
          <button class="delete-btn" title="${translations[getCurrentLanguage()].delete}">-</button>
        </div>
      </div>
    `).join('');

    siteList.addEventListener('click', (e) => {
      const siteItem = e.target.closest('.site-item');
      if (!siteItem) return;
      
      const url = siteItem.dataset.url;
      
      if (e.target.matches('.block-btn')) {
        const isBlocked = e.target.classList.contains('blocked');
        updateSite(url, { blocked: !isBlocked });
      } else if (e.target.matches('.pin-btn')) {
        const isPinned = e.target.classList.contains('pinned');
        updateSite(url, { top: !isPinned });
      } else if (e.target.matches('.delete-btn')) {
        deleteSite(url);
      }
    });

    // 添加URL编辑事件监听（使用事件委托）
    siteList.addEventListener('blur', (e) => {
      if (e.target.classList.contains('site-url-input')) {
        const oldUrl = e.target.closest('.site-item').dataset.url;
        const newUrl = e.target.value.trim();

        if (oldUrl === newUrl) return;

        if (!validateInput(newUrl)) {
          e.target.value = oldUrl; // 恢复原值
          showToast('invalidUrl');
          return;
        }

        updateSiteUrl(oldUrl, newUrl);
      }
    }, true);
  }

  // 删除网站
  function deleteSite(url) {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const newSites = sites.filter(site => site.url !== url);
      chrome.storage.local.set({ sites: newSites }, () => {
        loadSites();
        showToast('siteDeleted', { url });
        
        // 只更新当前活动标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'updateResults'
            });
          }
        });
      });
    });
  }

  // 搜索功能
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const siteItems = siteList.querySelectorAll('.site-item');
    
    siteItems.forEach(item => {
      const url = item.dataset.url.toLowerCase();
      item.style.display = url.includes(searchTerm) ? 'flex' : 'none';
    });
  });

  // 验证URL或正则表达式
  function validateInput(input) {
    if (!input) return false;
    
    try {
      // 处理正则表达式字符串
      if (input.includes('*')) {
        // 将 * 转换为正则表达式
        const regexStr = input.replace(/\*/g, '.*')
                             .replace(/\./g, '\\.');
        new RegExp(regexStr);
        return true;
      }
      
      // 尝试作为URL验证
      try {
        new URL(input.startsWith('http') ? input : `http://${input}`);
        return true;
      } catch {
        // 如果不是有效URL，尝试作为域名验证
        return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(input);
      }
    } catch (e) {
      return false;
    }
  }

  // 添加新网站
  function addSite(url, blocked = false, color = '#e6ffe6') {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      if (sites.some(site => site.url === url)) {
        showToast('invalidUrl');
        return;
      }

      sites.push({
        url,
        blocked,
        color,
        top: false
      });

      chrome.storage.local.set({ sites }, () => {
        loadSites();
        showToast('siteAdded', { url });
          // 通知内容脚本更新显示
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'updateResults'
            });
          }
        });
      });
    });
  }

  // 显示Toast消息
  function showToast(messageKey, params = {}) {
    const message = getMessage(messageKey).replace(
      /\{(\w+)\}/g, 
      (match, key) => params[key] || match
    );
    
    // 直接在 popup 中显示提示
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // 绑定添加按钮事件
  addSiteBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const blocked = ratingSelect.value === 'blocked';
    const color = colorSelect.value;
    if (validateInput(url)) {
      addSite(url, blocked, color);
    }

  });

  // 绑定回车键添加
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const url = urlInput.value.trim();
      const blocked = ratingSelect.value === 'blocked';
      const color = colorSelect.value;
      if (validateInput(url)) {
        addSite(url, blocked, color);
      }
    }

  });

  // URL输入框验证
  urlInput.addEventListener('input', () => {
    const isValid = validateInput(urlInput.value.trim());
    urlInput.classList.toggle('invalid', !isValid);
  });

  // 排序网站列表
  function sortSites(sites, sortBy) {
    return [...sites].sort((a, b) => {
      switch (sortBy) {
        case 'blocked':
          // 屏蔽的排在前面
          return (b.blocked ? 1 : 0) - (a.blocked ? 1 : 0);
        
        case 'color':
          // 有颜色的排在前面，相同情况下按颜色值排序
          if (a.color && !b.color) return -1;
          if (!a.color && b.color) return 1;
          return (a.color || '').localeCompare(b.color || '');
        
        case 'url':
          // 按 URL 字母顺序排序
          return a.url.localeCompare(b.url);
        
        default:
          return 0;
      }
    });
  }

  // 更新排序按钮状态
  function updateSortButtons(activeSortBy) {
    document.querySelectorAll('.sort-button').forEach(button => {
      button.classList.toggle('active', button.dataset.sort === activeSortBy);
    });
  }

  // 添加排序按钮点击事件
  document.querySelectorAll('.sort-button').forEach(button => {
    button.addEventListener('click', () => {
      const sortBy = button.dataset.sort;
      updateSortButtons(sortBy);
      // 获取并排序网站列表
      chrome.storage.local.get(['sites'], ({ sites = [] }) => {
        const sortedSites = sortSites(sites, sortBy);
        renderSites(sortedSites);
      });
    });
  });

  // 清除所有数据
  clearDataBtn.addEventListener('click', () => {
    if (confirm(getMessage('clearDataConfirm'))) {
      chrome.storage.local.clear(() => {
        showToast('dataCleared');
        loadSites();
      });
    }
  });

  // 添加更新URL的函数
  function updateSiteUrl(oldUrl, newUrl) {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === oldUrl);
      
      if (siteIndex !== -1) {
        sites[siteIndex].url = newUrl;
        chrome.storage.local.set({ sites }, () => {
          loadSites();
          showToast('urlUpdated', { oldUrl, newUrl });
          // 通知内容脚本更新显示
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'updateResults'
              });
            }
          });
        });
      }
    });
  }

  // 语言切换功能
  function initializeI18n() {
    const langSelect = document.getElementById('langSelect');
    const currentLang = getCurrentLanguage();
    
    // 设置当前语言
    langSelect.value = currentLang;
    updateLanguage(currentLang);

    // 语言切换事件
    langSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      updateLanguage(newLang);
    });
  }

  function updateColorPreview(color) {
    const preview = document.querySelector('.color-preview');
    preview.style.backgroundColor = color;
    
    // 计算文字颜色（深色背景用白字，浅色背景用黑字）
    const rgb = hexToRgb(color);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    preview.style.color = brightness > 128 ? '#000' : '#fff';
  }

  // 辅助函数：将十六进制颜色转换为RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // 颜色选择器事件
  siteList.addEventListener('change', (e) => {
    if (e.target.matches('.color-picker')) {
      const siteItem = e.target.closest('.site-item');
      const url = siteItem.dataset.url;
      updateSite(url, { color: e.target.value });
    }
  });

  // 更新站点属性
  function updateSite(url, updates) {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === url);
      
      if (siteIndex !== -1) {
        sites[siteIndex] = { ...sites[siteIndex], ...updates };
        chrome.storage.local.set({ sites }, () => {
          loadSites();
          // 通知内容脚本更新显示
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'updateResults'
              });
            }
          });
        });
      }
    });
  }

  // 初始加载
  loadSites();
  initializeI18n();
}); 