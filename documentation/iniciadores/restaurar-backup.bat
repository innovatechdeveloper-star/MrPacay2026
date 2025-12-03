@echo off
echo ============================================
echo   RESTAURANDO BASE DE DATOS DESDE BACKUP
echo ============================================
echo.

set PGPASSWORD=mrpacay2019

echo [1/3] Creando base de datos mi_app_etiquetas...
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
echo [2/3] Restaurando desde backup mi-app-etiquetas-bu.sql...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -f mi-app-etiquetas-bu.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup restaurado correctamente
) else (
    echo ❌ Error restaurando backup
    pause
    exit /b 1
)

echo.
echo [3/3] Verificando tablas creadas...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -c "\dt"

echo.
echo ============================================
echo   ✅ BASE DE DATOS RESTAURADA
echo ============================================
echo.
echo Base de datos: mi_app_etiquetas
echo Usuario admin: admin@empresa.com
echo Contraseña: admin123
echo.
echo Ahora puedes iniciar el servidor.
echo.

pause
