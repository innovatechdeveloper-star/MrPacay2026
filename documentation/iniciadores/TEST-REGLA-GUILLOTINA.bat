@echo off
echo ====================================
echo   TEST GUILLOTINA - Regla de medicion
echo ====================================
echo.
echo Este test imprimira una regla con numeros
echo para medir exactamente donde corta la guillotina
echo.
echo ASEGURATE:
echo   1. Guillotina conectada
echo   2. Etiquetas cargadas
echo   3. Impresora encendida
echo.
pause
echo.
echo Ejecutando test...
node test-regla-guillotina.js
echo.
pause
