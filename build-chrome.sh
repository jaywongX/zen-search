#!/bin/bash

# Get version from manifest.json
VERSION=$(grep -Po '"version": "\K[^"]*' manifest.json)
PACKAGE_NAME="zen-search-v${VERSION}-chrome"

echo "Building ZenSearch for Chrome..."

# Create build directory
mkdir -p "build/chrome"

# Clean previous build
rm -f "build/${PACKAGE_NAME}.zip"
rm -rf "build/chrome"
mkdir -p "build/chrome"

# Copy files
echo "Copying files..."
cp -r "node_modules/@simonwep/pickr/dist" "build/chrome/node_modules/@simonwep/pickr/"
cp -r "_locales" "build/chrome/"
cp -r "icons" "build/chrome/"
cp background.js "build/chrome/"
cp content.js "build/chrome/"
cp donate.html "build/chrome/"
cp donate.js "build/chrome/"
cp i18n.js "build/chrome/"
cp LICENSE "build/chrome/"
cp manifest.json "build/chrome/"
cp popup.html "build/chrome/"
cp popup.js "build/chrome/"
cp settings.html "build/chrome/"
cp settings.js "build/chrome/"
cp styles.css "build/chrome/"
cp README.md "build/chrome/"

# Create zip
cd build/chrome
zip -r "../${PACKAGE_NAME}.zip" *
cd ../..

# Clean up
# rm -rf "build/chrome"

echo "Build completed: build/${PACKAGE_NAME}.zip" 