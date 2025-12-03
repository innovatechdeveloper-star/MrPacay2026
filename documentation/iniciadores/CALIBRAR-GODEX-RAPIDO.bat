@echo off
echo ========================================
echo   CALIBRACION RAPIDA GODEX G530
echo   Etiqueta: 3cm x 5cm (300 DPI)
echo ========================================
echo.

echo 1. APAGA la impresora
echo 2. Mantén presionado el botón FEED
echo 3. ENCIENDE la impresora (sin soltar FEED)
echo 4. Suelta FEED cuando parpadee la luz
echo.
echo La impresora hará auto-calibración y expulsará varias etiquetas.
echo.
pause

echo.
echo ========================================
echo   CONFIGURACION MANUAL (si falla auto)
echo ========================================
echo.
echo En el software GoLabel o panel de control:
echo   - Label Width: 30 mm (354 dots)
echo   - Label Height: 50 mm (590 dots)
echo   - Gap/Black Mark: Gap
echo   - Media Type: Thermal Transfer
echo   - Speed: 5
echo   - Darkness: 10-15
echo.
pause
