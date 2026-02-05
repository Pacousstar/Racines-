@echo off
REM Script pour créer la version portable complète de GestiCom
REM À lancer depuis la racine du projet (dossier contenant package.json)

echo ========================================
echo   CREATION GESTICOM PORTABLE
echo ========================================
echo.

REM Vérifier qu'on est dans le bon dossier
if not exist "package.json" (
    echo ERREUR: Ce script doit etre lance depuis la racine du projet GestiCom
    echo (dossier contenant package.json)
    pause
    exit /b 1
)

echo [1/4] Construction de la version portable...
call npm run build:portable
if errorlevel 1 (
    echo ERREUR lors du build portable
    pause
    exit /b 1
)
echo.

echo [2/4] Verification des fichiers...
if not exist "GestiCom-Portable\Lancer.bat" (
    echo ERREUR: GestiCom-Portable\Lancer.bat introuvable
    pause
    exit /b 1
)
if not exist "GestiCom-Portable\data\gesticom.db" (
    echo ERREUR: GestiCom-Portable\data\gesticom.db introuvable
    pause
    exit /b 1
)
echo   OK: Fichiers essentiels presents
echo.

echo [3/4] Verification de node.exe...
if not exist "GestiCom-Portable\node.exe" (
    echo.
    echo ATTENTION: node.exe manquant dans GestiCom-Portable
    echo.
    echo Pour ajouter node.exe:
    echo 1. Telechargez Node.js LTS (zip Windows) depuis:
    echo    https://nodejs.org/dist/
    echo 2. Extrayez node.exe dans le dossier GestiCom-Portable
    echo.
    set /p CONTINUER="Continuer quand meme? (O/N): "
    if /i not "%CONTINUER%"=="O" exit /b 1
) else (
    echo   OK: node.exe present
)
echo.

echo [4/4] Copie du guide d'installation...
if exist "docs\GUIDE_INSTALLATION_PORTABLE.md" (
    copy "docs\GUIDE_INSTALLATION_PORTABLE.md" "GestiCom-Portable\" >nul
    echo   OK: Guide d'installation copie
) else (
    echo   ATTENTION: Guide d'installation non trouve
)
echo.

echo ========================================
echo   VERSION PORTABLE CREE AVEC SUCCES
echo ========================================
echo.
echo Dossier: GestiCom-Portable
echo.
echo Prochaines etapes:
echo 1. Verifier que node.exe est present dans GestiCom-Portable
echo 2. Tester le lancement: double-clic sur GestiCom-Portable\Lancer.vbs
echo 3. Copier le dossier GestiCom-Portable sur clé USB ou autre PC
echo.
pause
