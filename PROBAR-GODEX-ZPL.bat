@echo off
echo ========================================
echo  PROBAR GODEX G530 - ETIQUETA TEST
echo ========================================
echo.
echo Este script imprimira una etiqueta de prueba
echo para verificar que la impresora acepta ZPL.
echo.
echo Si la etiqueta sale EN BLANCO:
echo   - La impresora esta en modo EZPL
echo   - Ejecuta: CONFIGURAR-GODEX-ZPL.bat
echo.
echo Si la etiqueta sale CON TEXTO:
echo   - Todo funciona correctamente
echo   - Ya puedes usar el sistema
echo.
pause
echo.
node test-godex-zpl.js
pause
