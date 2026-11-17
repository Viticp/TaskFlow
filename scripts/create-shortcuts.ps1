# TaskFlow - Accesos directos de escritorio para uso diario.
#
# Uso:
#     .\scripts\create-shortcuts.ps1
#     .\scripts\create-shortcuts.ps1 -Force
#
# Crea en el escritorio:
#   - "TaskFlow"          -> arranca TaskFlow y abre el navegador.
#   - "Detener TaskFlow"  -> para TaskFlow y libera el puerto 8080.
#
# No requiere permisos de administrador y no modifica el sistema: solo crea dos
# archivos .lnk en el escritorio del usuario.
#
# Si un acceso ya existe, no se sobrescribe salvo que se use -Force.

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath("Desktop")

if (-not $desktop -or -not (Test-Path -LiteralPath $desktop)) {
    throw "No se ha encontrado la carpeta del escritorio."
}

$powershell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
if (-not (Test-Path -LiteralPath $powershell)) {
    throw "No se ha encontrado powershell.exe en '$powershell'."
}

$startScript = Join-Path $PSScriptRoot "start-taskflow.ps1"
$stopScript = Join-Path $PSScriptRoot "stop-taskflow.ps1"

if (-not (Test-Path -LiteralPath $startScript)) {
    throw "No se encuentra scripts\start-taskflow.ps1."
}
if (-not (Test-Path -LiteralPath $stopScript)) {
    throw "No se encuentra scripts\stop-taskflow.ps1."
}

function New-TaskFlowShortcut {
    param(
        [string]$Name,
        [string]$ScriptPath,
        [string]$Description
    )

    $shortcutPath = Join-Path $desktop "$Name.lnk"
    if ((Test-Path -LiteralPath $shortcutPath) -and -not $Force) {
        Write-Host "  Ya existe: $shortcutPath" -ForegroundColor Yellow
        Write-Host "  Usa -Force para reemplazarlo."
        return $shortcutPath
    }

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $powershell
    $shortcut.Arguments = "-NoProfile -File `"$ScriptPath`""
    $shortcut.WorkingDirectory = $projectRoot
    $shortcut.Description = $Description
    $shortcut.WindowStyle = 1
    $shortcut.Save()

    Write-Host "  Creado: $shortcutPath" -ForegroundColor Green
    return $shortcutPath
}

Write-Host ""
Write-Host "TaskFlow - accesos directos" -ForegroundColor Cyan
Write-Host "  Escritorio: $desktop"
Write-Host ""

New-TaskFlowShortcut -Name "TaskFlow" -ScriptPath $startScript `
    -Description "Arranca TaskFlow y abre http://localhost:8080" | Out-Null

New-TaskFlowShortcut -Name "Detener TaskFlow" -ScriptPath $stopScript `
    -Description "Detiene TaskFlow y libera el puerto 8080" | Out-Null

Write-Host ""
Write-Host "Accesos directos preparados. Doble clic en 'TaskFlow' para arrancar." -ForegroundColor Green
