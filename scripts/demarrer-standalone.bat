@echo off
cd /d "%~dp0.."
echo Demarrage de GestiCom (standalone)...
echo.
node scripts/standalone-launcher.js
pause
