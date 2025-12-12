# Script para detectar impresoras en la red 192.168.15.x
# Escanea el rango de IPs y detecta dispositivos con puerto 9100 abierto

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DETECTOR DE IMPRESORAS EN RED" -ForegroundColor Cyan
Write-Host "  Escaneando 192.168.15.1-254" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$subnet = "192.168.15"
$startIP = 1
$endIP = 254
$printerPort = 9100
$timeout = 100

$dispositivosEncontrados = @()

Write-Host "[1/2] Escaneando red con ARP..." -ForegroundColor Yellow
Write-Host ""

# Obtener tabla ARP actualizada
$arpTable = arp -a | Select-String "$subnet\."

foreach ($line in $arpTable) {
    if ($line -match "($subnet\.\d+)\s+([0-9a-f-]+)") {
        $ip = $matches[1]
        $mac = $matches[2]
        
        Write-Host "  Encontrado: $ip ($mac)" -ForegroundColor Gray
        
        $dispositivosEncontrados += [PSCustomObject]@{
            IP = $ip
            MAC = $mac
            Puerto9100 = "Verificando..."
            Tipo = "Desconocido"
        }
    }
}

Write-Host ""
Write-Host "[2/2] Verificando puerto 9100 (impresoras)..." -ForegroundColor Yellow
Write-Host ""

foreach ($dispositivo in $dispositivosEncontrados) {
    $ip = $dispositivo.IP
    
    # Intentar conexión al puerto 9100
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($ip, $printerPort, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne($timeout, $false)
    
    if ($wait) {
        try {
            $tcpClient.EndConnect($connect)
            $dispositivo.Puerto9100 = "ABIERTO"
            $dispositivo.Tipo = "IMPRESORA"
            Write-Host "  [OK] $ip - Puerto 9100 ABIERTO (Posible impresora)" -ForegroundColor Green
        } catch {
            $dispositivo.Puerto9100 = "Cerrado"
            Write-Host "  [ ] $ip - Puerto cerrado" -ForegroundColor Gray
        }
    } else {
        $dispositivo.Puerto9100 = "Cerrado"
        Write-Host "  [ ] $ip - Sin respuesta" -ForegroundColor DarkGray
    }
    
    $tcpClient.Close()
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RESULTADO DEL ESCANEO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$impresoras = $dispositivosEncontrados | Where-Object { $_.Tipo -eq "IMPRESORA" }

if ($impresoras.Count -gt 0) {
    Write-Host "IMPRESORAS DETECTADAS:" -ForegroundColor Green
    Write-Host ""
    
    $impresoras | Format-Table -AutoSize IP, MAC, Puerto9100, Tipo
    
    Write-Host ""
    Write-Host "IDENTIFICACION:" -ForegroundColor Yellow
    Write-Host "  Para identificar cual es cual:" -ForegroundColor White
    Write-Host "  1. Compara las MACs con las etiquetas de las impresoras" -ForegroundColor White
    Write-Host "  2. O envia una prueba de impresion a cada IP" -ForegroundColor White
    Write-Host ""
    
    foreach ($imp in $impresoras) {
        Write-Host "  Probar: telnet $($imp.IP) 9100" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "[!] NO se detectaron impresoras con puerto 9100 abierto" -ForegroundColor Red
    Write-Host ""
    Write-Host "POSIBLES CAUSAS:" -ForegroundColor Yellow
    Write-Host "  1. Las impresoras no estan conectadas al router nuevo" -ForegroundColor White
    Write-Host "  2. Estan apagadas" -ForegroundColor White
    Write-Host "  3. El puerto 9100 no esta configurado" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "TODOS LOS DISPOSITIVOS EN RED:" -ForegroundColor Yellow
$dispositivosEncontrados | Format-Table -AutoSize IP, MAC, Puerto9100, Tipo

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
