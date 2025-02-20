import { updateLanguage, getCurrentLanguage, getMessage, translations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {

  const siteList = document.getElementById('siteList');
  const searchInput = document.getElementById('searchInput');
  const settingsBtn = document.getElementById('settingsBtn');
  const urlInput = document.getElementById('urlInput');
  const ratingSelect = document.getElementById('ratingSelect');
  const addSiteBtn = document.getElementById('addSiteBtn');
  const sortSelect = document.getElementById('sortSelect');

  function loadSites() {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      renderSites(sites).catch(console.error);
    });
  }

  // Render website list
  async function renderSites(sites = []) {
    // Get current language
    const currentLang = await getCurrentLanguage();

    // Use the current selected sorting method
    const currentSortBy = sortSelect.value;
    const sortedSites = sortSites(sites, currentSortBy);

    siteList.innerHTML = sortedSites.map(site => `
      <div class="zen-site-item" data-url="${site.url}">
        <input type="text" class="zen-site-url-input" value="${site.url}">
        <div class="zen-site-actions">
          <button class="zen-block-btn ${site.blocked ? 'blocked' : ''}" title="${site.blocked ? translations[currentLang].unblocked : translations[currentLang].blocked}">
            ${site.blocked ? '🚫' : '👁️'}
          </button>
          <div class="zen-color-picker-container">
            <input type="color" class="zen-color-picker" value="${site.color}" title="${translations[currentLang].highlightColor}"
              ${site.blocked ? 'disabled' : ''}>
          </div>
          <button class="zen-pin-btn ${site.top ? 'pinned' : ''}" title="${site.top ? translations[currentLang].untop : translations[currentLang].top}">
            ${site.top ? '📌' : '📍'}
          </button>
          <button class="zen-delete-btn" title="${translations[currentLang].delete}">-</button>
        </div>
      </div>
    `).join('');

    siteList.addEventListener('click', (e) => {
      const siteItem = e.target.closest('.zen-site-item');
      if (!siteItem) return;

      const url = siteItem.dataset.url;

      if (e.target.matches('.zen-block-btn')) {
        const isBlocked = e.target.classList.contains('blocked');
        updateSite(url, { blocked: !isBlocked });
      } else if (e.target.matches('.zen-pin-btn')) {
        const isPinned = e.target.classList.contains('pinned');
        updateSite(url, { top: !isPinned });
      } else if (e.target.matches('.zen-delete-btn')) {
        deleteSite(url);
      }
    });

    // Add URL edit event listener (using event delegation)
    siteList.addEventListener('blur', (e) => {
      if (e.target.classList.contains('zen-site-url-input')) {
        const oldUrl = e.target.closest('.zen-site-item').dataset.url;
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

  // Delete website
  function deleteSite(url) {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const newSites = sites.filter(site => site.url !== url);
      chrome.storage.local.set({ sites: newSites }, () => {
        loadSites();
        showToast('siteDeleted', { url });

        // Update only the current active tab
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

  // Search function
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const siteItems = siteList.querySelectorAll('.zen-site-item');

    siteItems.forEach(item => {
      const url = item.dataset.url.toLowerCase();
      item.style.display = url.includes(searchTerm) ? 'flex' : 'none';
    });
  });

  // Validate URL matching pattern
  function validateInput(input, isEdit = false) {
    if (!input) return false;

    try {
      // Standard matching pattern regex
      // Allow the following formats:
      // *://*.example.com/*
      // *://example.com/*
      // *://*.example.com/path/*
      // https://*.example.com/*
      const patternRegex = /^(\*|https?):\/\/(\*\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?\*$/;
      
      // Check if it is a standard matching pattern
      if (patternRegex.test(input)) {
        return true;
      }

      // If it is a domain format, automatically convert to matching pattern
      const domainRegex = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
      if (domainRegex.test(input)) {
        // Return the converted format in edit mode
        return isEdit ? `*://*.${input}/*` : true;
      }

      return false;
    } catch (e) {
      console.error('validateInput error', e, { input });
      return false;
    }
  }

  function addSite(url, blocked = false, color = '#e6ffe6') {
    // Convert to standard wildcard format
    const domain = url.replace(/^\*:\/\//, '').replace(/\/\*$/, '');
    const parts = domain.split('.');
    const mainDomain = parts.length > 2
      ? parts.slice(-2).join('.') // For example, apps.apple.com -> apple.com
      : domain;                   // For example, example.com -> example.com

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
        // Notify content script to update display
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

  // Show Toast message
  async function showToast(messageKey, params = {}) {
    const currentLang = await getCurrentLanguage();
    const message = translations[currentLang][messageKey].replace(
      /\{(\w+)\}/g,
      (match, key) => params[key] || match
    );

    // Show toast directly in popup
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Bind add button event
  addSiteBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const blocked = ratingSelect.value === 'blocked';
    const color = colorSelect.value;
    if (validateInput(url)) {
      addSite(url, blocked, color);
    }

  });

  // Bind Enter key to add
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

  // URL input box validation
  urlInput.addEventListener('input', () => {
    const isValid = validateInput(urlInput.value.trim());
    urlInput.classList.toggle('invalid', !isValid);
  });

  // Sort selector event listener
  sortSelect.addEventListener('change', (e) => {
    chrome.storage.local.get(['sites'], ({ sites = [] }) => {
      const sortedSites = sortSites(sites, e.target.value);
      renderSites(sortedSites);
    });
  });

  // Sort website list
  function sortSites(sites, sortBy) {
    return [...sites].sort((a, b) => {
      // First sort by top status
      if (a.top !== b.top) {
        return b.top ? 1 : -1;
      }

      switch (sortBy) {
        case 'url':
          // Sort by URL alphabetically
          return a.url.localeCompare(b.url);

        case 'blocked':
          // First sort by blocked status, then by URL
          if (a.blocked !== b.blocked) {
            return b.blocked ? -1 : 1;
          }
          return a.url.localeCompare(b.url);

        case 'color':
          // First sort by color, then by color value, then by URL
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

  // Switch settings menu display
  settingsBtn.addEventListener('click', () => {
    window.location.href = 'settings.html';
  });

  // Add update URL function
  function updateSiteUrl(oldUrl, newUrl) {
    // Validate new URL (using isEdit=true)
    if (!validateInput(newUrl, true)) {
      showToast('invalidUrl');
      return;
    }

    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === oldUrl);

      if (siteIndex !== -1) {
        // Convert to standard wildcard format, but keep subdomains
        const standardUrl = newUrl.match(/^\*:\/\//)
          ? newUrl
          : `*://${newUrl.replace(/^www\./, '')}/*`;

        sites[siteIndex].url = standardUrl;
        chrome.storage.local.set({ sites }, () => {
          loadSites();
          showToast('urlUpdated', { oldUrl, newUrl });
          // Notify content script to update display
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

  // Language switch function
  async function initializeI18n() {
    const langSelect = document.getElementById('langSelect');
    const currentLang = await getCurrentLanguage();

    // Set current language
    langSelect.value = currentLang;
    await updateLanguage(currentLang);

    // Language switch event
    langSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      await updateLanguage(newLang);
    });
  }

  // Color picker event
  siteList.addEventListener('change', (e) => {
    if (e.target.matches('.zen-color-picker')) {
      const siteItem = e.target.closest('.zen-site-item');
      const url = siteItem.dataset.url;
      updateSite(url, { color: e.target.value });
    }
  });

  // Update site attributes
  function updateSite(url, updates) {
    chrome.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === url);

      if (siteIndex !== -1) {
        sites[siteIndex] = { ...sites[siteIndex], ...updates };
        chrome.storage.local.set({ sites }, () => {
          loadSites();
          // Notify content script to update display
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

  // Initial load
  loadSites();
  initializeI18n();
}); 