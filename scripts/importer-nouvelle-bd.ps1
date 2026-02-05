# Script PowerShell pour importer la nouvelle base de données
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\.."

$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExe) {
    & $nodeExe.Source scripts/importer-nouvelle-bd.js
} else {
    Write-Host "ERREUR: Node.js introuvable" -ForegroundColor Red
    exit 1
}
