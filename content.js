/**
 * 搜索引擎配置模块
 * 为不同的搜索引擎定义DOM选择器和特征
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
    resultSelector: '.serp-item',
    containerSelector: '.content__left',
    linkSelector: '.OrganicTitle-Link',
    urlSelector: '.Path-Item'
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
    host: 'www.ask.com',
    resultSelector: '.result[data-testid="result"]',
    containerSelector: '.results',
    linkSelector: '.result-title-link',
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
    resultSelector: '.lst_total',
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
 * 获取当前搜索引擎配置
 * @returns {object|undefined} 当前搜索引擎配置
 */
function getCurrentEngine() {
  const host = window.location.host;
  const engine = Object.values(SEARCH_ENGINES).find(engine => host.includes(engine.host));
  return engine;
}

/**
 * 处理快捷键消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'hideCurrentResult') {
    const hoveredResult = document.querySelector(':hover');
    const engine = getCurrentEngine();
    const resultElement = hoveredResult.closest(engine.resultSelector);

    if (resultElement) {
      resultElement.style.display = 'none';
    }
  }
});

/**
 * 检查URL是否匹配规则
 * @param {string} url - 要检查的URL
 * @param {string} pattern - 匹配模式
 * @returns {boolean} 是否匹配
 */
function matchDomain(url, pattern) {
  if (!url || typeof url !== 'string') return false;

  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    // 从URL中提取域名
    const domain = new URL(url).hostname;
    // 创建正则表达式对象
    const regex = new RegExp(pattern);
    // 测试域名是否匹配规则
    return regex.test(domain);
  } catch (e) {
    console.error('matchDomain error', e);
    return false;
  }
}

/**
 * 显示Toast提示
 * @param {string} message - 要显示的消息
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
 * 从搜索结果中提取URL
 * @param {HTMLElement} result - 搜索结果元素
 * @returns {string|null} 提取的URL
 */
function extractUrl(result) {
  const engine = getCurrentEngine();
  if (!engine) return null;

  let url = null;

  // 1. 使用引擎特定的URL选择器
  const urlElement = result.querySelector(engine.urlSelector);
  if (urlElement && urlElement.textContent) {
    url = urlElement.textContent
      .trim()
      .split(/[›»]/) // 分割特殊字符
      .map(part => part.trim()) // 清理每个部分
      .filter(Boolean)[0]; // 取第一部分
  }

  // 2. 使用引擎特定的链接选择器
  if (!url && engine.linkSelector) {
    const link = result.querySelector(engine.linkSelector);
    if (link?.href) {
      url = link.href;
    }
  }

  // 3. 查找标题中的链接
  if (!url) {
    const titleLink = result.querySelector('h1 a[href], h2 a[href], h3 a[href]');
    if (titleLink?.href) {
      url = titleLink.href;
    }
  }

  // 4. 尝试任何非特殊的链接
  if (!url) {
    const anyLink = result.querySelector('a[href]:not([href^="#"]):not([href^="javascript"])');
    if (anyLink?.href) {
      url = anyLink.href;
    }
  }

  return url || null;
}

/**
 * 处理搜索结果的主函数
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

    // 处理找到的结果
    await processResults(results);
  }, 100);
}

/**
 * 处理搜索结果
 * @param {Element[]} results - 搜索结果元素数组
 */
async function processResults(results) {
  const { sites = [] } = await chrome.storage.local.get('sites');
  if (sites.length === 0) return;

  for (const result of results) {
    // 重置样式
    result.style.removeProperty('display');
    result.style.removeProperty('background-color');

    const url = extractUrl(result);
    if (!url) continue;

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
 * 处理无限滚动
 * 监听滚动容器，动态过滤新加载的结果
 */
function handleInfiniteScroll() {
  const engine = getCurrentEngine();
  if (!engine) return;

  const container = document.querySelector(engine.containerSelector);
  if (!container) return;

  // 使用防抖优化 MutationObserver 回调
  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    // 检查是否有实际的内容变化
    const hasRelevantChanges = mutations.some(mutation => {
      // 只关注新增的节点
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
        return false;
      }

      // 检查新增节点是否是搜索结果
      return Array.from(mutation.addedNodes).some(node => {
        if (!(node instanceof Element)) return false;

        // 检查是否是搜索结果元素
        if (engine.resultSelector && node.matches(engine.resultSelector)) {
          return true;
        }

        // 检查是否包含搜索结果
        return node.querySelector(engine.resultSelector);
      });
    });

    if (!hasRelevantChanges) return;

    // 使用防抖处理频繁触发
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterResults();
    }, 100);
  });

  // 配置观察选项
  observer.observe(container, {
    childList: true,      // 观察子节点变化
    subtree: true,        // 观察所有后代节点
    attributes: false,    // 不观察属性变化
    characterData: false  // 不观察文本内容变化
  });

}

/**
 * 观察页面变化
 */
function observePageChanges() {
  // 创建观察器实例
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        filterResults();
        break;
      }
    }
  });

  // 配置观察选项
  const config = {
    childList: true,  // 观察子节点变化
    subtree: true     // 观察所有后代节点
  };

  // 开始观察
  observer.observe(document.body, config);

  // 保存观察器实例以便清理
  window._searchObserver = observer;

  // 初始检查
  filterResults();
}

/**
 * 监听 URL 变化
 */
function observeUrlChanges() {
  // 保存当前URL
  let lastUrl = window.location.href;

  // 监听 popstate 事件（浏览器前进/后退）
  window.addEventListener('popstate', () => {
    setTimeout(filterResults, 100);
  });

  // 监听 pushState 和 replaceState
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

  // 监听 hashchange 事件
  window.addEventListener('hashchange', () => {
    setTimeout(filterResults, 100);
  });

  // 定期检查 URL 变化
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(filterResults, 100);
    }
  }, 1000); // 每1000ms检查一次
}

/**
 * 初始化
 */
function initialize() {
  // 获取当前搜索引擎配置
  const engine = getCurrentEngine();
  if (!engine) return;

  // 初始化页面观察器
  observePageChanges();

  // 监听 URL 变化
  observeUrlChanges();

  // 处理无限滚动
  handleInfiniteScroll();
}

// 清理函数
function cleanup() {
  if (window._searchObserver) {
    window._searchObserver.disconnect();
    window._searchObserver = null;
  }
}

// 添加清理监听
window.addEventListener('beforeunload', cleanup);

// 添加消息监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateResults') {
    filterResults();
  }
  if (message.type === 'showToast') {
    showToast(message.message);
  }
  if (message.type === 'setLanguage') {
    chrome.storage.local.set({ language: message.language }, () => {
      // 可能需要重新加载扩展
      chrome.runtime.reload();
    });
  }
});

initialize(); 