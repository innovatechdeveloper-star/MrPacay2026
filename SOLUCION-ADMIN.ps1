# Ejecutar como ADMINISTRADOR
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SOLUCION DEFINITIVA - Puerto 3012" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cambiar red a PRIVADA
Write-Host "[1] Cambiando red de PUBLICA a PRIVADA..." -ForegroundColor Yellow
try {
    Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private
    Write-Host "OK - Red configurada como PRIVADA" -ForegroundColor Green
} catch {
    Write-Host "ERROR - No se pudo cambiar: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Crear reglas de firewall permisivas
Write-Host "[2] Creando reglas de firewall..." -ForegroundColor Yellow

# Eliminar reglas antiguas
Remove-NetFirewallRule -DisplayName "Sistema Etiquetas*" -ErrorAction SilentlyContinue

# Crear nuevas reglas
New-NetFirewallRule -DisplayName "Sistema Etiquetas 3012 TCP IN" -Direction Inbound -Protocol TCP -LocalPort 3012 -Action Allow -Profile Any -Enabled True
New-NetFirewallRule -DisplayName "Sistema Etiquetas 3012 TCP OUT" -Direction Outbound -Protocol TCP -LocalPort 3012 -Action Allow -Profile Any -Enabled True

Write-Host "OK - Reglas de firewall creadas" -ForegroundColor Green
Write-Host ""

# 3. Permitir Node.js
Write-Host "[3] Permitiendo Node.js en firewall..." -ForegroundColor Yellow
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if ($nodePath) {
    New-NetFirewallRule -DisplayName "Node.js Sistema Etiquetas" -Direction Inbound -Program $nodePath -Action Allow -Profile Any -Enabled True
    Write-Host "OK - Node.js permitido: $nodePath" -ForegroundColor Green
} else {
    Write-Host "ADVERTENCIA - No se encontro node.exe" -ForegroundColor Yellow
}
Write-Host ""

# 4. Verificar configuracion
Write-Host "[4] Verificando configuracion final..." -ForegroundColor Yellow
$profile = Get-NetConnectionProfile
Write-Host "  Red: $($profile.Name) - Categoria: $($profile.NetworkCategory)" -ForegroundColor Cyan

$listening = Get-NetTCPConnection -LocalPort 3012 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "  Puerto 3012 escuchando en: $($listening.LocalAddress)" -ForegroundColor Cyan
}

$rules = Get-NetFirewallRule -DisplayName "Sistema Etiquetas*"
Write-Host "  Reglas de firewall: $($rules.Count) creadas" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora prueba desde 192.168.15.26:" -ForegroundColor Yellow
Write-Host "  http://192.168.15.22:3012" -ForegroundColor White
Write-Host ""
