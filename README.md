# ZenSearch - Search in Peace

A browser extension that enhances search results by blocking unwanted sites and highlighting trusted sources.

## Features

- 🚫 Block unwanted websites from search results
- 🌈 Highlight favorite websites with custom colors
- 🔍 Support for multiple search engines:
   - Google
   - Bing
   - DuckDuckGo
   - Yahoo
   - Yahoo Japan
   - Yandex (yandex.com & yandex.ru)
   - Startpage
   - Ecosia
   - Ask
   - AOL
   - Naver
   - Brave Search
   - OneSearch
   - SearX (multiple instances)
   - Qwant
   - And more...
- 🎨 Customizable highlight colors
- 🌐 Support for multiple languages
- ⌨️ Keyboard shortcut (Alt+H) to quickly hide results
- 🔄 Real-time updates without page reload
- 📌 Pin important sites to the top

## Installation

### Chrome Web Store
1. Visit [ZenSearch on Chrome Web Store]()
2. Click "Add to Chrome"
3. Follow the installation prompts

### Firefox Add-ons
1. Visit [ZenSearch on Firefox Add-ons]()
2. Click "Add to Firefox"
3. Follow the installation prompts

### Manual Installation (Development)

#### Chrome
1. Clone this repository
2. Run `npm install`
3. Run `build-chrome.bat` (Windows) or `build-chrome.sh` (Linux/Mac)
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `build/chrome` directory

#### Firefox
1. Clone this repository
2. Run `npm install`
3. Run `build-firefox.bat` (Windows) or `build-firefox.sh` (Linux/Mac)
4. Open Firefox and go to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on" and select `build/firefox/manifest.json`

## Usage

1. Click the ZenSearch icon in your browser toolbar
2. Add websites to block or highlight:
   - Enter the domain pattern (e.g., `*://*.example.com/*`)
   - Use the block/highlight toggle
   - Choose a custom color for highlighting
   - Pin important sites to the top
3. Right-click on any search result to quickly block or highlight its domain
4. Use Alt+H to hide the currently hovered search result

## Development

### Project Structure 