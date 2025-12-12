@echo off
chcp 65001 >nul
color 0E
title BUSCAR IMPRESORAS - ESCANEO RAPIDO

echo.
echo ============================================
echo   BUSCANDO IMPRESORAS EN RED
echo ============================================
echo.
echo Escaneando 192.168.15.x...
echo.

timeout /t 2 /nobreak >nul

echo [1] Refrescando tabla ARP...
for /L %%i in (1,1,50) do @ping -n 1 -w 50 192.168.15.%%i >nul 2>&1

echo [2] Mostrando dispositivos detectados...
echo.

arp -a | findstr "192.168.15"

echo.
echo ============================================
echo   INTENTANDO CONECTAR A PUERTO 9100
echo ============================================
echo.

powershell -Command "$ips = 20..50; foreach ($ip in $ips) { try { $client = New-Object System.Net.Sockets.TcpClient; $result = $client.BeginConnect('192.168.15.' + $ip, 9100, $null, $null); $success = $result.AsyncWaitHandle.WaitOne(200, $false); if ($success) { Write-Host '[IMPRESORA ENCONTRADA] 192.168.15.'$ip -ForegroundColor Green }; $client.Close() } catch {} }"

echo.
echo ============================================
echo.
pause
