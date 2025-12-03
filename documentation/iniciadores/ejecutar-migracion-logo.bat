@echo off
chcp 65001 >nul
echo ================================================
echo   MIGRACION: Logo Principal Dinamico
echo ================================================
echo.

SET PGPASSWORD=1234
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d etiquetas_db -c "ALTER TABLE solicitudes_etiquetas ADD COLUMN logo_principal VARCHAR(50) DEFAULT 'camitex';"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d etiquetas_db -c "UPDATE solicitudes_etiquetas SET logo_principal = CASE WHEN config_logo_camitex = true THEN 'camitex' WHEN config_logo_camitex = false THEN 'sin_logo' ELSE 'camitex' END;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d etiquetas_db -c "ALTER TABLE solicitudes_etiquetas DROP COLUMN config_logo_camitex;"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d etiquetas_db -c "SELECT logo_principal, COUNT(*) as cantidad FROM solicitudes_etiquetas GROUP BY logo_principal ORDER BY cantidad DESC;"

echo.
echo ================================================
echo   MIGRACION COMPLETADA
echo ================================================
pause
