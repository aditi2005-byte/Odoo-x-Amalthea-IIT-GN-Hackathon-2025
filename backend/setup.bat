@echo off
echo Cleaning up previous installation...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Installing dependencies...
call npm install

echo Creating uploads directory...
mkdir uploads 2>nul

echo Starting server...
node server.js

pause