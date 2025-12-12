@echo off
chcp 65001 > nul
echo ========================================
echo EJECUTAR MIGRACIÓN DE BASE DE DATOS
echo ========================================
echo.

set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe
set DB_NAME=postgres
set DB_USER=postgres

echo Ejecutando: base_data/MIGRACION-BITACORA-MEJORADA.sql
echo.

"%PSQL_PATH%" -U %DB_USER% -d %DB_NAME% -f "base_data/MIGRACION-BITACORA-MEJORADA.sql"

echo.
echo ========================================
echo MIGRACIÓN COMPLETADA
echo ========================================
echo.
pause
