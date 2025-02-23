/**
 * Search Engine Configuration Module
 * Define DOM selectors and characteristics for different search engines
 */
const SEARCH_ENGINES = {
  google: {
    host: 'google',
    resultSelector: '.g:not(.g-blk)',
    containerSelector: '#rso',
    linkSelector: 'a[href]:not(.fl)',
    urlSelector: 'cite'
  },
  bing: {
    host: 'www.bing.com',
    resultSelector: [
      '#b_results > li.b_algo',
      '.slide.wptSld[role="listitem"]',
      '.b_wpt_bl',
      '#b_results > .b_ans > .b_rich'
    ].join(','),
    containerSelector: '#b_content',
    linkSelector: [
      'h2 a',
      '.tilk[href]',
      '.b_title a',
      '.b_algo a[h]',
      'a[data-h]',
      '.b_tpcn a'
    ].join(','),
    urlSelector: [
      'cite',
      '.b_attribution cite',
      '.b_citation',
      '.tpmeta .b_attribution',
      '.b_tpcn .b_attribution'
    ].join(',')
  },
  duckduckgo: {
    host: 'duckduckgo.com',
    resultSelector: 'article[data-testid="result"]',
    containerSelector: '.react-results--main',
    linkSelector: 'h2 a[data-testid="result-title-a"]',
    urlSelector: 'a[data-testid="result-extras-url-link"]'
  },
  yahoo: {
    host: 'search.yahoo.com',
    resultSelector: '.algo',
    containerSelector: '#web',
    linkSelector: 'h3.title a',
    urlSelector: '.compTitle cite'
  },
  yahooJp: {
    host: 'search.yahoo.co.jp',
    resultSelector: '.sw-CardBase .Algo',
    containerSelector: '.Contents__innerGroupBody',
    linkSelector: '.sw-Card__titleInner',
    urlSelector: '.sw-Breadcrumbs__item'
  },
  yandex: {
    host: 'yandex.com',
    resultSelector: [
      '.serp-item.organic',
      '.serp-item.Organic',
      '.serp-item.OrganicGroup',
      '.serp-item.Organic.organic',
      '.serp-item.Organic.OrganicGroup',
      '.Organic.organic',
      '.Organic.OrganicGroup'
    ].join(','),
    containerSelector: '.content__left, .main__content',
    linkSelector: '.OrganicTitle-Link, .organic__url, .Link.Link_theme_normal',
    urlSelector: '.Path.Organic-Path, .OrganicTitle-Path, .organic__subtitle .Path-Item'
  },
  yandexRu: {
    host: 'yandex.ru',
    resultSelector: '.Organic.organic',
    containerSelector: '.content__left',
    linkSelector: '.OrganicTitle-LinkText',
    urlSelector: '.Path-Item'
  },
  startpage: {
    host: 'www.startpage.com',
    resultSelector: 'div[class^="result css-"]',
    containerSelector: 'div[class*="results css-"]',
    linkSelector: 'a[data-testid="gl-title-link"]',
    urlSelector: 'a[class*="wgl-display-url"]'
  },
  ecosia: {
    host: 'www.ecosia.org',
    resultSelector: 'article[data-test-id="organic-result"]',
    containerSelector: '[data-test-id="mainline"]',
    linkSelector: '[data-test-id="result-link"]',
    urlSelector: '.result__source--domain'
  },
  ask: {
    host: 'ask.com',
    resultSelector: 'div.result[data-testid="result"]',
    containerSelector: '.results',
    linkSelector: 'a.result-title-link',
    urlSelector: '.result-url'
  },
  aol: {
    host: 'search.aol.com',
    resultSelector: '.dd.algo.algo-sr',
    containerSelector: '#web ul',
    linkSelector: '.title a.ac-algo',
    urlSelector: '.compTitle .fz-ms'
  },
  naver: {
    host: 'search.naver.com',
    resultSelector: '.lst_total > .bx',
    containerSelector: '.api_subject_bx',
    linkSelector: '.total_tit .link_tit',
    urlSelector: '.source_box .txt'
  },
  brave: {
    host: 'search.brave.com',
    resultSelector: '.snippet',
    containerSelector: '[data-type="web"]',
    linkSelector: '.heading-serpresult',
    urlSelector: '.netloc'
  },
  onesearch: {
    host: 'www.onesearch.com',
    resultSelector: '.result-item',
    containerSelector: '#web-results',
    linkSelector: '.result-title a',
    urlSelector: '.result-url'
  },
  searx: {
    host: 'searx',
    resultSelector: '.result.result-default',
    containerSelector: '#main_results',
    linkSelector: 'h3 a',
    urlSelector: '.url_i1'
  },
  qwant: {
    host: 'www.qwant.com',
    resultSelector: '[data-testid="webResult"]',
    containerSelector: '[data-testid="SERVariant-A"]',
    linkSelector: '[data-testid="webResult"] a[href]',
    urlSelector: '[domain]'
  }
};

/**
 * Get current search engine configuration
 * @returns {object|undefined} Current search engine configuration
 */
function getCurrentEngine() {
  const host = window.location.host;
  const engine = Object.values(SEARCH_ENGINES).find(engine => host.includes(engine.host));
  return engine;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'hideCurrentResult') {
    const hoveredElements = document.querySelectorAll(':hover');
    const hoveredResult = hoveredElements[hoveredElements.length - 1];

    if (!hoveredResult) {
      return;
    }
    
    const engine = getCurrentEngine();
    if (!engine) {
      return;
    }

    const resultElement = hoveredResult.closest(engine.resultSelector);
    if (!resultElement) {
      return;
    }

    const url = extractUrl(resultElement, engine);
    if (!url) {
      return;
    }
    
    const domain = new URL(url).hostname;
    
    chrome.runtime.sendMessage(
      { type: 'getTranslation', key: 'confirmHide', params: { domain } },
      (confirmText) => {
        chrome.runtime.sendMessage(
          { type: 'getTranslation', key: 'confirm' },
          (confirmBtnText) => {
            chrome.runtime.sendMessage(
              { type: 'getTranslation', key: 'cancel' },
              (cancelBtnText) => {
                const confirmDialog = document.createElement('div');
                confirmDialog.className = 'zen-confirm-dialog';
                confirmDialog.innerHTML = `
                  <div class="zen-confirm-content">
                    <div class="zen-confirm-header">
                      <img src="${chrome.runtime.getURL('icons/icon128.png')}" class="zen-confirm-icon" alt="ZenSearch">
                      <h3 class="zen-confirm-title">ZenSearch</h3>
                    </div>
                    <p>${confirmText}</p>
                    <div class="zen-confirm-buttons">
                      <button class="zen-confirm-yes">${confirmBtnText}</button>
                      <button class="zen-confirm-no">${cancelBtnText}</button>
                    </div>
                  </div>
                `;
                
                document.body.appendChild(confirmDialog);
                
                confirmDialog.addEventListener('click', (e) => {
                  if (e.target === confirmDialog) {
                    confirmDialog.remove();
                  }
                });
                
                confirmDialog.querySelector('.zen-confirm-yes').addEventListener('click', () => {
                  
                  resultElement.style.display = 'none';
                  
                  const wildcardDomain = `*://*.${domain}/*`;
                  
                  chrome.storage.local.get(['sites', 'language'], (data) => {
                    const sites = data.sites || [];
                    const lang = data.language || 'en';
                    
                    const existingSite = sites.find(site => site.url === wildcardDomain);
                    
                    if (existingSite) {
                      existingSite.blocked = true;
                      chrome.storage.local.set({ sites }, () => {
                        chrome.runtime.sendMessage({ type: 'updateSites' });
                        chrome.runtime.sendMessage(
                          { type: 'getTranslation', key: 'siteBlocked', params: { domain } },
                          (message) => {
                            showToast(message);
                          }
                        );
                      });
                    } else {
                      sites.push({
                        url: wildcardDomain,
                        blocked: true,
                        color: '#e6ffe6',
                        top: false
                      });
                      
                      chrome.storage.local.set({ sites }, () => {
                        chrome.runtime.sendMessage({ type: 'updateSites' });
                        chrome.runtime.sendMessage(
                          { type: 'getTranslation', key: 'siteBlocked', params: { domain } },
                          (message) => {
                            showToast(message);
                          }
                        );
                      });
                    }
                  });
                  
                  confirmDialog.remove();
                });
                
                confirmDialog.querySelector('.zen-confirm-no').addEventListener('click', () => {
                  confirmDialog.remove();
                });
              }
            );
          }
        );
      }
    );
  }
});

/**
 * Check if URL matches the pattern
 * @param {string} url - URL to check
 * @param {string} pattern - Matching pattern
 * @returns {boolean} Whether matches
 */
function matchDomain(url, pattern) {
  if (!url || typeof url !== 'string') return false;

  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    
    const [scheme, rest] = pattern.split('://');
    if (!rest) return false;

    if (scheme !== '*' && scheme !== urlObj.protocol.slice(0, -1)) {
      return false;
    }

    const [host, ...pathParts] = rest.split('/');
    const path = '/' + pathParts.join('/');

    if (host.startsWith('*.')) {
      const domainToMatch = host.slice(2);
      if (!urlObj.hostname.endsWith(domainToMatch)) {
        return false;
      }
    } else {
      if (urlObj.hostname !== host) {
        return false;
      }
    }
    
    if (path === '/*') {
      return true;
    } else {
      const pathPrefix = path.endsWith('/*') ? path.slice(0, -1) : path;
      return urlObj.pathname.startsWith(pathPrefix);
    }

  } catch (e) {
    console.error('matchDomain error', e, { url, pattern });
    return false;
  }
}

/**
 * Show Toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

/**
 * Extract URL from search result
 * @param {HTMLElement} result - Search result element
 * @returns {string|null} Extracted URL
 */
function extractUrl(result) {
  const engine = getCurrentEngine();
  if (!engine) return null;

  let url = null;

  const link = result.querySelector(engine.linkSelector);
  if (link?.href) {
    url = link.href;
  }

  if (!url && engine.urlSelector) {
    const urlElement = result.querySelector(engine.urlSelector);
    if (urlElement && urlElement.textContent) {
      url = urlElement.textContent
        .trim()
        .split(/[›»]/)
        .map(part => part.trim())
        .filter(Boolean)[0];
    }
  }

  if (!url) {
    const titleLink = result.querySelector('h1 a[href], h2 a[href], h3 a[href]');
    if (titleLink?.href) {
      url = titleLink.href;
    }
  }

  if (!url) {
    const anyLink = result.querySelector('a[href]:not([href^="#"]):not([href^="javascript"])');
    if (anyLink?.href) {
      url = anyLink.href;
    }
  }

  return url || null;
}

/**
 * Main function for handling search results
 */
async function filterResults() {
  if (window._filterTimeout) {
    clearTimeout(window._filterTimeout);
  }

  window._filterTimeout = setTimeout(async () => {
    let results = [];
    const engine = getCurrentEngine();
    if (!engine) return;

    results = document.querySelectorAll(engine.resultSelector);
    if (results.length === 0) return;

    await processResults(results);
  }, 100);
}

/**
 * Process search results
 * @param {Element[]} results - Array of search result elements
 */
async function processResults(results) {
  for (const result of results) {
    // 重置样式
    result.style.removeProperty('display');
    result.style.removeProperty('background-color');

    const url = extractUrl(result);
    if (!url) continue;

    const { sites = [] } = await chrome.storage.local.get('sites');
    // 匹配规则
    for (const site of sites) {
      if (matchDomain(url, site.url)) {
        if (site.blocked) {
          result.style.setProperty('display', 'none', 'important');
        } else {
          result.style.setProperty('background-color', site.color, 'important');
        }
        break;
      }
    }
  }
}

/**
 * Handle infinite scroll
 * Monitor scroll container and dynamically filter newly loaded results
 */
function handleInfiniteScroll() {
  const engine = getCurrentEngine();
  if (!engine) return;

  const container = document.querySelector(engine.containerSelector);
  if (!container) return;

  // Optimize MutationObserver callbacks using anti-shake
  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    // Check for relevant content changes
    const hasRelevantChanges = mutations.some(mutation => {
      // Only focus on new nodes
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
        return false;
      }

      // Check if the added nodes are search results
      return Array.from(mutation.addedNodes).some(node => {
        if (!(node instanceof Element)) return false;

        // Check if the added nodes are search result elements
        if (engine.resultSelector && node.matches(engine.resultSelector)) {
          return true;
        }

        // Check if it contains search result elements
        return node.querySelector(engine.resultSelector);
      });
    });

    if (!hasRelevantChanges) return;

    // Use anti-shake to handle frequent triggers
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterResults();
    }, 100);
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });

}

/**
 * Observe page changes
 */
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        filterResults();
        break;
      }
    }
  });

  const config = {
    childList: true,
    subtree: true
  };

  observer.observe(document.body, config);

  window._searchObserver = observer;

  filterResults();
}

/**
 * Monitor URL changes
 */
function observeUrlChanges() {
  let lastUrl = window.location.href;

  window.addEventListener('popstate', () => {
    setTimeout(filterResults, 100);
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    setTimeout(filterResults, 100);
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    setTimeout(filterResults, 100);
  };

  window.addEventListener('hashchange', () => {
    setTimeout(filterResults, 100);
  });

  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(filterResults, 100);
    }
  }, 1000);
}

/**
 * Initialize extension functionality
 */
function initialize() {
  const engine = getCurrentEngine();
  if (!engine) return;

  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      filterResults();
      observePageChanges();
      observeUrlChanges();
      handleInfiniteScroll();
    }, { once: true });
  } else {
    filterResults();
    observePageChanges();
    observeUrlChanges();
    handleInfiniteScroll();
  }
}

window.addEventListener('beforeunload', () => {
  if (window._searchObserver) {
    window._searchObserver.disconnect();
    window._searchObserver = null;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateResults') {
    filterResults();
  }
  if (message.type === 'showToast') {
    showToast(message.message);
  }
  if (message.type === 'setLanguage') {
    chrome.storage.local.set({ language: message.language }, () => {
      chrome.runtime.reload();
    });
  }
});

initialize(); 