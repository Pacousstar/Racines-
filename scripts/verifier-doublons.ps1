$json = Get-Content "$PSScriptRoot\..\docs\doublons-produits.json" | ConvertFrom-Json
Write-Host "Nombre de designations en doublon: $($json.Count)"
$total = ($json | ForEach-Object { $_.nombreOccurrences } | Measure-Object -Sum).Sum
Write-Host "Total occurrences (incluant originaux): $total"
