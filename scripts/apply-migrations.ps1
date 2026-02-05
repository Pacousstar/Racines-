# Script PowerShell pour appliquer les migrations Prisma
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "$PSScriptRoot\.."

$npmExe = Get-Command npm -ErrorAction SilentlyContinue
if ($npmExe) {
    & $npmExe.Source run db:push
} else {
    Write-Host "ERREUR: npm introuvable" -ForegroundColor Red
    exit 1
}
