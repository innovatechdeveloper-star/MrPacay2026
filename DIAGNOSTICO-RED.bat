@echo off
:: =============================================
:: DIAGNOSTICO RAPIDO DE RED
:: Sistema de Etiquetas V2.5
:: =============================================

color 0A
title Diagnostico de Red - Sistema Etiquetas

echo.
echo ================================================
echo   DIAGNOSTICO DE RED - SISTEMA DE ETIQUETAS
echo ================================================
echo.

:: 1. Verificar IPs del servidor
echo [1/5] Verificando IPs del servidor...
echo.
ipconfig | findstr /C:"IPv4"
echo.
timeout /t 2 /nobreak >nul

:: 2. Verificar puerto 3012
echo [2/5] Verificando puerto 3012...
echo.
netstat -an | findstr ":3012"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Puerto 3012 esta escuchando
) else (
    echo [ADVERTENCIA] Puerto 3012 no esta escuchando
    echo Asegurate de que el servidor este corriendo con: node server.js
)
echo.
timeout /t 2 /nobreak >nul

:: 3. Verificar firewall
echo [3/5] Verificando regla de firewall...
echo.
netsh advfirewall firewall show rule name="Sistema Etiquetas - Puerto 3012" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Regla de firewall existe
) else (
    echo [ADVERTENCIA] Regla de firewall NO existe
    echo Ejecuta: ABRIR-PUERTO-FIREWALL.bat como Administrador
)
echo.
timeout /t 2 /nobreak >nul

:: 4. Probar conectividad a impresoras
echo [4/5] Probando conectividad con impresoras...
echo.
echo Probando Zebra ZD230 (192.168.15.34)...
ping -n 1 -w 1000 192.168.15.34 >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Zebra ZD230 responde
) else (
    echo [ADVERTENCIA] Zebra ZD230 no responde
)

echo Probando Godex G530 (192.168.15.35)...
ping -n 1 -w 1000 192.168.15.35 >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Godex G530 responde
) else (
    echo [ADVERTENCIA] Godex G530 no responde
)
echo.
timeout /t 2 /nobreak >nul

:: 5. Mostrar URLs de acceso
echo [5/5] URLs de acceso...
echo.

:: Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr "192.168"') do (
    set IP=%%a
)

:: Limpiar espacios
set IP=%IP: =%

if defined IP (
    echo ================================================
    echo   ACCEDE AL SISTEMA DESDE:
    echo ================================================
    echo.
    echo   Desde este PC:
    echo   http://localhost:3012
    echo.
    echo   Desde otros dispositivos en la red:
    echo   http://%IP%:3012
    echo.
    echo ================================================
) else (
    echo [ERROR] No se pudo obtener la IP local
)

echo.
echo ================================================
echo   DIAGNOSTICO COMPLETADO
echo ================================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
