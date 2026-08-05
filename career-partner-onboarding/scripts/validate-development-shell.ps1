$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFiles = Get-ChildItem -Path (Join-Path $projectRoot 'src') -Recurse -File
$content = ($sourceFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"

$forbidden = @(
  'fetch(',
  'XMLHttpRequest',
  'axios',
  'checkout.session',
  'client_secret',
  'api_key',
  'gtag(',
  'session replay'
)

$failures = foreach ($pattern in $forbidden) {
  if ($content -match [regex]::Escape($pattern)) { $pattern }
}

$required = @(
  'Development shell',
  'Sensitive questions remain locked',
  'Terms acceptance is required before payment',
  'Secure payment disabled in development',
  'validation-summary',
  'Service Schedule'
)

$missing = foreach ($pattern in $required) {
  if ($content -notmatch [regex]::Escape($pattern)) { $pattern }
}

if ($failures) { throw "Forbidden live-integration markers found: $($failures -join ', ')" }
if ($missing) { throw "Required development safeguards missing: $($missing -join ', ')" }

Write-Output 'Development shell validation passed.'
