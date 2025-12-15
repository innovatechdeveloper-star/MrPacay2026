@echo off
chcp 65001 >nul
echo ========================================
echo   VERIFICAR Y CONFIGURAR GODEX G530
echo ========================================
echo.
echo Este script:
echo   1. Verifica que la Godex esté en modo ZPL
echo   2. Si NO está en ZPL, la reconfigura automáticamente
echo   3. Hace una prueba de impresión
echo.
echo Impresora: 192.168.15.35:9100
echo.
pause

echo.
echo [1/3] Verificando conexión...
ping -n 1 192.168.15.35 >nul
if %errorlevel% neq 0 (
    echo ❌ Impresora NO responde en 192.168.15.35
    echo    Verifica que esté encendida y conectada a la red
    pause
    exit /b 1
)
echo ✅ Impresora responde

echo.
echo [2/3] Configurando modo ZPL...
node forzar-zpl-godex.js
if %errorlevel% neq 0 (
    echo ❌ Error al configurar
    pause
    exit /b 1
)

echo.
echo ⚠️  IMPORTANTE: REINICIA LA IMPRESORA AHORA
echo    1. Apaga completamente (desconecta cable)
echo    2. Espera 10 segundos
echo    3. Mantén FEED presionado
echo    4. Conecta el cable (sin soltar FEED)
echo    5. Suelta FEED cuando parpadee
echo    6. Espera calibración automática
echo.
pause

echo.
echo [3/3] Probando impresión...
node test-godex-zpl.js
if %errorlevel% neq 0 (
    echo ❌ Error en prueba
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ GODEX CONFIGURADA Y LISTA
echo ========================================
echo.
echo Si la etiqueta salió en BLANCO:
echo   → La impresora sigue en modo EZPL
echo   → Repite el proceso de reinicio
echo.
echo Si la etiqueta tiene TEXTO:
echo   → ✅ Configuración exitosa
echo   → Ya puedes imprimir desde el sistema
echo.
pause
