# Build Neo site static files into deploy/site-dist (Windows PowerShell)
# Run from neo-cha-assistant root:
#   powershell -File deploy/build-site.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Site = if ($env:NEO_SITE_PATH) { $env:NEO_SITE_PATH } else { Join-Path $Root "..\connectosWebsite1\neologistics" }
$Out = Join-Path $Root "deploy\site-dist"

if (-not (Test-Path $Site)) {
  Write-Error "Neo site not found at $Site. Set NEO_SITE_PATH."
}

Write-Host "Building Neo site from $Site ..."
Push-Location $Site
try {
  npm ci
  $env:VITE_PORTAL_URL = "/app/"
  npm run build
  if (Test-Path $Out) { Remove-Item -Recurse -Force $Out }
  New-Item -ItemType Directory -Path $Out | Out-Null
  Copy-Item -Recurse -Force (Join-Path $Site "dist\*") $Out
  Write-Host "Wrote $Out"
} finally {
  Pop-Location
}
