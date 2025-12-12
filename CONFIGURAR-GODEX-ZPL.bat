@echo off
echo ========================================
echo  CONFIGURAR GODEX G530 - MODO ZPL
echo ========================================
echo.
echo Este script cambiara la impresora de EZPL a ZPL
echo para que acepte los comandos del sistema.
echo.
echo IMPORTANTE: Asegurate de que la impresora este:
echo   [x] Encendida
echo   [x] Conectada a la red
echo   [x] IP: 192.168.15.35
echo.
pause
echo.
echo Ejecutando configuracion...
node configurar-godex-zpl.js
echo.
pause
