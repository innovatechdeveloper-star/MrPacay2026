@echo off
chcp 65001 >nul
echo ====================================================
echo    CREAR TABLA cola_impresion_rotulado
echo ====================================================
echo.

set PGPASSWORD=1234

echo 🔄 Ejecutando migración...
psql -U postgres -d etiquetas_bd -f migrations\crear_tabla_cola_rotulado.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ¡Tabla creada exitosamente!
) else (
    echo.
    echo ❌ Error al crear la tabla
)

echo.
pause
