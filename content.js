/**
 * 搜索引擎配置模块
 * 为不同的搜索引擎定义DOM选择器和特征
 */
const SEARCH_ENGINES = {
  google: {
    host: 'www.google.com',          // 搜索引擎的域名
    resultSelector: '.g:not(.g-blk)', // 修改选择器以更准确地匹配 Google 搜索结果
    containerSelector: '#rso',        // 搜索结果容器的CSS选择器
    linkSelector: 'a[href]:not(.fl)', // 排除页面底部的链接
    urlSelector: 'cite',             // URL显示元素的CSS选择器
    contentSelector: '.VwiC3b'       // 结果内容的CSS选择器
  },
  duckduckgo: {
    host: 'duckduckgo.com',
    resultSelector: 'article[data-testid="result"]',
    containerSelector: '.react-results--main',
    linkSelector: 'h2 a[data-testid="result-title-a"]',
    urlSelector: 'a[data-testid="result-extras-url-link"]',
    contentSelector: 'div[data-result="snippet"]'
  },
  yahoo: {
    host: 'search.yahoo.com',
    resultSelector: '.algo',
    containerSelector: '#web',
    linkSelector: 'h3.title a',
    urlSelector: '.compTitle cite',
    contentSelector: '.compText'
  },
  bing: {
    host: 'www.bing.com',
    resultSelector: '#b_results .b_algo',
    containerSelector: '#b_results',
    linkSelector: 'h2 a',
    urlSelector: 'cite'
  },
  startpage: {
    host: 'www.startpage.com',
    resultSelector: 'div[class^="result css-"]',  // 匹配以 'result' 开头的类名
    containerSelector: 'div[class*="results css-"]',  // 匹配包含 'results' 的类名
    linkSelector: 'a[data-testid="gl-title-link"]',  // 使用 data-testid 属性
    urlSelector: 'a[class*="wgl-display-url"]',  // 匹配包含 'wgl-display-url' 的类名
    contentSelector: 'p[class*="description"]'  // 匹配包含 'description' 的类名
  },
  ecosia: {
    host: 'www.ecosia.org',
    // resultSelector: '.mainline__result-wrapper',  // 更新为正确的结
    // 果容器选择器
    // containerSelector: '[data-test-id="mainline"]',  // 更新为主容
    // 器选择器
    // linkSelector: '.result__title a',  // 更新为标题链接选择器
    // urlSelector: '.result__source .source__content--domain',  // 
    // 更新为 URL 显示选择器
    // contentSelector: '.web-result__description'  // 更新为描述文本
    // 选择器
    resultSelector: 'article[data-test-id="organic-result"]',  // 更精确的选择器
    containerSelector: '[data-test-id="mainline"]',
    linkSelector: '[data-test-id="result-link"]',
    urlSelector: '.result__source--domain',
    contentSelector: '[data-test-id="result-description"]'
  },
  yandex: {
    host: 'yandex.com',
    resultSelector: '.serp-item',
    containerSelector: '.content__left',
    linkSelector: '.OrganicTitle-Link',
    urlSelector: '.Path-Item',
    contentSelector: '.OrganicText'
  },
  onesearch: {
    host: 'www.onesearch.com',
    resultSelector: '.algo',
    containerSelector: '#web',
    linkSelector: 'h3.title a',
    urlSelector: '.compTitle cite',
    contentSelector: '.compText'
  },
  so360: {
    host: 'www.so.com',
    resultSelector: '.res-list',
    containerSelector: '#main',
    linkSelector: 'h3 a',
    urlSelector: '.res-linkinfo cite'
  },
  sogou: {
    host: 'www.sogou.com',
    resultSelector: '.vrwrap',
    containerSelector: '#main',
    linkSelector: 'h3 a',
    urlSelector: 'cite'
  },
  naver: {
    host: 'search.naver.com',
    resultSelector: '.sh_web_top',
    containerSelector: '#main_pack',
    linkSelector: '.title_link',
    urlSelector: '.url'
  },
  ask: {
    host: 'www.ask.com',
    resultSelector: '.PartialSearchResults-item',
    containerSelector: '.PartialSearchResults-body',
    linkSelector: '.PartialSearchResults-item-title-link',
    urlSelector: '.PartialSearchResults-item-url',
    contentSelector: '.PartialSearchResults-item-abstract'
  },
  aol: {
    host: 'search.aol.com',
    resultSelector: '.algo-sr',
    containerSelector: '#web',
    linkSelector: 'h3.title a',
    urlSelector: '.compTitle cite',
    contentSelector: '.compText'
  },
  wolframalpha: {
    host: 'www.wolframalpha.com',
    resultSelector: '.pod',
    containerSelector: '#main',
    linkSelector: '.pod__title a',
    urlSelector: '.pod__sourcelink',
    contentSelector: '.pod__content'
  },
  internetarchive: {
    host: 'archive.org',
    resultSelector: '.item-ia',
    containerSelector: '#ikind-search',
    linkSelector: '.item-title a',
    urlSelector: '.item-details-metadata',
    contentSelector: '.item-description'
  },
  haosou: {
    host: 'www.so.com',
    resultSelector: '.res-list',
    containerSelector: '#container',
    linkSelector: '.res-title a',
    urlSelector: '.res-linkinfo cite',
    contentSelector: '.res-desc'
  }
};

/**
 * 统计数据对象
 * 用于跟踪插件的使用效果和用户行为
 */
let stats = {
  filteredCount: 0,          // 被过滤的结果数量
  highlightedCount: 0,       // 被高亮的结果数量
  startTime: Date.now(),     // 插件启动时间
  estimatedTimeSaved: 0      // 估计节省的时间(秒)
};

/**
 * 更新统计数据
 * @param {string} type - 统计类型 ('filteredCount' 或 'highlightedCount')
 */
function updateStats(type) {
  stats[type]++;
  // 假设每个过滤的结果节省12秒
  stats.estimatedTimeSaved = stats.filteredCount * 12;

  // 保存到存储并更新显示
  chrome.storage.local.set({ stats });
  updateStatsDisplay();
}

/**
 * 创建统计显示面板
 * @returns {HTMLElement} 创建的统计面板元素
 */
function createStatsPanel() {
  const panel = document.createElement('div');
  panel.className = 'stats-panel';
  panel.innerHTML = `
    <div class="stats-content">
      <div class="stats-item">已过滤: <span id="filtered-count">0</span></div>
      <div class="stats-item">已高亮: <span id="highlighted-count">0</span></div>
      <div class="stats-item">预计节省: <span id="time-saved">0分钟</span></div>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

/**
 * 更新统计显示
 */
function updateStatsDisplay() {
  const panel = document.querySelector('.stats-panel') || createStatsPanel();
  panel.querySelector('#filtered-count').textContent = stats.filteredCount;
  panel.querySelector('#highlighted-count').textContent = stats.highlightedCount;
  panel.querySelector('#time-saved').textContent =
    `${Math.round(stats.estimatedTimeSaved / 60)}分钟`;
}

/**
 * 应用自定义样式
 * @param {HTMLElement} element - 要应用样式的元素
 * @param {object} styles - 样式对象
 */
function applyCustomStyle(element, styles) {
  element.style.backgroundColor = styles.highlightColor;
  element.style.borderLeft = `${styles.borderWidth}px solid ${styles.borderColor}`;
}

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
 * 结果处理配置
 */
const RESULT_STYLES = {
  hidden: {
    opacity: '0.5',
    backgroundColor: '#f5f5f5'
  },
  highlighted: {
    backgroundColor: '#e6ffe6',
    borderLeft: '3px solid #4CAF50'
  }
};

/**
 * 应用视觉样式
 * @param {HTMLElement} result - 搜索结果元素
 * @param {string} type - 样式类型 ('hidden' 或 'highlighted')
 * @param {object} styles - 样式对象
 */
function applyVisualEnhancement(result, type, styles) {
  const element = result;

  if (type === 'hidden') {
    element.style.opacity = styles.hiddenOpacity || '0.5';
    element.style.backgroundColor = '#f5f5f5';
    addIcon(element, '🚫');
  } else if (type === 'highlighted') {
    element.style.backgroundColor = styles.highlightColor || '#e6ffe6';
    element.style.borderLeft = `${styles.borderWidth || 3}px solid ${styles.borderColor || '#4CAF50'}`;
    addIcon(element, '⭐');
  }
}

/**
 * 添加图标
 * @param {HTMLElement} element - 要添加图标的元素
 * @param {string} icon - 要添加的图标
 */
function addIcon(element, icon) {
  const iconSpan = document.createElement('span');
  iconSpan.className = 'result-icon';
  iconSpan.textContent = icon;
  element.insertBefore(iconSpan, element.firstChild);
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
      updateStats('filteredCount');
    }
  }
});

/**
 * URL缓存管理器
 */
const UrlCache = {
  // 缓存数据
  _cache: new Map(),

  // 缓存过期时间（24小时）
  _expireTime: 60 * 60 * 1000,

  /**
   * 获取缓存的URL
   * @param {string} key - 缓存键值
   * @returns {string|null} 缓存的URL或null
   */
  get(key) {
    const data = this._cache.get(key);
    if (!data) return null;

    // 检查是否过期
    if (Date.now() - data.timestamp > this._expireTime) {
      this._cache.delete(key);
      return null;
    }

    return data.url;
  },

  /**
   * 设置缓存
   * @param {string} key - 缓存键值
   * @param {string} url - 要缓存的URL
   */
  set(key, url) {
    this._cache.set(key, {
      url,
      timestamp: Date.now()
    });

    // 如果缓存太大，清理旧数据
    if (this._cache.size > 1000) {
      const oldestKey = Array.from(this._cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this._cache.delete(oldestKey);
    }
  }
};

// 验证URL或正则表达式
function validURL(url) {
  if (!url) return false;

  try {
    // 处理正则表达式字符串
    if (url.includes('*')) {
      // 将 * 转换为正则表达式
      const regexStr = url.replace(/\*/g, '.*')
        .replace(/\./g, '\\.');
      new RegExp(regexStr);
      return true;
    }

    // 尝试作为URL验证
    try {
      new URL(url.startsWith('http') ? url : `http://${url}`);
      return true;
    } catch {
      // 如果不是有效URL，尝试作为域名验证
      return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(url);
    }
  } catch (e) {
    return false;
  }
}

/**
 * 从搜索结果中提取URL
 * @param {HTMLElement} result - 搜索结果元素
 * @returns {string|null} 提取的URL
 */
async function extractUrl(result) {
  const engine = getCurrentEngine();
  if (!engine) return '';

  // 获取URL元素和链接元素
  const urlElement = result.querySelector(engine.urlSelector);
  const linkElement = result.querySelector(engine.linkSelector);

  let url = '';

  if (urlElement && urlElement.textContent) {
    url = urlElement.textContent
      .trim()
      .split(/[›»]/) // 分割特殊字符
      .map(part => part.trim()) // 清理每个部分
      .filter(Boolean)[0]; // 取第一部分
  } else if (linkElement && linkElement.href) {
    url = linkElement.href;
  }

  console.log('Extracted URL:', {
    result,
    urlElement,
    linkElement,
    url
  });

  return url;
}

/**
 * 检查URL是否匹配规则
 * @param {string} url - 要检查的URL
 * @param {string} pattern - 匹配模式
 * @returns {boolean} 是否匹配
 */
function matchDomain(url, pattern) {
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
    console.error('Error matching domain:', e);
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
 * 根据好感度处理搜索结果的主函数
 */
async function filterResults() {
  chrome.storage.local.get(['sites'], async (data) => {
    const sites = data.sites || [];
    const engine = getCurrentEngine();
    const results = document.querySelectorAll(engine.resultSelector);

    for (const result of results) {
      const url = await extractUrl(result);
      if (!url) continue;

      // 清除之前的高亮和屏蔽效果
      result.style.removeProperty('display');
      result.style.removeProperty('background-color');

      for (const site of sites) {
        if (matchDomain(url, site.url)) {
          if (site.blocked) {
            result.style.setProperty('display', 'none', 'important');
          } else {
            result.style.setProperty('background-color', site.color, 'important');
          }
          break; // 找到匹配的网站后跳出循环
        }
      }
    }
  });
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        filterResults();
      }
    });
  }, {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  });

  observer.observe(container);
}

/**
 * 监听页面变化
 * 用于处理AJAX加载的新内容和页面切换
 */
function observePageChanges() {
  // 创建 MutationObserver 实例
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 检查是否有新的搜索结果添加
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 延迟执行以确保DOM完全加载
        setTimeout(filterResults, 100);
      }
    });
  });

  // 获取当前搜索引擎配置
  const engine = getCurrentEngine();
  if (!engine) return;

  // 获取要观察的容器
  const container = document.querySelector(engine.containerSelector);
  if (!container) return;

  // 配置观察选项
  const config = {
    childList: true,      // 观察子节点变化
    subtree: true,        // 观察所有后代节点
    attributes: false,    // 不观察属性变化
    characterData: false  // 不观察文本内容变化
  };

  // 开始观察
  observer.observe(container, config);

  // 保存observer实例以便清理
  window._searchObserver = observer;
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

  // 初始过滤
  filterResults();

  // 设置页面观察器
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

function updateSiteHighlight(url, color) {
  const results = document.querySelectorAll(getCurrentEngine().resultSelector);
  results.forEach(result => {
    const resultUrl = extractUrl(result);
    if (resultUrl && matchDomain(resultUrl, url)) {
      result.style.backgroundColor = color;
    }
  });
}

// 添加初始化确认
chrome.runtime.sendMessage({ type: 'contentScriptLoaded' });

initialize(); 