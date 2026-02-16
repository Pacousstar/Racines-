@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo ========================================
echo   AFFICHAGE DES BASES DE DONNÉES
echo ========================================
echo.

REM Base de production
if exist "C:\gesticom\gesticom.db" (
    echo [✓] Base de PRODUCTION : C:\gesticom\gesticom.db
    for %%A in ("C:\gesticom\gesticom.db") do echo     Taille : %%~zA octets
    for %%A in ("C:\gesticom\gesticom.db") do echo     Modifie : %%~tA
) else (
    echo [✗] Base de PRODUCTION : C:\gesticom\gesticom.db INTROUVABLE
)

echo.

REM Base locale du projet
set "LOCAL_DB=%~dp0prisma\gesticom.db"
if exist "%LOCAL_DB%" (
    echo [✓] Base LOCALE projet : %LOCAL_DB%
    for %%A in ("%LOCAL_DB%") do echo     Taille : %%~zA octets
    for %%A in ("%LOCAL_DB%") do echo     Modifie : %%~tA
) else (
    echo [✗] Base LOCALE projet : %LOCAL_DB% INTROUVABLE
)

echo.

REM Base portable
set "PORTABLE_DB=%~dp0GestiCom-Portable\data\gesticom.db"
if exist "%PORTABLE_DB%" (
    echo [✓] Base PORTABLE : %PORTABLE_DB%
    for %%A in ("%PORTABLE_DB%") do echo     Taille : %%~zA octets
    for %%A in ("%PORTABLE_DB%") do echo     Modifie : %%~tA
) else (
    echo [✗] Base PORTABLE : %PORTABLE_DB% INTROUVABLE
)

echo.
echo ========================================
pause
