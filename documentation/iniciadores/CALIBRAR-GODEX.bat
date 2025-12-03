@echo off
echo ========================================
echo    CALIBRACION IMPRESORA GODEX G530
echo ========================================
echo.
echo Este script enviara comandos de calibracion
echo a la impresora Godex en 192.168.1.35:9100
echo.
echo PASOS ANTES DE EJECUTAR:
echo 1. Asegurate que la impresora este ENCENDIDA
echo 2. Las etiquetas esten BIEN COLOCADAS
echo 3. La TAPA este CERRADA
echo.
pause

echo.
echo Enviando comandos de calibracion...
echo.

REM Crear archivo temporal con comandos ZPL
echo ^~C> calibrar.zpl
echo ^~S,SENSOR,0,MEDIA,WEB>> calibrar.zpl
echo ^~S,SET,SENSOR,TYPE,TRANS>> calibrar.zpl
echo ^~S,RELOAD>> calibrar.zpl

REM Enviar a la impresora via netcat (si esta disponible)
echo Intentando enviar comandos...
type calibrar.zpl | ncat 192.168.1.35 9100 2>nul

if %errorlevel% neq 0 (
    echo.
    echo ==========================================
    echo   METODO ALTERNATIVO - SCRIPT NODE.JS
    echo ==========================================
    node calibrar-godex.js
)

del calibrar.zpl 2>nul

echo.
echo ==========================================
echo   CALIBRACION COMPLETADA
echo ==========================================
echo.
echo Si la luz SIGUE EN ROJO:
echo.
echo 1. Apaga y enciende la impresora
echo 2. Abre la tapa y vuelve a cerrarla
echo 3. Presiona el boton FEED 3 veces
echo 4. Verifica que las etiquetas esten derechas
echo.
pause
