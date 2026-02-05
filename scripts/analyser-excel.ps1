# Script PowerShell pour analyser le fichier Excel
# Charge le PATH et exécute le script Node.js

# Recharger le PATH utilisateur
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Aller dans le dossier du projet
Set-Location "$PSScriptRoot\.."

# Chercher node dans les emplacements possibles
$nodePaths = @(
    "$env:LOCALAPPDATA\nodejs\node-v20.11.1-win-x64\node.exe",
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles(x86)\nodejs\node.exe"
)

$nodeExe = $null
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = $path
        break
    }
}

if (-not $nodeExe) {
    # Essayer de trouver node dans le PATH
    $nodeExe = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeExe) {
        $nodeExe = $nodeExe.Source
    }
}

if (-not $nodeExe) {
    Write-Host "ERREUR: Node.js introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "Utilisation de Node.js: $nodeExe" -ForegroundColor Green
Write-Host ""

& $nodeExe scripts/analyser-excel.js
