# Script para enviar etiqueta de prueba real a Godex 192.168.15.35
# Comando ZPL similar al que usa el servidor

$GODEX_IP = "192.168.15.35"
$GODEX_PORT = 9100
$timeout = 10000

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE IMPRESION GODEX G530" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Destino: $GODEX_IP`:$GODEX_PORT" -ForegroundColor Yellow
Write-Host ""

# ZPL de prueba simple (similar al del servidor)
$zplPrueba = @"
~S
~Q+0
~Q+25
^W80
^H8
^P1
^S4
^AD
^C1
^R0
~Q+0
^O0
^D0
^E12
~R200
^L

Dy2-me-dd
Th:m:s
AB,20,20,1,1,0,0E,PRUEBA SISTEMA ETIQUETAS
AB,20,60,1,1,0,0E,IP: 192.168.15.35
AB,20,100,1,1,0,0E,Servidor: OK
AB,20,140,1,1,0,0E,Red: 192.168.15.x
E
"@

Write-Host "[1] Intentando conectar..." -ForegroundColor Yellow

try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.SendTimeout = $timeout
    $client.ReceiveTimeout = $timeout
    
    Write-Host "    Conectando a $GODEX_IP`:$GODEX_PORT..." -ForegroundColor Gray
    $client.Connect($GODEX_IP, $GODEX_PORT)
    
    Write-Host "[OK] Conexion TCP establecida!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[2] Enviando comando ZPL..." -ForegroundColor Yellow
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $writer.AutoFlush = $true
    
    Write-Host "    Bytes a enviar: $($zplPrueba.Length)" -ForegroundColor Gray
    $writer.Write($zplPrueba)
    
    Write-Host "[OK] Comando enviado!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[3] Resultado:" -ForegroundColor Yellow
    Write-Host "    Si la Godex esta configurada correctamente," -ForegroundColor White
    Write-Host "    deberia IMPRIMIR una etiqueta de prueba" -ForegroundColor White
    Write-Host "    con el texto:" -ForegroundColor White
    Write-Host "      - PRUEBA SISTEMA ETIQUETAS" -ForegroundColor Cyan
    Write-Host "      - IP: 192.168.15.35" -ForegroundColor Cyan
    Write-Host "      - Servidor: OK" -ForegroundColor Cyan
    Write-Host "      - Red: 192.168.15.x" -ForegroundColor Cyan
    Write-Host ""
    
    $writer.Close()
    $stream.Close()
    $client.Close()
    
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  COMANDO ENVIADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifica si la Godex imprimio la etiqueta" -ForegroundColor Yellow
    
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. Puerto 9100 cerrado" -ForegroundColor White
    Write-Host "  2. Impresora no esta en 192.168.15.35" -ForegroundColor White
    Write-Host "  3. Firewall bloqueando conexion" -ForegroundColor White
    Write-Host "  4. Cable Ethernet desconectado" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
pause
