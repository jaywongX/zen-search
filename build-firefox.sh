#!/bin/bash

# Get version from manifest.json
VERSION=$(grep -Po '"version": "\K[^"]*' manifest.json)
PACKAGE_NAME="zen-search-v${VERSION}-firefox"

echo "Building ZenSearch for Firefox..."

# Create build directory
mkdir -p "build/firefox"

# Clean previous build
rm -f "build/${PACKAGE_NAME}.zip"
rm -rf "build/firefox"
mkdir -p "build/firefox"

# Copy files
echo "Copying files..."
cp -r "node_modules/@simonwep/pickr/dist" "build/firefox/node_modules/@simonwep/pickr/"
cp -r "_locales" "build/firefox/"
cp -r "icons" "build/firefox/"
cp background.js "build/firefox/"
cp content.js "build/firefox/"
cp donate.html "build/firefox/"
cp donate.js "build/firefox/"
cp i18n.js "build/firefox/"
cp LICENSE "build/firefox/"
cp manifest.firefox.json "build/firefox/manifest.json"
cp popup.html "build/firefox/"
cp popup.js "build/firefox/"
cp settings.html "build/firefox/"
cp settings.js "build/firefox/"
cp styles.css "build/firefox/"
cp README.md "build/firefox/"

# Create zip
cd build/firefox
zip -r "../${PACKAGE_NAME}.zip" *
cd ../..

# Clean up
# rm -rf "build/firefox"

echo "Build completed: build/${PACKAGE_NAME}.zip" 