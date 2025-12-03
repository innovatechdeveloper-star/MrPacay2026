@echo off
REM ====================================================================
REM 🎨 CONVERTIR ESCRITORIO.PNG A ICON.ICO
REM ====================================================================

echo.
echo ========================================
echo   Convertir Imagen a Icono
echo ========================================
echo.

cd /d "%~dp0"

REM Instalar dependencia para conversión
echo 📦 Instalando herramienta de conversión...
call npm install sharp --no-save

echo.
echo 🔄 Convirtiendo imagen...
echo.

REM Ejecutar conversión
node convertir-icono.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ CONVERSIÓN EXITOSA
    echo ========================================
    echo.
    echo El archivo icon.ico ha sido creado
    echo.
    echo Para ver el nuevo icono:
    echo   1. Cierra la aplicación si está corriendo
    echo   2. Ejecuta: npm start
    echo.
) else (
    echo.
    echo ❌ Error durante la conversión
    echo.
)

pause
