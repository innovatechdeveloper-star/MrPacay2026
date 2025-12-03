@echo off
echo ========================================
echo EJECUTANDO MIGRACIONES ROTULADO GODEX
echo ========================================
echo.

echo [1/2] Agregando columna rotulado_impreso...
psql -U postgres -d alsimtex -f "migrations\add_rotulado_impreso.sql"
if %errorlevel% neq 0 (
    echo ERROR: Fallo al agregar columna rotulado_impreso
    pause
    exit /b 1
)
echo.

echo [2/2] Agregando campos codigo_producto y unidad_medida...
psql -U postgres -d alsimtex -f "migrations\add_barcode_fields_to_cola_rotulado.sql"
if %errorlevel% neq 0 (
    echo ERROR: Fallo al agregar campos de codigo de barras
    pause
    exit /b 1
)
echo.

echo ========================================
echo MIGRACIONES COMPLETADAS EXITOSAMENTE
echo ========================================
echo.
echo Sistema listo para:
echo - Rastrear estado de impresion (rotulado_impreso)
echo - Registrar datos completos de codigo de barras
echo.
pause
