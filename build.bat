@echo off
echo Building ZenSearch extension...

:: Create build directory if not exists
if not exist "build" mkdir build

:: Clean previous build
if exist "build\zen-search.zip" del /f /q "build\zen-search.zip"

:: Create temp directory
if exist "build\temp" rd /s /q "build\temp"
mkdir "build\temp"

:: Copy necessary files
echo Copying files...
xcopy /y manifest.json "build\temp\"
xcopy /y content.js "build\temp\"
xcopy /y popup.html "build\temp\"
xcopy /y popup.js "build\temp\"
xcopy /y settings.html "build\temp\"
xcopy /y settings.js "build\temp\"
xcopy /y styles.css "build\temp\"
xcopy /y i18n.js "build\temp\"
xcopy /y LICENSE "build\temp\"
xcopy /y /i /e _locales "build\temp\_locales\"
xcopy /y /i /e icons "build\temp\icons\"

:: Create zip file
echo Creating zip file...
cd build\temp
powershell Compress-Archive -Path * -DestinationPath ..\zen-search.zip -Force
cd ..\..

:: Clean up
rd /s /q "build\temp"

echo Build completed: build\zen-search.zip 