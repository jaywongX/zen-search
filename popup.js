import { updateLanguage, getCurrentLanguage, getMessage, translations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {

  const siteList = document.getElementById('siteList');
  const searchInput = document.getElementById('searchInput');
  const settingsBtn = document.getElementById('settingsBtn');
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
      renderSites(sites).catch(console.error);
    });
  }

  // 渲染网站列表
  async function renderSites(sites = []) {
    // 获取当前语言
    const currentLang = await getCurrentLanguage();

    // 使用当前选择的排序方式
    const currentSortBy = sortSelect.value;
    const sortedSites = sortSites(sites, currentSortBy);

    siteList.innerHTML = sortedSites.map(site => `
      <div class="site-item" data-url="${site.url}">
        <input type="text" class="site-url-input" value="${site.url}">
        <div class="site-actions">
          <button class="block-btn ${site.blocked ? 'blocked' : ''}" title="${site.blocked ? translations[currentLang].unblocked : translations[currentLang].blocked}">
            ${site.blocked ? '🚫' : '👁️'}
          </button>
          <div class="color-picker-container">
            <input type="color" class="color-picker" value="${site.color}" title="${translations[currentLang].highlightColor}"
              ${site.blocked ? 'disabled' : ''}>
          </div>
          <button class="pin-btn ${site.top ? 'pinned' : ''}" title="${site.top ? translations[currentLang].untop : translations[currentLang].top}">
            ${site.top ? '📌' : '📍'}
          </button>
          <button class="delete-btn" title="${translations[currentLang].delete}">-</button>
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
  function validateInput(input, isEdit = false) {
    if (!input) return false;

    try {
      // 检查是否是标准通配符格式
      if (input.match(/^\*:\/\/([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\/\*$/)) {
        return true;
      }

      // 如果不是标准格式，尝试转换
      if (input.match(/^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/)) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  // 添加新网站
  function addSite(url, blocked = false, color = '#e6ffe6') {
    // 转换为标准通配符格式
    const domain = url.replace(/^\*:\/\//, '').replace(/\/\*$/, '');
    const parts = domain.split('.');
    const mainDomain = parts.length > 2
      ? parts.slice(-2).join('.') // 例如 apps.apple.com -> apple.com
      : domain;                   // 例如 example.com -> example.com

    const standardUrl = `*://*.${mainDomain}/*`;

    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      if (sites.some(site => site.url === standardUrl)) {
        showToast('invalidUrl');
        return;
      }

      sites.push({
        url: standardUrl,
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
  async function showToast(messageKey, params = {}) {
    const currentLang = await getCurrentLanguage();
    const message = translations[currentLang][messageKey].replace(
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

  // 排序选择器事件监听
  sortSelect.addEventListener('change', (e) => {
    chrome.storage.local.get(['sites'], ({ sites = [] }) => {
      const sortedSites = sortSites(sites, e.target.value);
      renderSites(sortedSites);
    });
  });

  // 排序网站列表
  function sortSites(sites, sortBy) {
    return [...sites].sort((a, b) => {
      // 首先按置顶状态排序
      if (a.top !== b.top) {
        return b.top ? 1 : -1;
      }

      switch (sortBy) {
        case 'url':
          // 按 URL 字母顺序排序
          return a.url.localeCompare(b.url);

        case 'blocked':
          // 先按屏蔽状态排序，相同状态下按URL排序
          if (a.blocked !== b.blocked) {
            return b.blocked ? -1 : 1;
          }
          return a.url.localeCompare(b.url);

        case 'color':
          // 先按是否有颜色排序，然后按颜色值排序，最后按URL排序
          if (a.color !== b.color) {
            if (!a.color) return 1;
            if (!b.color) return -1;
            return a.color.localeCompare(b.color);
          }
          return a.url.localeCompare(b.url);

        default:
          return a.url.localeCompare(b.url);
      }
    });
  }

  // 切换设置菜单显示
  settingsBtn.addEventListener('click', () => {
    window.location.href = 'settings.html';
  });

  // 添加更新URL的函数
  function updateSiteUrl(oldUrl, newUrl) {
    // 验证新URL（使用isEdit=true）
    if (!validateInput(newUrl, true)) {
      showToast('invalidUrl');
      return;
    }

    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === oldUrl);

      if (siteIndex !== -1) {
        // 转换为标准通配符格式，但保留子域名
        const standardUrl = newUrl.match(/^\*:\/\//)
          ? newUrl
          : `*://${newUrl.replace(/^www\./, '')}/*`;

        sites[siteIndex].url = standardUrl;
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
  async function initializeI18n() {
    const langSelect = document.getElementById('langSelect');
    const currentLang = await getCurrentLanguage();

    // 设置当前语言
    langSelect.value = currentLang;
    await updateLanguage(currentLang);

    // 语言切换事件
    langSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      await updateLanguage(newLang);
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