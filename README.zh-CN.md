# ZenSearch - 搜索结果优化器

一个浏览器扩展，通过屏蔽不需要的网站和高亮显示可信来源来增强搜索结果。

## 功能特点

- 🚫 屏蔽不需要的网站搜索结果
- 🌈 使用自定义颜色高亮显示偏好网站
- 🔍 支持多个搜索引擎：
   - 谷歌
   - 必应
   - DuckDuckGo
   - 雅虎
   - 雅虎日本
   - Yandex (yandex.com 和 yandex.ru)
   - Startpage
   - Ecosia
   - Ask
   - AOL
   - Naver
   - Brave Search
   - OneSearch
   - SearX (多个实例)
   - Qwant
   - 以及更多...
- 🎨 可自定义高亮颜色
- 🌐 支持多语言
- ⌨️ 快捷键(Alt+H)快速隐藏结果
- 🔄 无需刷新页面的实时更新
- 📌 置顶重要网站

## 安装方法

### Chrome 应用商店
1. 访问 [Chrome 应用商店的 ZenSearch 页面]()
2. 点击"添加到 Chrome"
3. 按照提示完成安装

### Firefox 附加组件
1. 访问 [Firefox 附加组件的 ZenSearch 页面]()
2. 点击"添加到 Firefox"
3. 按照提示完成安装

### 手动安装（开发版）

#### Chrome
1. 克隆此仓库
2. 运行 `npm install`
3. 运行 `build-chrome.bat`（Windows）或 `build-chrome.sh`（Linux/Mac）
4. 打开 Chrome，访问 `chrome://extensions/`
5. 启用"开发者模式"
6. 点击"加载已解压的扩展程序"，选择 `build/chrome` 目录

#### Firefox
1. 克隆此仓库
2. 运行 `npm install`
3. 运行 `build-firefox.bat`（Windows）或 `build-firefox.sh`（Linux/Mac）
4. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`
5. 点击"临时载入附加组件"，选择 `build/firefox/manifest.json`

## 使用方法

1. 点击浏览器工具栏中的 ZenSearch 图标
2. 添加要屏蔽或高亮的网站：
   - 输入域名模式（例如：`*://*.example.com/*`）
   - 使用屏蔽/高亮开关
   - 为高亮选择自定义颜色
   - 置顶重要网站
3. 右键点击任何搜索结果，快速屏蔽或高亮其域名
4. 使用 Alt+H 快捷键隐藏当前悬停的搜索结果

## 开发相关

### 项目结构 