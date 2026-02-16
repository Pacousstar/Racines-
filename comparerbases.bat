@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ========================================
echo   COMPARAISON DES BASES DE DONNÉES
echo ========================================
echo.

set "PROD_DB=C:\gesticom\gesticom.db"
set "LOCAL_DB=%~dp0prisma\gesticom.db"
set "PORTABLE_DB=%~dp0GestiCom-Portable\data\gesticom.db"

REM Vérifier l'existence des bases
set "bases_trouvees=0"

if exist "%PROD_DB%" (
    set /a bases_trouvees+=1
    for %%A in ("%PROD_DB%") do set "PROD_SIZE=%%~zA"
    for %%A in ("%PROD_DB%") do set "PROD_DATE=%%~tA"
    echo [✓] PRODUCTION : trouvee
) else (
    echo [✗] PRODUCTION : introuvable
    set "PROD_SIZE=0"
    set "PROD_DATE=N/A"
)

if exist "%LOCAL_DB%" (
    set /a bases_trouvees+=1
    for %%A in ("%LOCAL_DB%") do set "LOCAL_SIZE=%%~zA"
    for %%A in ("%LOCAL_DB%") do set "LOCAL_DATE=%%~tA"
    echo [✓] LOCALE : trouvee
) else (
    echo [✗] LOCALE : introuvable
    set "LOCAL_SIZE=0"
    set "LOCAL_DATE=N/A"
)

if exist "%PORTABLE_DB%" (
    set /a bases_trouvees+=1
    for %%A in ("%PORTABLE_DB%") do set "PORTABLE_SIZE=%%~zA"
    for %%A in ("%PORTABLE_DB%") do set "PORTABLE_DATE=%%~tA"
    echo [✓] PORTABLE : trouvee
) else (
    echo [✗] PORTABLE : introuvable
    set "PORTABLE_SIZE=0"
    set "PORTABLE_DATE=N/A"
)

echo.
echo ========================================
echo   DÉTAILS DE COMPARAISON
echo ========================================
echo.
echo PRODUCTION :
echo   Taille : !PROD_SIZE! octets
echo   Modifié : !PROD_DATE!
echo.
echo LOCALE :
echo   Taille : !LOCAL_SIZE! octets
echo   Modifié : !LOCAL_DATE!
echo.
echo PORTABLE :
echo   Taille : !PORTABLE_SIZE! octets
echo   Modifié : !PORTABLE_DATE!
echo.

REM Analyse de synchronisation
echo ========================================
echo   ANALYSE DE SYNCHRONISATION
echo ========================================
echo.

call :compare_sizes !PROD_SIZE! !PORTABLE_SIZE! PORTABLE

echo.

call :compare_sizes !PROD_SIZE! !LOCAL_SIZE! LOCALE

echo.
echo ========================================
pause
exit /b 0

:compare_sizes
if "%1" EQU "%2" (
    echo [✓] %3 = PRODUCTION tailles identiques
) else (
    echo [!] %3 different de PRODUCTION tailles differentes
    if "%3" EQU "PORTABLE" echo     Executez fixerbaseportable.bat pour synchroniser
)
exit /b 0
