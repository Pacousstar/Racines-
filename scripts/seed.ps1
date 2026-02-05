# Script PowerShell pour exécuter le seed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\.."

$npmExe = Get-Command npm -ErrorAction SilentlyContinue
if ($npmExe) {
    & $npmExe.Source run db:seed
} else {
    Write-Host "ERREUR: npm introuvable" -ForegroundColor Red
    exit 1
}
