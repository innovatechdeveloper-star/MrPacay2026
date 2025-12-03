@echo off
echo ================================================
echo   MIGRACION: Logo Principal Dinamico
echo ================================================
echo.
echo Este script:
echo   1. Agrega columna logo_principal (VARCHAR)
echo   2. Migra datos de config_logo_camitex
echo   3. Elimina config_logo_camitex
echo.
echo Logos disponibles:
echo   - camitex (default)
echo   - algodon_100
echo   - maxima_suavidad
echo   - producto_peruano
echo   - sin_logo
echo.
pause

psql -U postgres -d etiquetas_db -f MIGRACION-LOGO-PRINCIPAL.sql

echo.
echo ================================================
echo   MIGRACION COMPLETADA
echo ================================================
pause
