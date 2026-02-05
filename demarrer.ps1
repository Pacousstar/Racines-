# Script de démarrage GestiCom
# Recharge le PATH et lance l'application

# Recharger le PATH utilisateur
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Aller dans le dossier du projet
Set-Location "C:\Users\EMERAUDE\Projets\GestiCom-master"

# Vérifier que Node.js est disponible
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: Node.js n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host "Vérifiez que Node.js est installé dans: $env:LOCALAPPDATA\nodejs" -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js version: $(node --version)" -ForegroundColor Green
Write-Host "npm version: $(npm --version)" -ForegroundColor Green
Write-Host ""
Write-Host "Démarrage de GestiCom..." -ForegroundColor Cyan
Write-Host "L'application sera accessible sur: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
Write-Host ""

# Lancer l'application
npm run dev
