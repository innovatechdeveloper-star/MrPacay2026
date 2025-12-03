@echo off
echo ========================================
echo    CALIBRACION AUTOMATICA GODEX G530
echo ========================================
echo.
echo Enviando comandos a 192.168.1.35:9100...
echo.

node calibrar-godex.js

echo.
echo Calibracion completada.
echo Si la luz sigue roja, presiona FEED en la impresora 3 veces.
echo.
timeout /t 3 /nobreak >nul
