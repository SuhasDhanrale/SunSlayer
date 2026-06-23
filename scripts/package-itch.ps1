$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dist = Join-Path $root "dist"
$output = Join-Path $root "bamboo-slicer-itch.zip"
$index = Join-Path $dist "index.html"

if (-not (Test-Path -LiteralPath $index)) {
  throw "dist/index.html was not found. Run npm run build before packaging for itch.io."
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path -LiteralPath $output) {
  Remove-Item -LiteralPath $output -Force
}

$distRoot = (Resolve-Path $dist).Path.TrimEnd("\", "/")
$files = @(Get-ChildItem -LiteralPath $dist -File -Recurse | Sort-Object FullName)

if ($files.Count -eq 0) {
  throw "dist is empty. Run npm run build before packaging for itch.io."
}

$zip = [System.IO.Compression.ZipFile]::Open($output, [System.IO.Compression.ZipArchiveMode]::Create)

try {
  foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($distRoot.Length + 1)
    $entryPath = $relativePath -replace "\\", "/"
    $entry = $zip.CreateEntry($entryPath, [System.IO.Compression.CompressionLevel]::Optimal)
    $entry.LastWriteTime = $file.LastWriteTime

    $source = [System.IO.File]::OpenRead($file.FullName)
    try {
      $target = $entry.Open()
      try {
        $source.CopyTo($target)
      } finally {
        $target.Dispose()
      }
    } finally {
      $source.Dispose()
    }
  }
} finally {
  $zip.Dispose()
}

$verificationZip = [System.IO.Compression.ZipFile]::OpenRead($output)
try {
  $badEntries = @($verificationZip.Entries | Where-Object { $_.FullName.Contains("\") })
  if ($badEntries.Count -gt 0) {
    throw "itch package contains Windows path separators: $($badEntries[0].FullName)"
  }

  $entryNames = @($verificationZip.Entries | ForEach-Object { $_.FullName })
  if (-not ($entryNames -contains "index.html")) {
    throw "itch package is missing index.html at the zip root."
  }
} finally {
  $verificationZip.Dispose()
}

Write-Host "Created $output with $($files.Count) files."
