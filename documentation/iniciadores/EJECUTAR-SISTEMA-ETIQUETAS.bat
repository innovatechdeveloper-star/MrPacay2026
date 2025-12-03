@echo off
REM ====================================================================
REM 🏷️ EJECUTAR SISTEMA ETIQUETAS - MODO BANDEJA
REM ====================================================================
REM Inicia la aplicación Electron de bandeja del sistema
REM ====================================================================

echo.
echo ========================================
echo   Sistema Etiquetas v2.5 - Bandeja
echo ========================================
echo.

cd /d "%~dp0\bandeja"

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version
echo.

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo ⚠️ Dependencias no instaladas
    echo Ejecutando instalador...
    echo.
    cd ..
    call INSTALAR-BANDEJA.bat
    cd bandeja
)

echo.
echo 🚀 Iniciando sistema de bandeja...
echo.
echo Busca el icono 🏷️ en la bandeja del sistema (junto al reloj)
echo Haz clic derecho para ver el menú
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   OPCIONES DEL MENÚ:
echo   🚀 Iniciar Servidor
echo   🛑 Detener Servidor
echo   🌐 Abrir Sistema
echo   📝 Ver Logs
echo   ⚙️ Configuración
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Ejecutar aplicación Electron
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error ejecutando la aplicación
    echo.
    pause
)
