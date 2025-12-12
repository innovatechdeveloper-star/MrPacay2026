@echo off
title CONFIGURAR ACCESO A RED ANTIGUA - Requiere Admin
color 0C

echo ============================================
echo   CONFIGURAR ACCESO TEMPORAL A 192.168.1.x
echo ============================================
echo.
echo Este script agregara una IP secundaria
echo en tu adaptador de red para acceder a
echo las impresoras en 192.168.1.x
echo.
echo NOTA: Requiere permisos de ADMINISTRADOR
echo.
pause

echo.
echo [1] Agregando IP secundaria 192.168.1.100...
netsh interface ipv4 add address "Ethernet" 192.168.1.100 255.255.255.0

if %errorlevel% == 0 (
    echo [OK] IP secundaria agregada correctamente
    echo.
    echo [2] Verificando conectividad...
    echo.
    
    echo Probando Godex (192.168.1.35)...
    ping 192.168.1.35 -n 2
    
    echo.
    echo Probando Zebra (192.168.1.34)...
    ping 192.168.1.34 -n 2
    
    echo.
    echo ============================================
    echo   ACCESO CONFIGURADO
    echo ============================================
    echo.
    echo Ahora puedes acceder a:
    echo   - Godex:  http://192.168.1.35
    echo   - Zebra:  http://192.168.1.34
    echo.
    echo Para REMOVER la IP secundaria despues:
    echo   netsh interface ipv4 delete address "Ethernet" 192.168.1.100
    echo.
) else (
    echo [ERROR] No se pudo agregar IP secundaria
    echo.
    echo Ejecuta este script como ADMINISTRADOR:
    echo 1. Click derecho en el archivo .bat
    echo 2. "Ejecutar como administrador"
    echo.
)

pause
