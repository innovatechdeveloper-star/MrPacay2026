@echo off
echo ============================================
echo EJECUTANDO MIGRACION DE BASE DE DATOS
echo ============================================
echo.

REM Establecer variables
set PGUSER=postgres
set PGPASSWORD=alsimtex
set DATABASE=postgres
set MIGRATION_FILE=migrations\MIGRACION-COMPLETA-PRODUCTOS-ESPECIALES.sql
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Conectando a PostgreSQL como %PGUSER%...
echo Base de datos: %DATABASE%
echo Archivo de migracion: %MIGRATION_FILE%
echo.

REM Ejecutar con psql
%PSQL% -U %PGUSER% -d %DATABASE% -f %MIGRATION_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo MIGRACION COMPLETADA EXITOSAMENTE
    echo ============================================
    echo.
    echo Tablas creadas/actualizadas:
    echo - solicitudes_etiquetas
    echo - productos_especiales
    echo - historial_solicitudes
    echo - cola_impresion
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR EN LA MIGRACION
    echo ============================================
    echo.
    echo Por favor verifica:
    echo 1. PostgreSQL esta instalado y en ejecucion
    echo 2. Las credenciales son correctas (usuario: %PGUSER%)
    echo 3. La base de datos '%DATABASE%' existe
    echo 4. La variable PGPASSWORD esta configurada
    echo.
)

pause
