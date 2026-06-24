$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dist = Join-Path $root "dist"
$output = Join-Path $root "dist-crazygames"
$staleZip = Join-Path $root "bamboo-slicer-crazygames.zip"
$index = Join-Path $dist "index.html"

if (-not (Test-Path -LiteralPath $index)) {
  throw "dist/index.html was not found. Run npm run build before packaging for CrazyGames."
}

$indexHtml = Get-Content -LiteralPath $index -Raw
if ($indexHtml -notmatch "crazygames-sdk-v3\.js") {
  throw "CrazyGames SDK v3 script was not found in dist/index.html."
}
if ($indexHtml -match "fonts\.googleapis\.com") {
  throw "CrazyGames package still references Google Fonts. Use bundled or fallback fonts only."
}

$assetRefs = [regex]::Matches($indexHtml, '(?:src|href)="\.\/([^"]+)"') |
  ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique

foreach ($assetRef in $assetRefs) {
  $assetPath = Join-Path $dist ($assetRef -replace "/", "\")
  if (-not (Test-Path -LiteralPath $assetPath)) {
    throw "CrazyGames package references a missing asset: $assetRef"
  }
}

$distRoot = (Resolve-Path $dist).Path.TrimEnd("\", "/")
$files = @(Get-ChildItem -LiteralPath $dist -File -Recurse | Sort-Object FullName)

if ($files.Count -eq 0) {
  throw "dist is empty. Run npm run build before packaging for CrazyGames."
}

$resolvedRoot = (Resolve-Path $root).Path.TrimEnd("\", "/")
if (Test-Path -LiteralPath $output) {
  $resolvedOutput = (Resolve-Path $output).Path.TrimEnd("\", "/")
  if (-not ($resolvedOutput.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "Refusing to remove CrazyGames export outside the project: $resolvedOutput"
  }
  Remove-Item -LiteralPath $output -Recurse -Force
}

New-Item -ItemType Directory -Path $output | Out-Null
Copy-Item -Path (Join-Path $dist "*") -Destination $output -Recurse -Force

$outputIndex = Join-Path $output "index.html"
if (-not (Test-Path -LiteralPath $outputIndex)) {
  throw "CrazyGames folder is missing index.html at the folder root."
}

if (Test-Path -LiteralPath $staleZip) {
  Remove-Item -LiteralPath $staleZip -Force
}

$outputFiles = @(Get-ChildItem -LiteralPath $output -File -Recurse | Sort-Object FullName)
Write-Host "Created CrazyGames upload folder: $output with $($outputFiles.Count) files."
