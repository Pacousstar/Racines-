@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
:menu
cls
echo ========================================
echo   GESTION DES BASES DE DONNÉES
echo   GestiCom - DG DIHI
echo ========================================
echo.
echo 1. Afficher l'état des bases
echo 2. Comparer les bases
echo 3. Sauvegarder la base de production
echo 4. Restaurer une sauvegarde
echo 5. Fixer/Mettre à jour la base portable
echo.
echo 6. Build portable
echo 7. Package portable (créer ZIP)
echo 8. Build + Package (tout-en-un)
echo.
echo 0. Quitter
echo.
echo ========================================
set /p choice="Votre choix : "

if "%choice%"=="1" (
    call afficherbase.bat
    goto menu
)
if "%choice%"=="2" (
    call comparerbases.bat
    goto menu
)
if "%choice%"=="3" (
    call sauvegarderbase.bat
    goto menu
)
if "%choice%"=="4" (
    call restaurerbase.bat
    goto menu
)
if "%choice%"=="5" (
    call fixerbaseportable.bat
    goto menu
)
if "%choice%"=="6" (
    cls
    echo [i] Lancement du build portable...
    call npm run build:portable
    echo.
    pause
    goto menu
)
if "%choice%"=="7" (
    cls
    echo [i] Création du package ZIP...
    call npm run package:portable
    echo.
    pause
    goto menu
)
if "%choice%"=="8" (
    cls
    echo [i] Build + Package complet...
    echo.
    echo Étape 1/3 : Mise à jour de la base portable
    call fixerbaseportable.bat
    echo.
    echo Étape 2/3 : Build portable
    call npm run build:portable
    echo.
    echo Étape 3/3 : Création du ZIP
    call npm run package:portable
    echo.
    echo [✓] Processus complet terminé !
    pause
    goto menu
)
if "%choice%"=="0" (
    exit
)

echo [✗] Choix invalide
timeout /t 2 >nul
goto menu
