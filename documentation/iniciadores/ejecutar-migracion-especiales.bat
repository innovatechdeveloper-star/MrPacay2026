@echo off
chcp 65001 >nul
echo ==========================================
echo  🔧 MIGRACIÓN: Productos Especiales
echo ==========================================
echo.
echo Este script agregará los campos necesarios para
echo soportar productos especiales (JUEGOS/COMBOS)
echo en las solicitudes de etiquetas.
echo.
echo Campos a agregar:
echo   - id_producto_especial
echo   - numero_solicitud_grupo
echo.
pause

echo.
echo 📝 Ejecutando migración con Node.js...
echo.

node ejecutar-migracion-node.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Proceso completado
    echo.
) else (
    echo.
    echo ❌ Hubo un error en el proceso
    echo.
)

echo.
pause
