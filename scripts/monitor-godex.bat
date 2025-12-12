@echo off
chcp 65001 >nul
color 0A
title MONITOR GODEX 192.168.15.35 - Esperando conexion

echo ============================================
echo   MONITOREANDO GODEX EN 192.168.15.35
echo ============================================
echo.
echo Este script intentara conectarse cada 5 segundos
echo hasta que la Godex responda en puerto 9100
echo.
echo Presiona Ctrl+C para detener
echo.
echo ============================================
echo.

:loop
echo [%date% %time:~0,8%] Probando 192.168.15.35:9100...

powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $result = $client.BeginConnect('192.168.15.35', 9100, $null, $null); $success = $result.AsyncWaitHandle.WaitOne(2000, $false); if ($success) { $client.EndConnect($result); Write-Host '    [EXITO!] GODEX ENCONTRADA EN 192.168.15.35:9100' -ForegroundColor Green; Write-Host ''; Write-Host 'La impresora esta lista para usar!' -ForegroundColor Cyan; $client.Close(); pause; exit 0 } else { Write-Host '    [X] No responde' -ForegroundColor Red }; $client.Close() } catch { Write-Host '    [X] Error: ' $_.Exception.Message -ForegroundColor Red }" 2>nul

timeout /t 5 /nobreak >nul
goto loop
