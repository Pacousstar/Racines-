@echo off
echo ========================================
echo   Demarrage de GestiCom
echo ========================================
echo.

REM Recharger le PATH pour inclure Node.js
set "PATH=%PATH%;C:\Program Files\nodejs"
if exist "%LOCALAPPDATA%\nodejs" set "PATH=%PATH%;%LOCALAPPDATA%\nodejs"

REM Aller dans le dossier du projet
cd /d "%~dp0"

REM Vérifier que Node.js est disponible
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js n'est pas trouve dans le PATH
    echo Verifiez que Node.js est installe
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.
echo Demarrage de GestiCom...
echo L'application sera accessible sur: http://localhost:3000
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
echo ========================================
echo.

REM Lancer l'application
call npm run dev

pause
