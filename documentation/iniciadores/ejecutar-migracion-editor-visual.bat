@echo off
chcp 65001 >nul
echo ========================================
echo 🎨 MIGRACIÓN: Tabla Editor Visual
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

echo 📊 Creando tabla: plantillas_etiquetas
echo.

REM Ejecutar migración
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "migrations\create_plantillas_etiquetas.sql"

if errorlevel 1 (
    echo.
    echo ❌ ERROR: La migración falló
    pause
    exit /b 1
)

echo.
echo ✅ Migración completada exitosamente
echo.
echo 📋 Verificando tabla creada...
echo.

REM Verificar tabla
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT id_plantilla, nombre_plantilla, ancho_dots, alto_dots, es_default FROM plantillas_etiquetas;"

echo.
echo ✅ LISTO! Sistema de Editor Visual preparado
echo 📌 Plantilla por defecto creada
echo.
pause
