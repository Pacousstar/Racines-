# Script PowerShell pour corriger les stocks
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\.."

$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExe) {
    & $nodeExe.Source scripts/corriger-stocks-reel.js
} else {
    Write-Host "ERREUR: Node.js introuvable" -ForegroundColor Red
    exit 1
}
