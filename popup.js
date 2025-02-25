import { updateLanguage, translations } from './i18n.js';
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function getCurrentLanguage() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['language'], ({ language }) => {
      resolve(language || 'en');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let addSitePickr;
  const siteList = document.getElementById('siteList');
  const searchInput = document.getElementById('searchInput');
  const settingsBtn = document.getElementById('settingsBtn');
  const urlInput = document.getElementById('urlInput');
  const ratingSelect = document.getElementById('ratingSelect');
  const addSiteBtn = document.getElementById('addSiteBtn');
  const sortSelect = document.getElementById('sortSelect');
  const colorSelect = document.getElementById('colorSelect');

  function loadSites() {
    browserAPI.storage.local.get(['sites'], (data) => {
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

    siteList.textContent = '';
    sortedSites.forEach(site => {
      const siteItem = document.createElement('div');
      siteItem.className = 'zen-site-item';
      siteItem.dataset.url = site.url;
      
      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.className = 'zen-site-url-input';
      urlInput.value = site.url;
      
      const actions = document.createElement('div');
      actions.className = 'zen-site-actions';
      
      const blockBtn = document.createElement('button');
      blockBtn.className = `zen-block-btn ${site.blocked ? 'blocked' : ''}`;
      blockBtn.title = site.blocked ? translations[currentLang].unblocked : translations[currentLang].blocked;
      blockBtn.textContent = site.blocked ? '🚫' : '👁️';
      
      const colorContainer = document.createElement('div');
      colorContainer.className = 'zen-color-picker-container';
      
      const colorBtn = document.createElement('div');
      colorBtn.className = 'pickr-button';
      colorBtn.dataset.color = site.color;
      colorBtn.dataset.url = site.url;
      if (site.blocked) colorBtn.dataset.disabled = 'true';
      
      const pinBtn = document.createElement('button');
      pinBtn.className = `zen-pin-btn ${site.top ? 'pinned' : ''}`;
      pinBtn.title = site.top ? translations[currentLang].untop : translations[currentLang].top;
      pinBtn.textContent = site.top ? '📌' : '📍';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'zen-delete-btn';
      deleteBtn.title = translations[currentLang].delete;
      deleteBtn.textContent = '-';
      
      colorContainer.appendChild(colorBtn);
      actions.appendChild(blockBtn);
      actions.appendChild(colorContainer);
      actions.appendChild(pinBtn);
      actions.appendChild(deleteBtn);
      
      siteItem.appendChild(urlInput);
      siteItem.appendChild(actions);
      siteList.appendChild(siteItem);
    });

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

    // Add color picker event listener
    siteList.addEventListener('click', (e) => {
      if (e.target.matches('.zen-color-btn') && !e.target.disabled) {
        const siteItem = e.target.closest('.zen-site-item');
        const url = siteItem.dataset.url;
        const currentColor = e.target.dataset.color;
        
        // Remove any existing color panel
        const existingPanel = document.querySelector('.color-panel');
        if (existingPanel) existingPanel.remove();
        
        // Create color panel
        const panel = createColorPanel(url, currentColor, e.target);
        document.body.appendChild(panel);
        
        // Position the panel
        const rect = e.target.getBoundingClientRect();
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.bottom + 5}px`;
        
        // Close panel when clicking outside
        const closePanel = (event) => {
          if (!panel.contains(event.target) && !e.target.contains(event.target)) {
            panel.remove();
            document.removeEventListener('click', closePanel);
          }
        };
        
        // Delay adding the click listener to prevent immediate closing
        setTimeout(() => {
          document.addEventListener('click', closePanel);
        }, 0);
      }
    });

    // Initialize Pickr for each color button
    document.querySelectorAll('.pickr-button').forEach(el => {
      if (el.dataset.disabled === 'true') return;
      
      const pickr = Pickr.create({
        el,
        theme: 'classic',
        default: el.dataset.color,
        
        swatches: [
          '#e6ffe6', '#ffe6e6', '#e6e6ff', '#ffffe6',
          '#e6ffff', '#ffe6ff', '#f0f0f0', '#ffffff'
        ],
        
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            input: true,
            save: true
          }
        }
      });
      
      pickr.on('save', (color) => {
        const hexColor = color.toHEXA().toString();
        updateSite(el.dataset.url, { color: hexColor });
        pickr.hide();
      });
    });
  }

  // Delete website
  function deleteSite(url) {
    browserAPI.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const newSites = sites.filter(site => site.url !== url);
      browserAPI.storage.local.set({ sites: newSites }, () => {
        loadSites();
        showToast('siteDeleted', { url });

        // Update only the current active tab
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
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

    browserAPI.storage.local.get(['sites'], (data) => {
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

      browserAPI.storage.local.set({ sites }, () => {
        loadSites();
        showToast('siteAdded', { url });
        // Notify content script to update display
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
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

  // Initialize Pickr for add site color selector
  addSitePickr = Pickr.create({
    el: colorSelect,
    theme: 'classic',
    default: '#e6ffe6',
    swatches: [
      '#e6ffe6', '#ffe6e6', '#e6e6ff', '#ffffe6',
      '#e6ffff', '#ffe6ff', '#f0f0f0', '#ffffff'
    ],
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        hex: true,
        rgba: true,
        input: true,
        save: true
      }
    }
  });

  // Update color button style when color changes
  addSitePickr.on('change', (color) => {
    colorSelect.style.backgroundColor = color.toHEXA().toString();
  });

  // Hide color picker when save is clicked
  addSitePickr.on('save', (color) => {
    if (color) {
      colorSelect.style.backgroundColor = color.toHEXA().toString();
    }
    addSitePickr.hide();
  });

  // Hide color picker when cancel is clicked
  addSitePickr.on('cancel', () => {
    addSitePickr.hide();
  });

  // Initialize color button style
  colorSelect.style.backgroundColor = '#e6ffe6';

  // Add site button click handler
  addSiteBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const blocked = ratingSelect.value === 'blocked';
    const color = addSitePickr.getColor().toHEXA().toString();
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
    browserAPI.storage.local.get(['sites'], ({ sites = [] }) => {
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

    browserAPI.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === oldUrl);

      if (siteIndex !== -1) {
        // Convert to standard wildcard format, but keep subdomains
        const standardUrl = newUrl.match(/^\*:\/\//)
          ? newUrl
          : `*://${newUrl.replace(/^www\./, '')}/*`;

        sites[siteIndex].url = standardUrl;
        browserAPI.storage.local.set({ sites }, () => {
          loadSites();
          showToast('urlUpdated', { oldUrl, newUrl });
          // Notify content script to update display
          browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              browserAPI.tabs.sendMessage(tabs[0].id, {
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
    browserAPI.storage.local.get(['sites'], (data) => {
      const sites = data.sites || [];
      const siteIndex = sites.findIndex(site => site.url === url);

      if (siteIndex !== -1) {
        sites[siteIndex] = { ...sites[siteIndex], ...updates };
        browserAPI.storage.local.set({ sites }, () => {
          loadSites();
          // Notify content script to update display
          browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              browserAPI.tabs.sendMessage(tabs[0].id, {
                type: 'updateResults'
              });
            }
          });
        });
      }
    });
  }

  function createColorPanel(url, currentColor, buttonElement) {
    const panel = document.createElement('div');
    panel.className = 'color-panel';
    
    // Predefined colors
    const colors = [
      '#e6ffe6', '#ffe6e6', '#e6e6ff', '#ffffe6',
      '#e6ffff', '#ffe6ff', '#f0f0f0', '#ffffff'
    ];
    
    // Create color grid
    const grid = document.createElement('div');
    grid.className = 'color-grid';
    colors.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-option';
      colorBtn.style.backgroundColor = color;
      colorBtn.title = color;
      if (color === currentColor) {
        colorBtn.classList.add('selected');
      }
      
      colorBtn.addEventListener('click', () => {
        updateSite(url, { color });
        buttonElement.style.backgroundColor = color;
        buttonElement.dataset.color = color;
        panel.remove();
      });
      
      grid.appendChild(colorBtn);
    });
    
    // Create custom color input
    const customColor = document.createElement('div');
    customColor.className = 'custom-color';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor;
    colorInput.addEventListener('change', () => {
      updateSite(url, { color: colorInput.value });
      buttonElement.style.backgroundColor = colorInput.value;
      buttonElement.dataset.color = colorInput.value;
      panel.remove();
    });
    
    customColor.appendChild(colorInput);
    
    panel.appendChild(grid);
    panel.appendChild(customColor);
    
    return panel;
  }

  // Initial load
  loadSites();
  initializeI18n();
}); 