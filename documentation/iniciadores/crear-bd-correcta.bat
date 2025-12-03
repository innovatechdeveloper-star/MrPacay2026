@echo off
echo ============================================
echo   CREANDO BASE DE DATOS CORRECTA
echo ============================================
echo.

set PGPASSWORD=mrpacay2019

echo [1/2] Creando base de datos mi_app_etiquetas...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS mi_app_etiquetas;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE mi_app_etiquetas;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Base de datos creada
) else (
    echo ❌ Error creando base de datos
    pause
    exit /b 1
)

echo.
echo [2/2] Ejecutando script crear_base_datos.sql...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -f crear_base_datos.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Tablas creadas correctamente
) else (
    echo ❌ Error ejecutando script
    pause
    exit /b 1
)

echo.
echo [3/3] Ejecutando migraciones...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -f migrations\add_genero_column.sql

echo.
echo ============================================
echo   ✅ BASE DE DATOS LISTA
echo ============================================
echo.
echo Base de datos: mi_app_etiquetas
echo Usuario admin: admin@empresa.com
echo Contraseña: admin123
echo.

pause
