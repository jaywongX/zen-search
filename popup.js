import { updateLanguage, getCurrentLanguage, getMessage } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup initialized'); // 初始化日志

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
    console.log('Loading sites from storage...'); // 加载开始
    chrome.storage.local.get(['favorites', 'blocked'], (data) => {
      console.log('Storage data:', data); // 存储数据
      const sites = [];
      
      // 合并偏好和屏蔽的网站
      const favorites = data.favorites || [];
      const blocked = data.blocked || [];
      
      // 添加偏好网站
      favorites.forEach(url => {
        sites.push({
          url,
          rating: 'favorite',
          pinned: false
        });
      });
      console.log('Processed favorites:', sites); // 处理后的偏好站点
      
      // 添加屏蔽网站
      blocked.forEach(url => {
        sites.push({
          url,
          rating: 'blocked',
          pinned: false
        });
      });
      console.log('All processed sites:', sites); // 所有处理后的站点

      // 按置顶状态和URL排序
      sites.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return a.url.localeCompare(b.url);
      });

      renderSites(sites);
    });
  }

  // 渲染网站列表
  function renderSites(sites) {
    chrome.storage.local.get(['pinnedSites', 'highlightColors'], (data) => {
      const pinnedSites = data.pinnedSites || [];
      const highlightColors = data.highlightColors || {};
      
      const sortedSites = sites.sort((a, b) => {
        const aIsPinned = pinnedSites.includes(a.url);
        const bIsPinned = pinnedSites.includes(b.url);
        if (aIsPinned !== bIsPinned) return bIsPinned ? 1 : -1;
        return a.url.localeCompare(b.url);
      });

      siteList.innerHTML = sortedSites.map(site => {
        const isPinned = pinnedSites.includes(site.url);
        const color = highlightColors[site.url] || '#e6ffe6';
        
        return `
          <div class="site-item ${isPinned ? 'pinned' : ''}" data-url="${site.url}">
            <input type="text" class="site-url-input" value="${site.url}">
            <div class="site-actions">
              <span class="rating-indicator">
                ${site.rating === 'favorite' ? '❤️' : '🚫'}
              </span>
              ${site.rating === 'favorite' ? `
                <div class="color-picker-container">
                  <input type="color" class="color-picker" value="${color}" title="Highlight Color">
                </div>
              ` : ''}
              <button class="action-btn pin-btn" title="Pin">
                ${isPinned ? '📌' : '📍'}
              </button>
              <button class="action-btn delete-btn" title="Delete">-</button>
            </div>
          </div>
        `;
      }).join('');
    });

    siteList.addEventListener('click', (e) => {
      if (e.target.closest('.pin-btn')) {
          const siteItem = e.target.closest('.site-item');
          const url = siteItem.dataset.url;
          console.log('Pin button clicked:', url);
          toggleSitePin(url);
      } else if (e.target.closest('.delete-btn')) {
          const siteItem = e.target.closest('.site-item');
          const url = siteItem.dataset.url;
          console.log('Delete button clicked:', url);
          deleteSite(url);
      } else if (e.target.closest('.rating-indicator')) {
        const siteItem = e.target.closest('.site-item');
        const url = siteItem.dataset.url;
        const currentRating = e.target.textContent.includes('❤️') ? 'favorite' : 'blocked';
        const newRating = currentRating === 'favorite' ? 'blocked' : 'favorite';
        console.log('Rating clicked:', { url, currentRating, newRating });
        updateSiteRating(url, newRating);
      }
    });

    // 添加URL编辑事件监听（使用事件委托）
    siteList.addEventListener('blur', (e) => {
      if (e.target.closest('.site-item') && e.target.classList.contains('site-url-input')) {
        const oldUrl = e.target.closest('.site-item').dataset.url;
        const newUrl = e.target.value.trim();
        console.log('URL editing:', { oldUrl, newUrl });

        if (oldUrl === newUrl) return;

        if (!validateInput(newUrl)) {
          console.warn('Invalid URL:', newUrl);
          e.target.value = oldUrl; // 恢复原值
          showToast('invalidUrl');
          return;
        }

        updateSiteUrl(oldUrl, newUrl);
      }
    });

  }

  // 处理网站操作
  function handleSiteAction(action, url) {
    switch (action) {
      case 'pin':
        toggleSitePin(url);
        break;
      case 'delete':
        deleteSite(url);
        break;
    }
  }

  // 切换网站置顶状态
  function toggleSitePin(url) {
    console.log('Toggling pin for:', url); // 添加日志
    chrome.storage.local.get(['pinnedSites'], (data) => {
      const pinnedSites = data.pinnedSites || [];
      const isPinned = pinnedSites.includes(url);
      
      console.log('Current pinned sites:', pinnedSites); // 添加日志
      
      let newPinnedSites;
      if (isPinned) {
        newPinnedSites = pinnedSites.filter(site => site !== url);
      } else {
        newPinnedSites = [...pinnedSites, url];
      }
      
      console.log('New pinned sites:', newPinnedSites); // 添加日志
      
      chrome.storage.local.set({ pinnedSites: newPinnedSites }, () => {
        console.log('Storage updated, reloading sites...'); // 添加日志
        loadSites();
      });
    });
  }

  // 删除网站
  function deleteSite(url) {
    chrome.storage.local.get(['favorites', 'blocked', 'pinnedSites'], (data) => {
      const favorites = (data.favorites || []).filter(site => site !== url);
      const blocked = (data.blocked || []).filter(site => site !== url);
      const pinnedSites = (data.pinnedSites || []).filter(site => site !== url);
      
      chrome.storage.local.set({ favorites, blocked, pinnedSites }, loadSites);
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
        console.log('Validated regex:', regexStr);
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
      console.error('Validation error:', e);
      return false;
    }
  }

  // 添加新网站
  function addSite() {
    const url = urlInput.value.trim();
    const rating = ratingSelect.value;
    console.log('Adding new site:', { url, rating });

    if (!validateInput(url)) {
      console.warn('Invalid URL or regex:', url);
      
      // 添加错误样式
      urlInput.classList.add('invalid');
      
      // 创建或更新错误消息
      let errorMsg = document.querySelector('.error-message');
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        urlInput.parentNode.insertBefore(errorMsg, urlInput.nextSibling);
      }
      errorMsg.textContent = '请输入有效的URL或正则表达式';
      
      // 3秒后移除错误提示
      setTimeout(() => {
        urlInput.classList.remove('invalid');
        errorMsg.remove();
      }, 3000);
      showToast('invalidUrl');
      return;
    }

    chrome.storage.local.get(['favorites', 'blocked', 'highlightColors'], (data) => {
      let favorites = data.favorites || [];
      let blocked = data.blocked || [];
      let highlightColors = data.highlightColors || {};
      
      console.log('Current storage state:', { favorites, blocked, highlightColors });
        
      // 检查是否已存在（包括正则匹配）
      const isInFavorites = favorites.some(site => {
        try {
          return new RegExp(site).test(url) || new RegExp(url).test(site);
        } catch (e) {
          console.error('Regex match error:', e); // 正则匹配错误
          return site === url;
        }
      });
      
      const isInBlocked = blocked.some(site => {
        try {
          return new RegExp(site).test(url) || new RegExp(url).test(site);
        } catch (e) {
          console.error('Regex match error:', e); // 正则匹配错误
          return site === url;
        }
      });

      if (rating === 'favorite' && isInFavorites) {
        showToast('siteAdded', { url });
        return;
      }
      
      if (rating === 'blocked' && isInBlocked) {
        showToast('siteAdded', { url });
        return;
      }
      
      // 从另一个列表中移除（如果存在）
      if (rating === 'favorite') {
        blocked = blocked.filter(site => !new RegExp(url).test(site));
        favorites.push(url);
        // 为新添加的收藏网站设置高亮颜色
        highlightColors[url] = defaultColor;
      } else {
        favorites = favorites.filter(site => !new RegExp(url).test(site));
        blocked.push(url);
        // 如果从收藏移到屏蔽，删除对应的高亮颜色
        delete highlightColors[url];
      }
      
      // 保存更新
      chrome.storage.local.set({ 
        favorites: favorites,
        blocked: blocked,
        highlightColors: highlightColors
      }, () => {
        loadSites();
        urlInput.value = '';
        showToast('siteAdded', { url });
        console.log('Updated storage state:', { favorites, blocked, highlightColors });
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

    // 尝试同时在内容页面显示提示
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'showToast',
          message: message
        }).catch(() => {
          // 如果发送失败，忽略错误（因为已经在popup中显示了提示）
          console.log('Could not send message to content script, toast shown in popup only');
        });
      }
    });
  }

  // 绑定添加按钮事件
  addSiteBtn.addEventListener('click', addSite);

  // 绑定回车键添加
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSite();
    }
  });

  // URL输入框验证
  urlInput.addEventListener('input', () => {
    const isValid = validateInput(urlInput.value.trim());
    urlInput.classList.toggle('invalid', !isValid);
  });

  // 排序网站列表
  function sortSites(sites, sortBy) {
    switch (sortBy) {
      case 'rating':
        return sites.sort((a, b) => {
          // 首先按好感度排序（偏好 > 中立 > 屏蔽）
          const ratingOrder = { favorite: 2, neutral: 1, blocked: 0 };
          const ratingDiff = ratingOrder[b.rating] - ratingOrder[a.rating];
          // 如果好感度相同，则按URL排序
          return ratingDiff !== 0 ? ratingDiff : a.url.localeCompare(b.url);
        });
      case 'url':
        return sites.sort((a, b) => a.url.localeCompare(b.url));
      default:
        return sites;
    }
  }

  // 更新网站好感度
  function updateSiteRating(url, newRating) {
    chrome.storage.local.get(['favorites', 'blocked'], (data) => {
      // 从所有列表中移除
      const favorites = (data.favorites || []).filter(site => site !== url);
      const blocked = (data.blocked || []).filter(site => site !== url);

      // 添加到新的列表
      if (newRating === 'favorite') {
        favorites.push(url);
      } else if (newRating === 'blocked') {
        blocked.push(url);
      }

      // 保存更新
      chrome.storage.local.set({ favorites, blocked }, () => {
        loadSites();
        showToast('ratingUpdated', { url });
      });
    });
  }

  // 绑定排序事件
  sortSelect.addEventListener('change', () => {
    loadSites();
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
    console.log('Updating URL:', { oldUrl, newUrl });
    chrome.storage.local.get(['favorites', 'blocked'], (data) => {
      let favorites = data.favorites || [];
      let blocked = data.blocked || [];

      // 更新URL
      if (favorites.includes(oldUrl)) {
        favorites = favorites.map(url => url === oldUrl ? newUrl : url);
      }
      if (blocked.includes(oldUrl)) {
        blocked = blocked.map(url => url === oldUrl ? newUrl : url);
      }

      // 保存更新
      chrome.storage.local.set({ favorites, blocked }, () => {
        loadSites();
        showToast('urlUpdated', { oldUrl, newUrl });
      });
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

  function saveHighlightColor(color) {
    chrome.storage.local.set({ highlightColor: color }, () => {
      // 尝试通知内容脚本更新颜色
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateHighlightColor',
            color: color
          }).catch(() => {
            console.log('Could not send color update to content script');
          });
        }
      });
    });
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

  // 修改网站列表中的颜色选择器事件处理
  siteList.addEventListener('change', (e) => {
    const colorPicker = e.target.closest('.color-picker');
    if (colorPicker) {
      const siteItem = colorPicker.closest('.site-item');
      const url = siteItem.dataset.url;
      const color = colorPicker.value;
      
      // 保存特定网站的颜色
      chrome.storage.local.get(['highlightColors'], (data) => {
        const highlightColors = data.highlightColors || {};
        highlightColors[url] = color;
        
        chrome.storage.local.set({ highlightColors }, () => {
          // 尝试通知内容脚本更新颜色
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'updateHighlightColor',
                url: url,
                color: color
              }).catch(() => {
                console.log('Could not send color update to content script');
              });
            }
          });
        });
      });
    }
  });

  // 初始加载
  loadSites();
  initializeI18n();
}); 