# Script para configurar IP de Godex G530 via USB
# Envia comandos ZPL directamente a la impresora

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR IP GODEX G530 VIA USB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar impresoras USB
Write-Host "[1] Buscando Godex en USB..." -ForegroundColor Yellow
$printers = Get-Printer | Where-Object { $_.Name -like "*Godex*" -and $_.PortName -like "*USB*" }

if ($printers.Count -eq 0) {
    Write-Host "[ERROR] No se encontro Godex conectada por USB" -ForegroundColor Red
    Write-Host ""
    Write-Host "Conecta la Godex por USB y vuelve a ejecutar" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "[OK] Godex encontrada: $($printers[0].Name)" -ForegroundColor Green
Write-Host "    Puerto: $($printers[0].PortName)" -ForegroundColor Gray
Write-Host ""

# Configuracion
$nuevaIP = "192.168.15.35"
$mascara = "255.255.255.0"
$gateway = "192.168.15.1"

Write-Host "[2] Configuracion a aplicar:" -ForegroundColor Yellow
Write-Host "    IP:      $nuevaIP" -ForegroundColor White
Write-Host "    Mascara: $mascara" -ForegroundColor White
Write-Host "    Gateway: $gateway" -ForegroundColor White
Write-Host ""

Write-Host "[3] Enviando comandos ZPL a la impresora..." -ForegroundColor Yellow
Write-Host ""

# Convertir IP a formato ZPL (cada octeto separado por coma)
$ipParts = $nuevaIP.Split('.')
$ipZPL = "$($ipParts[0]),$($ipParts[1]),$($ipParts[2]),$($ipParts[3])"

$maskParts = $mascara.Split('.')
$maskZPL = "$($maskParts[0]),$($maskParts[1]),$($maskParts[2]),$($maskParts[3])"

$gwParts = $gateway.Split('.')
$gwZPL = "$($gwParts[0]),$($gwParts[1]),$($gwParts[2]),$($gwParts[3])"

# Comandos ZPL para configurar red
$comandos = @"
~JC
^XA
^NC1,0,192,168,15,35,255,255,255,0,192,168,15,1
^JUS
^XZ
"@

Write-Host "Comandos ZPL:" -ForegroundColor Gray
Write-Host $comandos -ForegroundColor DarkGray
Write-Host ""

try {
    # Enviar a impresora USB
    $printerName = $printers[0].Name
    $comandos | Out-Printer -Name $printerName
    
    Write-Host "[OK] Comandos enviados correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "[4] Proximos pasos:" -ForegroundColor Yellow
    Write-Host "    1. Desconecta el cable USB" -ForegroundColor White
    Write-Host "    2. Conecta el cable Ethernet al switch/router" -ForegroundColor White
    Write-Host "    3. Reinicia la impresora (apagar/encender)" -ForegroundColor White
    Write-Host "    4. Espera 30 segundos" -ForegroundColor White
    Write-Host "    5. Ejecuta: ping 192.168.15.35" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] No se pudieron enviar los comandos" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativa: Usar GoLabel para configurar manualmente" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
pause
