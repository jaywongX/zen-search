// 定义语言包
const translations = {
  en: {
    extName: "ZenSearch - Search in Peace",
    searchPlaceholder: "Search sites...",
    sortByRating: "Sort by rating",
    sortByUrl: "Sort by URL",
    sortByBlocked: "Sort by Blocked",
    sortByColor: "Sort by Color",
    addSite: "Add",
    favorite: "Favorite",
    blocked: "Blocked",
    unblocked: "Unblocked",
    clearData: "Clear All Data",
    settings: "Settings",
    urlPlaceholder: "Enter domain, support regex",
    urlHint: "Examples: *://*.example.com/*",
    settingsTitle: "Settings",
    highlightColor: "Highlight Color",
    previewText: "This is how highlighted results will look",
    contextMenuFavorite: "Add to Favorites",
    contextMenuBlock: "Block this Site",
    addedToFavorites: "Added {domain} to favorites",
    siteBlocked: "Blocked {domain}",
    clearDataConfirm: "Are you sure you want to clear all data? This cannot be undone.",
    dataCleared: "All data has been cleared",
    urlUpdated: "Updated {oldUrl} to {newUrl}",
    ratingUpdated: "Updated rating for {url}",
    invalidUrl: "Please enter a valid URL or regex pattern",
    siteAdded: "Added {url}",
    top: "Top",
    untop: "Untop",
    delete: "Delete",
    back: "Back",
    reportIssue: "Report an Issue",
    proposeFeature: "Propose a New Feature",
    confirmHide: "Hide search results from {domain}?",
    confirm: "Confirm",
    cancel: "Cancel"
  },
  zh_CN: {
    extName: "ZenSearch - Search in Peace",
    searchPlaceholder: "搜索网站...",
    sortByRating: "按好感度排序",
    sortByUrl: "按网址排序",
    sortByBlocked: "按屏蔽排序",
    sortByColor: "按颜色排序",
    addSite: "添加",
    favorite: "偏好",
    blocked: "屏蔽",
    unblocked: "未屏蔽",
    clearData: "清除所有数据",
    settings: "设置",
    urlPlaceholder: "输入域名，支持正则表达式",
    urlHint: "示例: *://*.example.com/*",
    settingsTitle: "设置",
    highlightColor: "高亮颜色",
    previewText: "高亮结果将会是这个样子",
    contextMenuFavorite: "标记为偏好网站",
    contextMenuBlock: "屏蔽此网站",
    addedToFavorites: "已添加 {domain} 到偏好网站",
    siteBlocked: "已屏蔽 {domain}",
    clearDataConfirm: "确定要清除所有数据吗？此操作不可恢复。",
    dataCleared: "所有数据已清除",
    urlUpdated: "已更新 {oldUrl} 为 {newUrl}",
    ratingUpdated: "已更新 {url} 的好感度",
    invalidUrl: "请输入有效的URL或正则表达式",
    siteAdded: "已添加 {url}",
    top: "置顶",
    untop: "取消置顶",
    delete: "删除",
    back: "返回",
    reportIssue: "报告问题",
    proposeFeature: "提出新功能",
    confirmHide: "是否隐藏来自 {domain} 的搜索结果？",
    confirm: "确认",
    cancel: "取消"
  }
};

// 获取当前语言
function getCurrentLanguage() {
  // 改为返回 Promise
  return new Promise((resolve) => {
    chrome.storage.local.get(['language'], ({ language }) => {
      resolve(language || 'en');
    });
  });
}

// 获取翻译文本
function getMessage(key) {
  const lang = getCurrentLanguage();
  return translations[lang]?.[key] || translations.en[key];
}

// 更新界面语言
async function updateLanguage(lang) {
  // 使用 chrome.storage.local 存储语言设置
  await chrome.storage.local.set({ language: lang });

  // 更新界面文本
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = translations[lang]?.[key];
    if (message) {
      el.textContent = message;
    }
  });

  // 更新占位符文本
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const message = translations[lang]?.[key];
    if (message) {
      el.placeholder = message;
    }
  });

  // 更新右键菜单
  chrome.runtime.sendMessage({
    type: 'updateContextMenus',
    language: lang
  });
}

export { translations, getMessage, getCurrentLanguage, updateLanguage }; 