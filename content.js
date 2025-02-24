const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
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

const DEBUG = false;
function debug(...args) {
    if (DEBUG) {
        console.debug(...args);
    }
}

/**
 * Get current search engine configuration
 * @returns {object|undefined} Current search engine configuration
 */
function getCurrentEngine() {
  const host = window.location.host;
  const engine = Object.values(SEARCH_ENGINES).find(engine => host.includes(engine.host));
  return engine;
}

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

    browserAPI.runtime.sendMessage(
      { type: 'getTranslation', key: 'confirmHide', params: { domain } },
      (confirmText) => {
        browserAPI.runtime.sendMessage(
          { type: 'getTranslation', key: 'confirm' },
          (confirmBtnText) => {
            browserAPI.runtime.sendMessage(
              { type: 'getTranslation', key: 'cancel' },
              (cancelBtnText) => {
                const confirmDialog = document.createElement('div');
                confirmDialog.className = 'zen-confirm-dialog';

                const content = document.createElement('div');
                content.className = 'zen-confirm-content';

                const header = document.createElement('div');
                header.className = 'zen-confirm-header';

                const icon = document.createElement('img');
                icon.src = browserAPI.runtime.getURL('icons/icon128.png');
                icon.className = 'zen-confirm-icon';
                icon.alt = 'ZenSearch';

                const title = document.createElement('h3');
                title.className = 'zen-confirm-title';
                title.textContent = 'ZenSearch';

                header.appendChild(icon);
                header.appendChild(title);

                const text = document.createElement('p');
                text.textContent = confirmText;

                const buttons = document.createElement('div');
                buttons.className = 'zen-confirm-buttons';

                const yesBtn = document.createElement('button');
                yesBtn.className = 'zen-confirm-yes';
                yesBtn.textContent = confirmBtnText;

                const noBtn = document.createElement('button');
                noBtn.className = 'zen-confirm-no';
                noBtn.textContent = cancelBtnText;

                buttons.appendChild(yesBtn);
                buttons.appendChild(noBtn);

                content.appendChild(header);
                content.appendChild(text);
                content.appendChild(buttons);
                confirmDialog.appendChild(content);

                document.body.appendChild(confirmDialog);

                confirmDialog.addEventListener('click', (e) => {
                  if (e.target === confirmDialog) {
                    confirmDialog.remove();
                  }
                });

                confirmDialog.querySelector('.zen-confirm-yes').addEventListener('click', () => {

                  resultElement.style.display = 'none';

                  const wildcardDomain = `*://*.${domain}/*`;

                  browserAPI.storage.local.get(['sites', 'language'], (data) => {
                    const sites = data.sites || [];
                    const lang = data.language || 'en';

                    const existingSite = sites.find(site => site.url === wildcardDomain);

                    if (existingSite) {
                      existingSite.blocked = true;
                      browserAPI.storage.local.set({ sites }, () => {
                        browserAPI.runtime.sendMessage({ type: 'updateSites' });
                        browserAPI.runtime.sendMessage(
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

                      browserAPI.storage.local.set({ sites }, () => {
                        browserAPI.runtime.sendMessage({ type: 'updateSites' });
                        browserAPI.runtime.sendMessage(
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
 * Handles URL redirects from Google and Bing search results
 * @param {string} url - The URL to handle
 * @returns {string} The original or redirected URL
 */
function handleRedirect(url) {
  // handles redirected links to Google search results
  if (url.match(/^https?:\/\/(?:[\w-]+\.)*google\.[a-z.]+\/url\?/i)) {
    const urlParams = new URLSearchParams(new URL(url).search);
    url = urlParams.get('url') || url;
  }
  // handles redirected links to Bing search results
  else if (url.match(/^https?:\/\/(?:[\w-]+\.)*bing\.[a-z.]+\/ck\/a\?/i)) {
    const urlParams = new URLSearchParams(new URL(url).search);
    const encodedUrl = urlParams.get('u');
    if (encodedUrl) {
      try {
        url = atob(encodedUrl.slice(2)) || url;
      } catch (e) {
        console.error('Error decoding Bing URL:', e);
      }
    }
  }
  // handles redirected links to Yahoo search results
  else if (url.match(/^https?:\/\/r\.search\.yahoo\.com\/.+\/RU=/i)) {
    try {
      // Extract URL between RU= and /RK=
      const matches = url.match(/\/RU=([^/]+)\/RK=/);
      if (matches && matches[1]) {
        url = decodeURIComponent(matches[1]);
      }
    } catch (e) {
      console.error('Error parsing Yahoo redirect URL:', e);
    }
  }
  // handles redirected links to AOL search results
  else if (url.match(/^https?:\/\/(?:[\w-]+\.)*search\.aol\.com\/click\/.+\/RU=/i)) {
    try {
      const matches = url.match(/\/RU=([^/]+)\/RK=/);
      if (matches && matches[1]) {
        url = decodeURIComponent(matches[1]);
      }
    } catch (e) {
      console.error('Error parsing AOL redirect URL:', e);
    }
  }
  
  return url;
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

  url = handleRedirect(url);
  debug('Extracted URL:', url);
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
    debug('results', results);

    await processResults(results);
  }, 100);
}

/**
 * Process search results
 * @param {Element[]} results - Array of search result elements
 */
async function processResults(results) {
  for (const result of results) {
    // reset style
    result.style.removeProperty('display');
    result.style.removeProperty('background-color');
  }
  const { sites = [] } = await browserAPI.storage.local.get('sites');
  for (const site of sites) {
    for (const result of results) {
      const url = extractUrl(result);
      if (!url) continue;
      if (matchDomain(url, site.url)) {
        if (site.blocked) {
          result.style.setProperty('display', 'none', 'important');
          debug(result, ' blocked url ', url);
        } else {
          result.style.setProperty('background-color', site.color, 'important');
          debug(result, ' highlight url', url, "color", site.color);
        }
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

browserAPI.runtime.onMessage.addListener((message, sender) => {
  // Firefox requires a Promise return for async operations
  return new Promise(resolve => {
    if (message.type === 'updateResults') {
      console.log('Received updateResults message');
      filterResults();
      resolve(true);
    }
    if (message.type === 'showToast') {
      showToast(message.message);
      resolve(true);
    }
    if (message.type === 'setLanguage') {
      browserAPI.storage.local.set({ language: message.language }, () => {
        browserAPI.runtime.reload();
        resolve(true);
      });
    }
  });
});

initialize(); 