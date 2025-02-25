@echo off
:: Get version from manifest.json
for /f "tokens=2 delims=:" %%a in ('findstr "version" manifest.json') do (
  set VERSION=%%a
)
:: Remove quotes and comma
set VERSION=%VERSION:"=%
set VERSION=%VERSION:,=%
:: Trim spaces
set VERSION=%VERSION: =%

set PACKAGE_NAME=zen-search-v%VERSION%-edge

echo Building ZenSearch for edge...

:: Create build directory
if not exist "build\edge" mkdir build\edge

:: Clean previous build
if exist "build\%PACKAGE_NAME%.zip" del /f /q "build\%PACKAGE_NAME%.zip"

:: Create temp directory
if exist "build\edge" rd /s /q "build\edge"
mkdir "build\edge"

:: Copy files
echo Copying files...
xcopy /y /i /e "node_modules\@simonwep\pickr\dist" "build\edge\node_modules\@simonwep\pickr\dist\"
xcopy /y /i /e _locales "build\edge\_locales\"
xcopy /y /i /e icons "build\edge\icons\"
copy /y background.js "build\edge\"
copy /y content.js "build\edge\"
copy /y donate.html "build\edge\"
copy /y donate.js "build\edge\"
copy /y i18n.js "build\edge\"
copy /y LICENSE "build\edge\"
copy /y manifest.json "build\edge\manifest.json"
copy /y popup.html "build\edge\"
copy /y popup.js "build\edge\"
copy /y settings.html "build\edge\"
copy /y settings.js "build\edge\"
copy /y styles.css "build\edge\"
copy /y README.md "build\edge\"

:: Create zip
cd build\edge
powershell Compress-Archive -Path * -DestinationPath ..\%PACKAGE_NAME%.zip -Force
copy "%PACKAGE_NAME%.zip" ..\
cd ..\..\

:: Clean up
@REM rd /s /q "build\edge"

echo Build completed: build\%PACKAGE_NAME%.zip 