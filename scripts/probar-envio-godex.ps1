# Script para probar envio de datos a Godex en 192.168.1.35
# Desde red 192.168.15.x (no deberia funcionar pero probamos)

$targetIP = "192.168.1.35"
$targetPort = 9100
$timeout = 5000

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE ENVIO A GODEX" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Origen:  192.168.15.9 (Tu PC)" -ForegroundColor Yellow
Write-Host "Destino: $targetIP`:$targetPort (Godex)" -ForegroundColor Yellow
Write-Host ""

# ZPL simple de prueba (imprime texto)
$zplTest = @"
^XA
^FO50,50^ADN,36,20^FDPRUEBA DE CONEXION^FS
^FO50,100^ADN,36,20^FDDesde 192.168.15.9^FS
^XZ
"@

Write-Host "[1] Intentando conectar..." -ForegroundColor Yellow

try {
    $client = New-Object System.Net.Sockets.TcpClient
    $connection = $client.BeginConnect($targetIP, $targetPort, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne($timeout, $false)
    
    if ($wait) {
        $client.EndConnect($connection)
        Write-Host "[OK] Conexion establecida" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "[2] Enviando comando ZPL..." -ForegroundColor Yellow
        $stream = $client.GetStream()
        $writer = New-Object System.IO.StreamWriter($stream)
        $writer.Write($zplTest)
        $writer.Flush()
        
        Write-Host "[OK] Datos enviados correctamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Si la impresora esta conectada, deberia imprimir una etiqueta de prueba" -ForegroundColor Cyan
        
        $writer.Close()
        $stream.Close()
    } else {
        Write-Host "[ERROR] No se pudo conectar (Timeout)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Causas posibles:" -ForegroundColor Yellow
        Write-Host "  1. Las redes 192.168.15.x y 192.168.1.x no se comunican" -ForegroundColor White
        Write-Host "  2. No hay ruta entre las subredes" -ForegroundColor White
        Write-Host "  3. La impresora no esta en 192.168.1.35" -ForegroundColor White
        Write-Host "  4. Puerto 9100 cerrado o impresora apagada" -ForegroundColor White
    }
    
    $client.Close()
    
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
pause
