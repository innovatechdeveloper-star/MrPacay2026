@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║       TEST ROTULADO DINÁMICO - GODEX G530 300 DPI     ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📋 PRUEBAS DISPONIBLES:
echo.
echo    1. COMPLETO CON CORTE
echo    2. COMPLETO SIN CORTE
echo    3. SIN LOGO CAMITEX
echo    4. SIN ICONOS
echo    5. SIN LOGO MISTI
echo    6. SOLO TEXTO (sin logos ni iconos)
echo    7. SOLO TEXTO CON CORTE
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p PRUEBA="Selecciona número de prueba (1-7): "
set /p CANTIDAD="Cantidad de etiquetas a imprimir: "

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

node test-rotulado-dinamico.js %PRUEBA% %CANTIDAD%

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause
