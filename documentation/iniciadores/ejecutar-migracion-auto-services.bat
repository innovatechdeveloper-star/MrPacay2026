@echo off
chcp 65001 >nul
echo ============================================
echo   MIGRACIÓN: Agregar columna auto_services
echo ============================================
echo.

REM Configuración de la base de datos (cambiar según tu sistema.config)
set PGPASSWORD=alsimtex
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=mi_app_etiquetas
set DB_USER=postgres

echo 📋 Ejecutando migración SQL...
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f migrations\add_auto_services_column.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migración ejecutada exitosamente
    echo.
    echo 📊 La columna 'auto_services' ha sido agregada a la tabla usuarios
    echo    - Tipo: BOOLEAN
    echo    - Valor por defecto: false
    echo.
) else (
    echo.
    echo ❌ Error al ejecutar la migración
    echo.
    echo Verifica:
    echo   1. PostgreSQL está corriendo
    echo   2. Las credenciales son correctas
    echo   3. La base de datos existe
    echo.
)

pause
