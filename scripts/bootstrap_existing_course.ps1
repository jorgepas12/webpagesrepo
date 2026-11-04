# Bootstrap de curso Jekyll existente desde PowerShell.
# Sin instalacion persistente, sin cambiar el contenido pedagogico por fuera del migrador.
# Ejecucion: Invoke-WebRequest URL -OutFile $env:TEMP\labcontrol-bootstrap.ps1
#           & "$env:TEMP\labcontrol-bootstrap.ps1" -TrackingId ... -Code ... -Name ... [-Apply]
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]{2,20}$')][string]$TrackingId,
  [Parameter(Mandatory = $true)][ValidatePattern('^[A-Z0-9][A-Z0-9_]{1,49}$')][string]$Code,
  [Parameter(Mandatory = $true)][ValidateNotNullOrEmpty()][string]$Name,
  [string]$Description = '',
  [switch]$Apply
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -Path '.git' -PathType Container) -or
    -not (Test-Path -Path 'labs' -PathType Container)) {
  throw 'Ejecutar desde la raiz de un repositorio Jekyll que ya tenga .git, labs y _data/courses.yml.'
}
$null = Get-Command git -ErrorAction Stop
$null = Get-Command node -ErrorAction Stop
$null = Get-Command python -ErrorAction Stop
$gitStatus = @(git status --porcelain)
if ($LASTEXITCODE -ne 0 -or $gitStatus.Count -gt 0) {
  throw 'El repositorio debe estar limpio. Primero hacer commit de las mejoras academicas.'
}
$temp = Join-Path ([IO.Path]::GetTempPath()) ('labcontrol-onboarding-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp -Force | Out-Null
try {
  $source = Join-Path $temp 'webpagesrepo'
  & git clone --depth 1 --branch main 'https://github.com/jorgepas12/webpagesrepo.git' $source
  if ($LASTEXITCODE -ne 0) { throw 'No fue posible obtener herramientas centrales de GitHub.' }
  $argsList = @(
    (Join-Path $source 'scripts/adopt_course_complete.mjs'),
    '--target', (Get-Location).Path,
    '--tracking-id', $TrackingId,
    '--code', $Code,
    '--name', $Name,
    '--description', $Description
  )
  if ($Apply) { $argsList += '--apply' }
  & node @argsList
  if ($LASTEXITCODE -ne 0) { throw "La integracion fallo. Revisar reporte; no hacer push." }
} finally {
  Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
