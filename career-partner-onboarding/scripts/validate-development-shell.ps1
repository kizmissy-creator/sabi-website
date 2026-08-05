$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$repositoryRoot = Split-Path -Parent $projectRoot
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
  'Service Schedule',
  'Find Your Starting Point',
  'Admin & Systems Support',
  'Writing & Clarity',
  'SABI Admin Tool Fix',
  'SABI Workflow Reset',
  'SABI Clarity Edit',
  'Case Studies & Impact Stories',
  'Reports & Briefings',
  'Articles & Expert Content',
  'Submission disabled'
  'Choose the age group that applies.'
  'Choose what material you currently have.'
)

$missing = foreach ($pattern in $required) {
  if ($content -notmatch [regex]::Escape($pattern)) { $pattern }
}

if ($failures) { throw "Forbidden live-integration markers found: $($failures -join ', ')" }
if ($missing) { throw "Required development safeguards missing: $($missing -join ', ')" }

$enquiryPath = Join-Path $projectRoot 'src\ServiceEnquiry.tsx'
$enquiryContent = Get-Content -LiteralPath $enquiryPath -Raw
$forbiddenEnquiryCapabilities = @('https://', 'http://', 'fetch(', 'XMLHttpRequest', 'FormData', 'type="file"', 'localStorage', 'sessionStorage', 'action=')
$enquiryFailures = foreach ($pattern in $forbiddenEnquiryCapabilities) {
  if ($enquiryContent -match [regex]::Escape($pattern)) { $pattern }
}
if ($enquiryFailures) { throw "Stage 1 enquiry contains forbidden endpoint, upload or persistence markers: $($enquiryFailures -join ', ')" }

$adminContract = Get-Content -LiteralPath (Join-Path $repositoryRoot 'form-contracts\admin-systems.v0.json') -Raw | ConvertFrom-Json
$writingContract = Get-Content -LiteralPath (Join-Path $repositoryRoot 'form-contracts\writing-clarity.v0.json') -Raw | ConvertFrom-Json
$contracts = @($adminContract, $writingContract)

foreach ($contract in $contracts) {
  if ($contract.status -ne 'development-disabled') { throw "$($contract.contractId) is not development-disabled." }
  if ($contract.endpoint.enabled -ne $false -or $null -ne $contract.endpoint.url) { throw "$($contract.contractId) endpoint is not fail-closed." }
  if ($contract.uploads.enabled -ne $false) { throw "$($contract.contractId) uploads are enabled." }
  if ($contract.controls.payment.enabled -ne $false) { throw "$($contract.contractId) payment is enabled." }
  if ($contract.storage.crossServiceStorageAllowed -ne $false) { throw "$($contract.contractId) permits cross-service storage." }
}

if ($adminContract.endpoint.deployment -eq $writingContract.endpoint.deployment) { throw 'Admin and Writing share an endpoint deployment identifier.' }
if ($adminContract.endpoint.scriptPropertyKey -eq $writingContract.endpoint.scriptPropertyKey) { throw 'Admin and Writing share a configuration property key.' }
if ($adminContract.reference.enquiryPattern -eq $writingContract.reference.enquiryPattern) { throw 'Admin and Writing share an enquiry reference pattern.' }

Write-Output 'Development shell validation passed: source safeguards, router, service pages, Stage 1 capability boundary and separate fail-closed contracts.'
