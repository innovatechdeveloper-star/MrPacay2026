# Script para actualizar configuracion de red de impresoras
# Nueva red: 192.168.15.x
# Fecha: 5 de diciembre de 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZACION DE RED - IMPRESORAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracion
$nuevaRedZebra = "192.168.15.34"
$nuevaRedGodex = "192.168.15.35"
$puerto = 9100

# 1. GODEX G530 - Eliminar puerto viejo y crear nuevo
Write-Host "[1/4] Actualizando puerto Godex G530..." -ForegroundColor Yellow

try {
    # Verificar si existe el puerto viejo
    $puertoViejoGodex = Get-PrinterPort -Name "192.168.1.40" -ErrorAction SilentlyContinue
    
    if ($puertoViejoGodex) {
        Write-Host "  - Eliminando puerto viejo 192.168.1.40..." -ForegroundColor Gray
        Remove-PrinterPort -Name "192.168.1.40" -Confirm:$false -ErrorAction Stop
        Write-Host "  [OK] Puerto viejo eliminado" -ForegroundColor Green
    }
    
    # Crear nuevo puerto
    Write-Host "  - Creando nuevo puerto $nuevaRedGodex..." -ForegroundColor Gray
    Add-PrinterPort -Name "IP_$nuevaRedGodex" -PrinterHostAddress $nuevaRedGodex -PortNumber $puerto -ErrorAction Stop
    Write-Host "  [OK] Puerto nuevo creado: IP_$nuevaRedGodex" -ForegroundColor Green
    
    # Reasignar impresora al nuevo puerto
    Write-Host "  - Reasignando impresora Godex G530..." -ForegroundColor Gray
    Set-Printer -Name "Godex G530" -PortName "IP_$nuevaRedGodex" -ErrorAction Stop
    Write-Host "  [OK] Godex G530 actualizada" -ForegroundColor Green
    
} catch {
    Write-Host "  [ERROR] en Godex: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. ZEBRA ZD230 - Crear nuevo puerto y reasignar
Write-Host "[2/4] Actualizando puerto Zebra ZD230..." -ForegroundColor Yellow

try {
    # Crear nuevo puerto para Zebra
    Write-Host "  - Creando puerto $nuevaRedZebra..." -ForegroundColor Gray
    Add-PrinterPort -Name "IP_$nuevaRedZebra" -PrinterHostAddress $nuevaRedZebra -PortNumber $puerto -ErrorAction Stop
    Write-Host "  [OK] Puerto nuevo creado: IP_$nuevaRedZebra" -ForegroundColor Green
    
    # Reasignar impresora
    Write-Host "  - Reasignando impresora ZDesigner ZD230..." -ForegroundColor Gray
    Set-Printer -Name "ZDesigner ZD230-203dpi ZPL" -PortName "IP_$nuevaRedZebra" -ErrorAction Stop
    Write-Host "  [OK] Zebra ZD230 actualizada" -ForegroundColor Green
    
} catch {
    Write-Host "  [ERROR] en Zebra: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar configuracion
Write-Host "[3/4] Verificando configuracion..." -ForegroundColor Yellow

try {
    $godexInfo = Get-Printer -Name "Godex G530" -ErrorAction Stop
    $zebraInfo = Get-Printer -Name "ZDesigner ZD230-203dpi ZPL" -ErrorAction Stop
    
    Write-Host ""
    Write-Host "  GODEX G530:" -ForegroundColor Cyan
    Write-Host "    Puerto: $($godexInfo.PortName)" -ForegroundColor White
    Write-Host "    Estado: $($godexInfo.PrinterStatus)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "  ZEBRA ZD230:" -ForegroundColor Cyan
    Write-Host "    Puerto: $($zebraInfo.PortName)" -ForegroundColor White
    Write-Host "    Estado: $($zebraInfo.PrinterStatus)" -ForegroundColor White
    
} catch {
    Write-Host "  [ERROR] verificando: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Probar conectividad
Write-Host "[4/4] Probando conectividad de red..." -ForegroundColor Yellow

Write-Host "  - Ping a Godex ($nuevaRedGodex)..." -ForegroundColor Gray
$pingGodex = Test-Connection -ComputerName $nuevaRedGodex -Count 2 -Quiet
if ($pingGodex) {
    Write-Host "  [OK] Godex responde en la red" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] Godex NO responde - Verifica que la impresora tenga la IP $nuevaRedGodex" -ForegroundColor Red
}

Write-Host "  - Ping a Zebra ($nuevaRedZebra)..." -ForegroundColor Gray
$pingZebra = Test-Connection -ComputerName $nuevaRedZebra -Count 2 -Quiet
if ($pingZebra) {
    Write-Host "  [OK] Zebra responde en la red" -ForegroundColor Green
} else {
    Write-Host "  [FALLO] Zebra NO responde - Verifica que la impresora tenga la IP $nuevaRedZebra" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar resumen
Write-Host "RESUMEN DE CONFIGURACION:" -ForegroundColor Yellow
Write-Host "  Red anterior: 192.168.1.x" -ForegroundColor Gray
Write-Host "  Red nueva:    192.168.15.x" -ForegroundColor Gray
Write-Host ""
Write-Host "  Godex G530:  192.168.1.40 -> $nuevaRedGodex" -ForegroundColor White
Write-Host "  Zebra ZD230: (LAN_ZD230) -> $nuevaRedZebra" -ForegroundColor White
Write-Host ""

if (-not $pingGodex -or -not $pingZebra) {
    Write-Host "IMPORTANTE: Algunas impresoras no responden." -ForegroundColor Yellow
    Write-Host "   Debes configurar las IPs fisicas en las impresoras:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   GODEX G530:" -ForegroundColor Cyan
    Write-Host "     1. Panel -> MENU -> Interface -> Ethernet" -ForegroundColor White
    Write-Host "     2. IP Address: $nuevaRedGodex" -ForegroundColor White
    Write-Host "     3. Gateway: 192.168.15.1" -ForegroundColor White
    Write-Host ""
    Write-Host "   ZEBRA ZD230:" -ForegroundColor Cyan
    Write-Host "     1. Accede a http://[IP-ACTUAL-ZEBRA] desde navegador" -ForegroundColor White
    Write-Host "     2. Network -> Wired -> IP Address: $nuevaRedZebra" -ForegroundColor White
    Write-Host "     3. Gateway: 192.168.15.1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
