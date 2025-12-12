# Script para RESETEAR Godex G530 a valores de fabrica
# Esto eliminara toda configuracion incluida la IP estatica

Write-Host "==========================================" -ForegroundColor Red
Write-Host "  RESET DE FABRICA GODEX G530" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""
Write-Host "ADVERTENCIA: Esto eliminara TODA la configuracion" -ForegroundColor Yellow
Write-Host "La impresora quedara en modo DHCP (sin IP estatica)" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operacion cancelada" -ForegroundColor Gray
    pause
    exit
}

Write-Host ""
Write-Host "[1] Buscando Godex en USB..." -ForegroundColor Yellow
$printers = Get-Printer | Where-Object { $_.Name -like "*Godex*" -and $_.PortName -like "*USB*" }

if ($printers.Count -eq 0) {
    Write-Host "[ERROR] No se encontro Godex conectada por USB" -ForegroundColor Red
    Write-Host ""
    pause
    exit
}

Write-Host "[OK] Godex encontrada: $($printers[0].Name)" -ForegroundColor Green
Write-Host ""

Write-Host "[2] Enviando comando de RESET..." -ForegroundColor Yellow
Write-Host ""

# Comando ZPL para reset de fabrica
$resetCommand = @"
~JR
^XA
^JUF
^XZ
"@

Write-Host "Comando:" -ForegroundColor Gray
Write-Host $resetCommand -ForegroundColor DarkGray
Write-Host ""

try {
    $printerName = $printers[0].Name
    $resetCommand | Out-Printer -Name $printerName
    
    Write-Host "[OK] Comando de reset enviado" -ForegroundColor Green
    Write-Host ""
    Write-Host "[3] La impresora se reiniciara automaticamente..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Espera 30 segundos..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "[4] Proximos pasos:" -ForegroundColor Yellow
    Write-Host "    1. Desconecta USB" -ForegroundColor White
    Write-Host "    2. Conecta Ethernet al switch/router" -ForegroundColor White
    Write-Host "    3. Enciende la impresora" -ForegroundColor White
    Write-Host "    4. Espera 40 segundos (DHCP)" -ForegroundColor White
    Write-Host "    5. Ejecuta: buscar-impresoras-rapido.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "La Godex obtendra IP automatica del router 192.168.15.1" -ForegroundColor Cyan
    Write-Host "Luego configuramos IP estatica 192.168.15.35" -ForegroundColor Cyan
    
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""
pause
