# VPlan - Parada de uso diario.
#
# Uso:
#     .\scripts\stop-taskflow.ps1
#     .\scripts\stop-taskflow.ps1 -Force
#
# Que hace:
#   1. Busca el proceso que escucha en el puerto 8080 y lee logs/taskflow.pid.
#   2. Comprueba que el proceso es realmente VPlan.
#   3. Intenta un cierre ordenado y, si no termina, fuerza el proceso de VPlan.
#   4. Detiene tambien el lanzador de Maven para no dejar procesos abiertos.
#   5. Comprueba que el puerto 8080 queda libre y borra el archivo de PID.
#
# Seguridad:
#   - Nunca detiene un proceso ajeno si no se pasa -Force.
#   - Con -Force se usa solo cuando la persona esta segura de que el proceso es
#     VPlan o de que quiere liberar el puerto.
#
# Si VPlan se arranco a mano con "mvnw spring-boot:run", este script puede
# detener la aplicacion, pero la ventana de Maven debe cerrarse a mano.

[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 20,
    [switch]$Force,
    [switch]$NoPause
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path (Join-Path $projectRoot "logs") "taskflow.pid"

function Write-TaskFlowError {
    param([string]$Message)
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Wait-TaskFlowExit {
    if (-not $NoPause -and $Host.Name -eq "ConsoleHost") {
        try {
            Read-Host "Pulsa Enter para cerrar" | Out-Null
        } catch {
            # Sin consola interactiva: no bloquear.
        }
    }
}

function Get-TaskFlowListener {
    return Get-NetTCPConnection -State Listen -LocalPort 8080 `
        -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Get-TaskFlowProcessInfo {
    param([int]$ProcessId)

    if (-not $ProcessId) { return $null }

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $process) { return $null }

    $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" `
        -ErrorAction SilentlyContinue

    return [pscustomobject]@{
        Id          = $ProcessId
        Name        = $process.ProcessName
        CommandLine = if ($cim) { [string]$cim.CommandLine } else { "" }
    }
}

function Test-TaskFlowProcess {
    param($Info)

    if (-not $Info) { return $false }

    $name = [string]$Info.Name
    $commandLine = [string]$Info.CommandLine

    if ($name -notmatch "^(java|javaw)$") { return $false }
    return $commandLine -match "(?i)(taskflow|com\.taskflow)"
}

function Read-TaskFlowPidFile {
    if (-not (Test-Path -LiteralPath $pidFile)) { return $null }

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $pidFile -Encoding UTF8 -ErrorAction SilentlyContinue) {
        if ($line -match "^\s*([A-Za-z]+)\s*=\s*(.*)\s*$") {
            $values[$Matches[1]] = $Matches[2].Trim()
        }
    }

    $launcherPid = 0
    $appPid = 0
    if ($values.ContainsKey("LauncherPid")) {
        [void][int]::TryParse($values["LauncherPid"], [ref]$launcherPid)
    }
    if ($values.ContainsKey("AppPid")) {
        [void][int]::TryParse($values["AppPid"], [ref]$appPid)
    }

    return [pscustomobject]@{
        LauncherPid = $launcherPid
        AppPid      = $appPid
        Log         = if ($values.ContainsKey("Log")) { $values["Log"] } else { "" }
    }
}

function Stop-TaskFlowProcessTree {
    param([int]$ProcessId)

    if (-not $ProcessId) { return }

    # Primer intento: sin /F. En una consola Java normalmente no basta, pero no
    # hace dano intentarlo antes de forzar.
    try {
        & taskkill.exe /PID $ProcessId /T 2>$null | Out-Null
    } catch { }

    $deadline = (Get-Date).AddSeconds(5)
    while ((Get-Date) -lt $deadline) {
        if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
            return
        }
        Start-Sleep -Milliseconds 400
    }

    try {
        & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
    } catch { }
}

$appPid = 0
$launcherPid = 0

try {
    Write-Host ""
    Write-Host "VPlan - parada" -ForegroundColor Cyan

    $pidInfo = Read-TaskFlowPidFile
    if ($pidInfo) {
        $appPid = [int]$pidInfo.AppPid
        $launcherPid = [int]$pidInfo.LauncherPid
    }

    $listener = Get-TaskFlowListener
    if ($listener) {
        $appPid = [int]$listener.OwningProcess
    }

    if (-not $appPid -or -not (Get-Process -Id $appPid -ErrorAction SilentlyContinue)) {
        # La aplicacion no esta escuchando. Puede quedar el lanzador de Maven.
        if ($launcherPid -and (Get-Process -Id $launcherPid -ErrorAction SilentlyContinue)) {
            Write-Host "  Deteniendo restos del lanzador de Maven (PID $launcherPid)..."
            Stop-TaskFlowProcessTree -ProcessId $launcherPid
        }

        if (Test-Path -LiteralPath $pidFile) {
            Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        }

        Write-Host "  VPlan no esta en marcha. El puerto 8080 esta libre." -ForegroundColor Green
        exit 0
    }

    $details = Get-TaskFlowProcessInfo -ProcessId $appPid
    if (-not $details) {
        throw "El PID $appPid ya no existe."
    }

    $isTaskFlow = Test-TaskFlowProcess -Info $details
    if (-not $isTaskFlow) {
        $description = "$($details.Name) (PID $appPid)"
        if (-not $Force) {
            throw "El puerto 8080 lo ocupa $description, que no parece VPlan. No se ha detenido nada. Si estas seguro, repite con -Force."
        }
        Write-Host "  AVISO: el proceso $description no se ha podido verificar como VPlan." -ForegroundColor Yellow
        Write-Host "  -Force autoriza a detenerlo de todos modos." -ForegroundColor Yellow
    }

    Write-Host "  Deteniendo VPlan (PID $appPid, $($details.Name))..."
    Stop-TaskFlowProcessTree -ProcessId $appPid

    $deadline = (Get-Date).AddSeconds([Math]::Max(5, $TimeoutSeconds))
    while ((Get-Date) -lt $deadline) {
        if (-not (Get-TaskFlowListener)) { break }
        Start-Sleep -Milliseconds 500
    }

    if ($launcherPid -and $launcherPid -ne $appPid -and (Get-Process -Id $launcherPid -ErrorAction SilentlyContinue)) {
        Write-Host "  Deteniendo el lanzador de Maven (PID $launcherPid)..."
        Stop-TaskFlowProcessTree -ProcessId $launcherPid
    }

    # Red de seguridad: solo procesos Java que pertenezcan a esta carpeta.
    $remaining = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine.IndexOf($projectRoot, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
        }
    foreach ($process in @($remaining)) {
        if ($process -and $process.ProcessId) {
            Write-Host "  Deteniendo proceso Java restante (PID $($process.ProcessId))..."
            try { Stop-Process -Id ([int]$process.ProcessId) -Force -ErrorAction SilentlyContinue } catch { }
        }
    }

    if (Test-Path -LiteralPath $pidFile) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }

    if (Get-TaskFlowListener) {
        throw "El puerto 8080 sigue ocupado. Revisa el proceso con Get-NetTCPConnection -LocalPort 8080."
    }

    Write-Host ""
    Write-Host "VPlan detenido. El puerto 8080 esta libre." -ForegroundColor Green
    exit 0
} catch {
    Write-TaskFlowError $_.Exception.Message
    Wait-TaskFlowExit
    exit 1
}
