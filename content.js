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
    resultSelector: '.result',
    containerSelector: '.results',
    linkSelector: 'a.result__a',
    urlSelector: '.result__url',
    contentSelector: '.result__snippet'
  },
  yahoo: {
    host: 'search.yahoo.com',
    resultSelector: '.algo',
    containerSelector: '#web',
    linkSelector: 'a',
    urlSelector: '.url'
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
    resultSelector: '.result',
    containerSelector: '.results',
    linkSelector: 'a.w-gl__result-title',
    urlSelector: '.w-gl__url'
  },
  ecosia: {
    host: 'www.ecosia.org',
    resultSelector: '.result',
    containerSelector: '.results',
    linkSelector: '.result-title',
    urlSelector: '.result-url'
  },
  yandex: {
    host: 'yandex.com',
    resultSelector: '.serp-item',
    containerSelector: '.content__left',
    linkSelector: '.link',
    urlSelector: '.path'
  },
  onesearch: {
    host: 'www.onesearch.com',
    resultSelector: '.algo',
    containerSelector: '#web',
    linkSelector: 'a',
    urlSelector: '.url'
  },
  baidu: {
    host: 'www.baidu.com',
    resultSelector: '#content_left .result',
    containerSelector: '#content_left',
    linkSelector: 'h3.t a',
    urlSelector: '.c-showurl'
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
 * 好感度配置
 */
const RATING_LEVELS = {
  5: { icon: '❤️', class: 'result-love-5', opacity: 1 },
  4: { icon: '💗', class: 'result-love-4', opacity: 1 },
  3: { icon: '💛', class: 'result-love-3', opacity: 1 },
  2: { icon: '🖤', class: 'result-love-2', opacity: 0.7 },
  1: { icon: '💔', class: 'result-love-1', opacity: 0.5 }
};

/**
 * 应用好感度样式
 * @param {HTMLElement} result - 搜索结果元素
 * @param {number} level - 好感度等级
 * @param {object} styles - 样式对象
 */
function applyRatingStyle(result, level, styles) {
  const ratingConfig = RATING_LEVELS[level];
  if (!ratingConfig) return;

  const element = result;
  element.className += ` ${ratingConfig.class}`;
  element.style.opacity = ratingConfig.opacity;

  // 添加图标
  if (styles.showIcons) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'rating-icon';
    iconSpan.textContent = ratingConfig.icon;
    element.insertBefore(iconSpan, element.firstChild);
  }
}

/**
 * 从搜索结果中提取URL
 * @param {HTMLElement} result - 搜索结果元素
 * @returns {string|null} 提取的URL
 */
function extractUrl(result) {
  const engine = getCurrentEngine();
  const urlElement = result.querySelector(engine.urlSelector);
  const linkElement = result.querySelector(engine.linkSelector);
  
  let url = '';
  if (urlElement && urlElement.textContent) {
    // 清理 URL 文本，移除特殊字符和多余空格
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
function filterResults() {
  chrome.storage.local.get(['sites'], (data) => {
    const sites = data.sites || [];
    const engine = getCurrentEngine();
    const results = document.querySelectorAll(engine.resultSelector);

    results.forEach(result => {
      const url = extractUrl(result);
      if (!url) return;

      // 清除之前的高亮和屏蔽效果
      result.style.removeProperty('display');
      result.style.removeProperty('background-color');

      sites.forEach(site => {
        if (matchDomain(url, site.url)) {
          if (site.blocked) {
            result.style.setProperty('display', 'none', 'important');
          } else {
            result.style.removeProperty('display');
            result.style.setProperty('background-color', site.color, 'important');
          }
          return; // 找到匹配的网站后跳出循环
        }
      });
    });
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

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(filterResults, 100);
  };

  history.replaceState = function() {
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
      console.log('URL changed:', currentUrl);
      setTimeout(filterResults, 100);
    }
  }, 1000); // 每1000ms检查一次
}

/**
 * 初始化
 */
function initialize() {
  console.log('Content script initialized');
  
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
  if (message.type === 'updateHighlightColor') {
    if (message.url) {
      // 更新特定网站的高亮颜色
      updateSiteHighlight(message.url, message.color);
    } else {
      // 更新全局高亮颜色
      updateHighlightStyle(message.color);
    }
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