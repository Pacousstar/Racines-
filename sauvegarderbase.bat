@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ========================================
echo   SAUVEGARDE BASE DE PRODUCTION
echo ========================================
echo.

REM Vérifier que la base de production existe
if not exist "C:\gesticom\gesticom.db" (
    echo [✗] ERREUR : Base de production introuvable : C:\gesticom\gesticom.db
    pause
    exit /b 1
)

REM Créer le dossier de sauvegardes si nécessaire
set "BACKUP_DIR=C:\gesticom\backups"
if not exist "%BACKUP_DIR%" (
    echo [i] Création du dossier de sauvegardes : %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM Générer le nom de fichier avec date et heure
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a-%%b
set BACKUP_FILE=%BACKUP_DIR%\gesticom_%mydate%_%mytime::=-%.db

echo [i] Création de la sauvegarde...
copy /Y "C:\gesticom\gesticom.db" "%BACKUP_FILE%" >nul

if %ERRORLEVEL% EQU 0 (
    echo [✓] Sauvegarde créée avec succès !
    echo.
    for %%A in ("%BACKUP_FILE%") do echo     Fichier : %%~nxA
    for %%A in ("%BACKUP_FILE%") do echo     Chemin : %%~fA
    for %%A in ("%BACKUP_FILE%") do echo     Taille : %%~zA octets
    echo.
    echo [i] Nettoyage des anciennes sauvegardes conservees: 10 dernieres...
    call :cleanup_backups
) else (
    echo [✗] ERREUR lors de la création de la sauvegarde
    pause
    exit /b 1
)

echo.
echo ========================================
pause
exit /b 0

:cleanup_backups
set count=0
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\gesticom_*.db" 2^>nul') do (
    set /a count+=1
    if !count! GTR 10 (
        del "%BACKUP_DIR%\%%f" >nul 2>&1
        echo     Supprime : %%f
    )
)
exit /b 0
