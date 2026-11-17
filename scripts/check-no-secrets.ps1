# Comprueba que ningun secreto de .env.local aparece escrito en un archivo del proyecto.
#
# Uso:
#     .\scripts\check-no-secrets.ps1
#
# Compara el VALOR real de cada variable sensible con el contenido de cada archivo
# del proyecto (excluyendo .git, target y el propio .env.local).
# Nunca imprime el valor del secreto: solo el nombre de la variable y el archivo
# donde aparece.
#
# Codigo de salida:
#     0 = no se ha encontrado ningun secreto
#     1 = hay al menos un archivo con un secreto literal
#
# Recomendado antes del primer `git add` y antes de cada commit.

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "No existe .env.local: no hay secretos que comprobar." -ForegroundColor Yellow
    exit 0
}

# Nombres de variable que se consideran secretos.
$secretNamePattern = "(?i)(PASSWORD|PASSWD|SECRET|TOKEN|API_?KEY|PRIVATE_?KEY)"

# Extensiones que no tiene sentido leer como texto.
$binaryExtensions = @(
    ".jar", ".class", ".war", ".ear", ".zip", ".gz", ".7z", ".png", ".jpg",
    ".jpeg", ".gif", ".ico", ".webp", ".pdf", ".exe", ".dll", ".so", ".woff",
    ".woff2", ".ttf", ".eot", ".keystore", ".jks", ".p12"
)

$secrets = @()
foreach ($line in Get-Content $envFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }

    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) { continue }

    $name = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim()

    if ($value.Length -ge 2 -and (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    # Valores muy cortos generan falsos positivos.
    if ($name -match $secretNamePattern -and $value.Length -ge 6) {
        $secrets += [pscustomobject]@{ Name = $name; Value = $value }
    }
}

if ($secrets.Count -eq 0) {
    Write-Host "No hay variables sensibles con valor en .env.local." -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem $projectRoot -Recurse -File -Force |
    Where-Object {
        $_.FullName -notmatch '[\\/]\.git[\\/]' -and
        $_.FullName -notmatch '[\\/]target[\\/]' -and
        $_.FullName -ne $envFile -and
        $binaryExtensions -notcontains $_.Extension.ToLowerInvariant()
    }

$findings = @()
foreach ($file in $files) {
    $text = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $text) { continue }

    foreach ($secret in $secrets) {
        if ($text.Contains($secret.Value)) {
            $findings += [pscustomobject]@{
                Variable = $secret.Name
                Archivo  = $file.FullName.Replace($projectRoot + [IO.Path]::DirectorySeparatorChar, "")
            }
        }
    }
}

if ($findings.Count -gt 0) {
    Write-Host ""
    Write-Host "SECRETOS ENCONTRADOS EN ARCHIVOS DEL PROYECTO" -ForegroundColor Red
    $findings | Format-Table -AutoSize | Out-String | Write-Host
    Write-Host "Elimina el valor literal y usa la variable de entorno." -ForegroundColor Red
    exit 1
}

Write-Host "OK: los valores de .env.local no aparecen en ningun archivo del proyecto." -ForegroundColor Green
foreach ($secret in $secrets) {
    Write-Host "  $($secret.Name): sin coincidencias"
}
exit 0
