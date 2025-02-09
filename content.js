/**
 * 搜索引擎配置模块
 * 为不同的搜索引擎定义DOM选择器和特征
 */
const SEARCH_ENGINES = {
  google: {
    host: 'www.google.com',          // 搜索引擎的域名
    resultSelector: '#search .g',     // 搜索结果条目的CSS选择器
    containerSelector: '#rso',        // 搜索结果容器的CSS选择器
    linkSelector: 'a',               // 结果链接的CSS选择器
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
  console.log('Current search engine:', engine); // 当前搜索引擎
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
 * 创建操作栏
 * @param {HTMLElement} result - 搜索结果元素
 * @returns {HTMLElement} 创建的操作栏元素
 */
function createActionBar(result) {
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  
  // 添加操作按钮
  actions.innerHTML = `
    <button class="action-btn favorite" data-action="favorite">
      <span>❤️ 偏好</span>
    </button>
    <button class="action-btn block" data-action="block">
      <span>🚫 屏蔽</span>
    </button>
  `;
  
  // 绑定点击事件
  actions.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const url = extractUrl(result);
      console.log('Button clicked:', { action, url }); 
      if (url) {
        handleResultAction(url, action);
      }
    });
  });
  
  return actions;
}

/**
 * 从搜索结果中提取URL
 * @param {HTMLElement} result - 搜索结果元素
 * @returns {string|null} 提取的URL
 */
function extractUrl(result) {
  const engine = getCurrentEngine();
  let url = result.querySelector(engine.urlSelector)?.textContent;
  
  // Bing搜索结果特殊处理
  if (engine.host === 'www.bing.com' && !url) {
    const link = result.querySelector(engine.linkSelector);
    url = link?.href;
  }
  
  return url;
}

/**
 * 规范化域名
 * @param {string} url - 输入的URL或域名
 * @returns {string} 规范化后的域名
 */
function normalizeDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return url.toLowerCase().replace(/^www\./, '');
  }
}

/**
 * 检查域名是否匹配
 * @param {string} pattern - 匹配模式
 * @param {string} domain - 要检查的域名
 * @returns {boolean} 是否匹配
 */
function isDomainMatch(pattern, domain) {
  try {
    const normalizedPattern = pattern.toLowerCase().replace(/^www\./, '');
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    
    // 如果是正则表达式
    if (pattern.includes('*') || pattern.includes('.+') || pattern.includes('.*')) {
      const regex = new RegExp(normalizedPattern);
      return regex.test(normalizedDomain);
    }
    
    // 普通域名匹配
    return normalizedDomain.includes(normalizedPattern) || 
           normalizedPattern.includes(normalizedDomain);
  } catch (e) {
    return false;
  }
}

/**
 * 处理结果操作
 * @param {string} domain - 域名
 * @param {string} action - 操作类型 ('favorite' 或 'block')
 */
function handleResultAction(domain, action) {
  console.log('Handling result action:', { domain, action }); // 处理操作
  const normalizedDomain = normalizeDomain(domain);
  
  // 获取存储的数据
  chrome.storage.local.get(['favorites', 'blocked'], (data) => {
    console.log('Current storage:', data); // 当前存储状态
    const favorites = data.favorites || [];
    const blocked = data.blocked || [];

    // 检查是否已存在
    const isInFavorites = favorites.some(d => isDomainMatch(d, normalizedDomain));
    const isInBlocked = blocked.some(d => isDomainMatch(d, normalizedDomain));

    if (action === 'favorite' && isInFavorites) {
      showToast(`${normalizedDomain} 已在偏好列表中`);
      return;
    }
    
    if (action === 'block' && isInBlocked) {
      showToast(`${normalizedDomain} 已在屏蔽列表中`);
      return;
    }

    // 从所有列表中移除相关域名
    const newFavorites = favorites.filter(d => !isDomainMatch(d, normalizedDomain));
    const newBlocked = blocked.filter(d => !isDomainMatch(d, normalizedDomain));

    // 添加到新列表
    if (action === 'favorite') {
      newFavorites.push(normalizedDomain);
      showToast(`已将 ${normalizedDomain} 添加到偏好网站`);
    } else if (action === 'block') {
      newBlocked.push(normalizedDomain);
      showToast(`已屏蔽 ${normalizedDomain}`);
    }

    // 保存更新
    chrome.storage.local.set({ 
      favorites: newFavorites, 
      blocked: newBlocked 
    }, () => {
      console.log('Storage updated:', { favorites, blocked }); // 存储更新
      filterResults();
    });
  });
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
 * 更新增强搜索结果函数
 * @param {HTMLElement} result - 搜索结果元素
 */
function enhanceSearchResult(result) {
  console.log('Enhancing search result:', result); // 处理的搜索结果
  result.classList.add('search-result');
  
  // 添加操作栏
  const actionBar = createActionBar(result);
  
  // 针对Bing搜索结果的特殊处理
  if (getCurrentEngine().host === 'www.bing.com') {
    // 直接添加到结果容器中
    result.style.position = 'relative';
    result.appendChild(actionBar);
  } else {
    result.appendChild(actionBar);
  }
  
  // 根据URL判断状态
  const url = extractUrl(result);
  if (url) {
    const domain = normalizeDomain(url);
    chrome.storage.local.get(['favorites', 'blocked'], (data) => {
      const favorites = data.favorites || [];
      const blocked = data.blocked || [];
      
      if (favorites.some(d => isDomainMatch(d, domain))) {
        result.classList.add('result-favorite');
      } else if (blocked.some(d => isDomainMatch(d, domain))) {
        result.classList.add('result-blocked');
      }
    });
  }
}

/**
 * 检查URL是否匹配规则的函数
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
 * 根据好感度处理搜索结果的主函数
 */
function filterResults() {
  console.log('Filtering results...'); // 开始过滤
  chrome.storage.local.get(['favorites', 'blocked'], (rules) => {
    console.log('Filter rules:', rules); // 过滤规则
    const results = document.querySelectorAll(getCurrentEngine().resultSelector);
    console.log('Found results:', results); // 找到的结果

    results.forEach(result => {
      const url = extractUrl(result);
      if (!url) {
        console.warn('No URL found for result:', result); // URL提取失败
        return;
      }

      const domain = normalizeDomain(url);
      console.log('Processing result:', { url, domain }); // 处理结果
      
      // 检查每个规则
      rules.favorites.forEach(rule => {
        if (matchDomain(url, rule)) {
            // 添加高亮类
            result.classList.add('search-result-highlighted');
            console.log('Highlighted:', { url, domain });
        }
      });
      rules.blocked.forEach(rule => {
        if (matchDomain(url, rule)) {
            // 添加隐藏类
            result.classList.add('result-blocked');
            console.log('Blocked:', { url, domain });
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
 * 初始化
 */
function initialize() {
  console.log('Content script initialized'); // 脚本初始化
  chrome.storage.local.get(['stats'], (data) => {
    if (data.stats) {
      stats = data.stats;
      updateStatsDisplay();
    }
  });

  handleInfiniteScroll();
}

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

initialize(); 