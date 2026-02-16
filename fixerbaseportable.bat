@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ========================================
echo   CORRECTION BASE PORTABLE
echo ========================================
echo.
echo Ce script va :
echo 1. Copier la base de PRODUCTION vers le PORTABLE
echo 2. S'assurer que la base portable est à jour
echo.

REM Vérifier que la base de production existe
if not exist "C:\gesticom\gesticom.db" (
    echo [✗] ERREUR : Base de production introuvable : C:\gesticom\gesticom.db
    echo.
    echo Veuillez d'abord vous assurer que la base de production existe.
    pause
    exit /b 1
)

REM Créer le dossier portable/data si nécessaire
set "PORTABLE_DIR=%~dp0GestiCom-Portable\data"
if not exist "%PORTABLE_DIR%" (
    echo [i] Création du dossier : %PORTABLE_DIR%
    mkdir "%PORTABLE_DIR%"
)

REM Copier la base de production vers le portable
echo [i] Copie de la base de production vers le portable...
copy /Y "C:\gesticom\gesticom.db" "%PORTABLE_DIR%\gesticom.db" >nul

if %ERRORLEVEL% EQU 0 (
    echo [✓] Base portable mise à jour avec succès !
    echo.
    echo Détails de la base portable :
    for %%A in ("%PORTABLE_DIR%\gesticom.db") do (
        echo     Chemin : %%~fA
        echo     Taille : %%~zA octets
        echo     Modifié : %%~tA
    )
) else (
    echo [✗] ERREUR lors de la copie de la base de données
    pause
    exit /b 1
)

echo.
echo ========================================
echo   CORRECTION TERMINÉE
echo ========================================
echo.
echo Vous pouvez maintenant :
echo - Lancer : npm run build:portable
echo - Packager : npm run package:portable
echo.
pause
