@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ========================================
echo   RESTAURATION BASE DE PRODUCTION
echo ========================================
echo.

set "BACKUP_DIR=C:\gesticom\backups"
set "PROD_DB=C:\gesticom\gesticom.db"

REM Vérifier que le dossier de sauvegardes existe
if not exist "%BACKUP_DIR%" (
    echo [✗] ERREUR : Dossier de sauvegardes introuvable : %BACKUP_DIR%
    echo.
    echo Aucune sauvegarde disponible.
    pause
    exit /b 1
)

REM Lister les sauvegardes disponibles
echo Sauvegardes disponibles :
echo.
set count=0
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\gesticom_*.db" 2^>nul') do (
    set /a count+=1
    echo !count!. %%f
)

if %count% EQU 0 (
    echo [✗] Aucune sauvegarde trouvée dans %BACKUP_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo.
set /p choice="Entrez le numéro de la sauvegarde à restaurer (1-%count%) : "

REM Valider le choix
if "%choice%"=="" (
    echo [✗] Choix invalide
    pause
    exit /b 1
)

REM Récupérer le fichier sélectionné
set current=0
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\gesticom_*.db"') do (
    set /a current+=1
    if !current! EQU %choice% (
        set "SELECTED_FILE=%%f"
    )
)

if not defined SELECTED_FILE (
    echo [✗] Choix invalide
    pause
    exit /b 1
)

echo.
echo [i] Fichier sélectionné : %SELECTED_FILE%
echo.
echo ATTENTION : Cette opération va remplacer la base de production actuelle !
set /p confirm="Confirmez-vous la restauration ? (O/N) : "

if /i not "%confirm%"=="O" (
    echo [i] Restauration annulée
    pause
    exit /b 0
)

REM Sauvegarder la base actuelle avant restauration
if exist "%PROD_DB%" (
    echo [i] Sauvegarde de la base actuelle avant restauration...
    copy /Y "%PROD_DB%" "%BACKUP_DIR%\gesticom_avant_restauration.db" >nul
)

REM Restaurer la sauvegarde sélectionnée
echo [i] Restauration en cours...
copy /Y "%BACKUP_DIR%\%SELECTED_FILE%" "%PROD_DB%" >nul

if %ERRORLEVEL% EQU 0 (
    echo [✓] Restauration reussie !
    echo.
    for %%A in ("%PROD_DB%") do echo     Chemin : %%~fA
    for %%A in ("%PROD_DB%") do echo     Taille : %%~zA octets
    for %%A in ("%PROD_DB%") do echo     Modifie : %%~tA
) else (
    echo [✗] ERREUR lors de la restauration
    pause
    exit /b 1
)

echo.
echo ========================================
pause
