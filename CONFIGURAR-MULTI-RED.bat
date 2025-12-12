@echo off
:: =============================================
:: CONFIGURAR SERVIDOR CON DOS REDES
:: Para acceso desde LAN (192.168.1.x) y Wireless (192.168.15.x)
:: =============================================

echo.
echo ================================================
echo   CONFIGURACION DE SERVIDOR MULTI-RED
echo ================================================
echo.
echo Este script te ayudara a configurar el servidor
echo para que sea accesible desde DOS redes diferentes:
echo.
echo   - Red 1 (LAN):      192.168.1.x
echo   - Red 2 (Wireless): 192.168.15.x
echo.
echo ================================================
echo.

echo Verificando adaptadores de red...
echo.
powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Format-Table Name, InterfaceDescription, Status"
echo.

echo ================================================
echo   OPCIONES DE CONFIGURACION
echo ================================================
echo.
echo Opcion 1: COMPARTIR INTERNET (Bridge)
echo   - Crea un puente entre ambos adaptadores
echo   - Mas simple, pero puede afectar configuracion
echo.
echo Opcion 2: IP ESTATICA EN AMBOS ADAPTADORES
echo   - Ethernet: 192.168.1.100
echo   - WiFi:     192.168.15.22
echo   - Servidor escuchara en ambas IPs
echo.
echo Opcion 3: COMPARTIR CONEXION (ICS)
echo   - Windows compartira la conexion automaticamente
echo.
echo ================================================
echo.

echo RECOMENDACION:
echo.
echo Si tienes control del router, es mejor configurar
echo el routing en el router para permitir comunicacion
echo entre las redes 192.168.1.x y 192.168.15.x
echo.
echo Contacta al administrador de red para:
echo   1. Habilitar routing entre subredes
echo   2. O unificar todas las redes en 192.168.15.x
echo.

pause
