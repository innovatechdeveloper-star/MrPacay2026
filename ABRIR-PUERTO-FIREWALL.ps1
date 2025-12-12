# =============================================
# ABRIR PUERTO 3012 EN FIREWALL
# Script PowerShell con elevación automática
# =============================================

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  REQUIERE PERMISOS DE ADMINISTRADOR" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Relanzando script como Administrador..." -ForegroundColor Cyan
    Write-Host ""
    
    # Relanzar el script como administrador
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURANDO FIREWALL PARA RED LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abriendo puerto 3012 para Sistema de Etiquetas..." -ForegroundColor Yellow
Write-Host ""

# Eliminar reglas existentes (si existen)
Write-Host "[1/3] Eliminando reglas antiguas..." -ForegroundColor Gray
try {
    Remove-NetFirewallRule -DisplayName "Sistema Etiquetas - Puerto 3012" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Sistema Etiquetas - Puerto 3012 Salida" -ErrorAction SilentlyContinue
    Write-Host "      OK - Reglas antiguas eliminadas" -ForegroundColor Green
} catch {
    Write-Host "      INFO - No habia reglas antiguas" -ForegroundColor Gray
}

# Agregar regla de entrada (IN)
Write-Host ""
Write-Host "[2/3] Creando regla de entrada (IN)..." -ForegroundColor Gray
try {
    New-NetFirewallRule -DisplayName "Sistema Etiquetas - Puerto 3012" -Direction Inbound -Protocol TCP -LocalPort 3012 -Action Allow -Profile Any | Out-Null
    Write-Host "      OK - Regla de entrada creada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "      ERROR - No se pudo crear la regla de entrada" -ForegroundColor Red
    Write-Host "      $_" -ForegroundColor Red
    pause
    exit 1
}

# Agregar regla de salida (OUT)
Write-Host ""
Write-Host "[3/3] Creando regla de salida (OUT)..." -ForegroundColor Gray
try {
    New-NetFirewallRule -DisplayName "Sistema Etiquetas - Puerto 3012 Salida" -Direction Outbound -Protocol TCP -LocalPort 3012 -Action Allow -Profile Any | Out-Null
    Write-Host "      OK - Regla de salida creada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "      ADVERTENCIA - No se pudo crear la regla de salida" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Puerto 3012 ahora esta accesible desde:" -ForegroundColor White
Write-Host ""
Write-Host "  - Localhost:     http://localhost:3012" -ForegroundColor Cyan
Write-Host "  - Tu PC:         http://192.168.15.22:3012" -ForegroundColor Cyan
Write-Host "  - Otros en red:  http://192.168.15.22:3012" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
