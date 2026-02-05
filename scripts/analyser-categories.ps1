# Script PowerShell pour analyser les catégories
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\.."

$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExe) {
    & $nodeExe.Source scripts/analyser-categories.js
} else {
    Write-Host "ERREUR: Node.js introuvable" -ForegroundColor Red
    exit 1
}
