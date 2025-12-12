@echo off
echo ========================================
echo  DIAGNOSTICO COMPLETO DE CONEXION
echo  Sistema de Etiquetas v2.5
echo ========================================
echo.
echo [1/8] Verificando IP del servidor...
ipconfig | findstr /i "IPv4"
echo.

echo [2/8] Verificando si el puerto 3012 esta escuchando...
netstat -an | findstr ":3012"
echo.

echo [3/8] Verificando reglas de firewall para puerto 3012...
netsh advfirewall firewall show rule name="Sistema Etiquetas - Puerto 3012"
echo.

echo [4/8] Probando conexion local (localhost:3012)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3012' -TimeoutSec 5 -UseBasicParsing; Write-Host 'OK - Codigo:' $response.StatusCode } catch { Write-Host 'ERROR:' $_.Exception.Message }"
echo.

echo [5/8] Probando conexion IP local (192.168.15.22:3012)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://192.168.15.22:3012' -TimeoutSec 5 -UseBasicParsing; Write-Host 'OK - Codigo:' $response.StatusCode } catch { Write-Host 'ERROR:' $_.Exception.Message }"
echo.

echo [6/8] Verificando si Node.js esta ejecutandose...
tasklist | findstr "node.exe"
echo.

echo [7/8] Verificando todas las reglas de firewall relacionadas...
netsh advfirewall firewall show rule name=all | findstr /i "3012"
echo.

echo [8/8] Verificando configuracion de redes privadas/publicas...
powershell -Command "Get-NetConnectionProfile | Select-Object Name, NetworkCategory, InterfaceAlias"
echo.

echo ========================================
echo  PRUEBAS ADICIONALES
echo ========================================
echo.
echo Intentando abrir regla de firewall mas permisiva...
netsh advfirewall firewall add rule name="Sistema Etiquetas - Puerto 3012 - ENTRADA" dir=in action=allow protocol=TCP localport=3012 profile=any
netsh advfirewall firewall add rule name="Sistema Etiquetas - Puerto 3012 - SALIDA" dir=out action=allow protocol=TCP localport=3012 profile=any
echo.

echo Verificando Windows Defender Firewall status...
netsh advfirewall show allprofiles state
echo.

echo ========================================
echo  INSTRUCCIONES DE PRUEBA DESDE CLIENTE
echo ========================================
echo.
echo Desde el dispositivo 192.168.15.26, ejecuta:
echo.
echo   1. Abre el navegador y ve a: http://192.168.15.22:3012
echo.
echo   2. Si no funciona, desde CMD en ese dispositivo ejecuta:
echo      ping 192.168.15.22
echo      telnet 192.168.15.22 3012
echo.
echo   3. Si ping funciona pero telnet no, el firewall bloquea el puerto
echo.
echo ========================================
echo  RECOMENDACIONES
echo ========================================
echo.
echo - Asegurate que el servidor este corriendo (node server.js)
echo - Verifica que ambos dispositivos esten en la misma red
echo - Revisa el aislamiento AP en el router
echo - Prueba desactivar temporalmente el firewall para diagnosticar
echo.
pause
