@echo off
REM ============================================
REM INICIAR SERVIDOR DESARROLLO - PUERTO 3011
REM ============================================

echo.
echo ============================================
echo   INICIANDO SERVIDOR DESARROLLO (PUERTO 3011)
echo ============================================
echo.
echo IMPORTANTE: Esta es la copia de desarrollo
echo El servidor productivo sigue en puerto 3010
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si PostgreSQL está corriendo
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: PostgreSQL no parece estar ejecutándose
    echo Asegúrate de que PostgreSQL esté corriendo
    timeout /t 3 >nul
)

echo Iniciando servidor desarrollo en puerto 3011...
cd /d "%~dp0"

REM Mostrar configuración
echo.
echo Configuración del servidor:
echo   - Puerto: 3011 (desarrollo)
echo   - Base de datos: PostgreSQL localhost:5432
echo   - Zebra: 192.168.1.34:9100
echo   - Godex: 192.168.1.35:9100
echo.

node server.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo   SERVIDOR INICIADO CORRECTAMENTE
    echo ============================================
    echo.
    echo Acceso web:
    echo   - Local: http://localhost:3011
    echo   - Red:   http://%COMPUTERNAME%:3011
    echo.
) else (
    echo.
    echo ❌ Error al iniciar el servidor
    echo Revisa los logs para más información
)

pause