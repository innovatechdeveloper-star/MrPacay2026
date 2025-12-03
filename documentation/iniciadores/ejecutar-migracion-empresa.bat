@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 EJECUTAR MIGRACIÓN: Columna EMPRESA
echo ========================================
echo.

REM Leer configuración
for /f "tokens=1,2 delims==" %%a in (system.config) do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
)

echo 📊 Aplicando migración: add_empresa_column_to_productos.sql
echo.

REM Ejecutar migración
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "migrations\add_empresa_column_to_productos.sql"

if errorlevel 1 (
    echo.
    echo ❌ ERROR: La migración falló
    pause
    exit /b 1
)

echo.
echo ✅ Migración completada exitosamente
echo.
echo 📋 Verificando cambios...
echo.

REM Verificar que la columna existe
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'empresa';"

echo.
echo ✅ LISTO! La columna 'empresa' ha sido agregada a la tabla productos
echo 📌 Valor por defecto: "HECHO EN PERU"
echo.
pause
