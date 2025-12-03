@echo off
chcp 65001 > nul
echo =====================================================
echo 🏷️  AGREGAR COLUMNAS DE IMPRESIÓN
echo =====================================================
echo.
echo Este script agregará las columnas:
echo   - rotulado_impreso (BOOLEAN)
echo   - qr_impreso (BOOLEAN)
echo.
echo a la tabla solicitudes_etiquetas
echo.
pause

echo.
echo 📋 Ejecutando migración...
psql -U postgres -d postgres -f AGREGAR-COLUMNAS-IMPRESION.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================
    echo ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
    echo =====================================================
    echo.
    echo Las columnas han sido agregadas correctamente.
    echo Ya puedes ver los indicadores de impresión en la interfaz.
) else (
    echo.
    echo =====================================================
    echo ❌ ERROR EN LA MIGRACIÓN
    echo =====================================================
    echo.
    echo Por favor verifica:
    echo   1. PostgreSQL está corriendo
    echo   2. Las credenciales son correctas
    echo   3. La base de datos 'mi_app_etiquetas' existe
)

echo.
pause
