@echo off
echo ========================================
echo  SOLUCION RAPIDA - ACCESO DESDE RED
echo  Puerto 3012
echo ========================================
echo.
echo Eliminando reglas antiguas...
netsh advfirewall firewall delete rule name="Sistema Etiquetas - Puerto 3012" >nul 2>&1
netsh advfirewall firewall delete rule name="Sistema Etiquetas - Puerto 3012 - ENTRADA" >nul 2>&1
netsh advfirewall firewall delete rule name="Sistema Etiquetas - Puerto 3012 - SALIDA" >nul 2>&1
netsh advfirewall firewall delete rule name="Node.js: Server-side JavaScript" >nul 2>&1

echo.
echo Creando reglas de firewall PERMISIVAS...
netsh advfirewall firewall add rule name="Sistema Etiquetas 3012 - TCP IN" dir=in action=allow protocol=TCP localport=3012 profile=private,domain,public enable=yes
netsh advfirewall firewall add rule name="Sistema Etiquetas 3012 - TCP OUT" dir=out action=allow protocol=TCP localport=3012 profile=private,domain,public enable=yes
netsh advfirewall firewall add rule name="Sistema Etiquetas 3012 - UDP IN" dir=in action=allow protocol=UDP localport=3012 profile=private,domain,public enable=yes
netsh advfirewall firewall add rule name="Sistema Etiquetas 3012 - UDP OUT" dir=out action=allow protocol=UDP localport=3012 profile=private,domain,public enable=yes

echo.
echo Permitiendo Node.js en firewall...
for /f "tokens=*" %%a in ('where node.exe 2^>nul') do (
    netsh advfirewall firewall add rule name="Node.js Sistema Etiquetas" dir=in action=allow program="%%a" enable=yes profile=any
)

echo.
echo Configurando red como PRIVADA (mas permisiva)...
powershell -Command "Set-NetConnectionProfile -NetworkCategory Private"

echo.
echo Verificando configuracion...
netsh advfirewall firewall show rule name=all | findstr /i "Sistema Etiquetas 3012"

echo.
echo ========================================
echo  CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Reglas creadas para:
echo   - TCP entrada/salida puerto 3012
echo   - UDP entrada/salida puerto 3012
echo   - Node.js permitido en todos los perfiles
echo   - Red configurada como Privada
echo.
echo Ahora prueba acceder desde 192.168.15.26:
echo   http://192.168.15.22:3012
echo.
echo Si aun no funciona, ejecuta: DIAGNOSTICO-CONEXION-COMPLETO.bat
echo.
pause
