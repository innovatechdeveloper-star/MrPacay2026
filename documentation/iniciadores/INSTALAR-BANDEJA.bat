@echo off
REM ====================================================================
REM 📦 INSTALADOR DE DEPENDENCIAS - Sistema Etiquetas Bandeja
REM ====================================================================

echo.
echo ========================================
echo   Instalador Sistema Etiquetas Bandeja
echo ========================================
echo.

cd /d "%~dp0\bandeja"

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo Versión recomendada: LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version
echo.

REM Verificar npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm no está disponible
    echo.
    pause
    exit /b 1
)

echo ✅ npm encontrado
npm --version
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   📦 DEPENDENCIAS A INSTALAR:
echo.
echo   • electron ^27.0.0      (~200 MB)
echo   • electron-builder      (~50 MB)
echo   • node-notifier         (~5 MB)
echo.
echo   Total: ~255 MB
echo   Tiempo estimado: 3-10 minutos
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📦 Instalando dependencias de Node.js...
echo.

REM Instalar dependencias
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ Instalación Completada
    echo ========================================
    echo.
    echo Ahora puedes:
    echo   1. Ejecutar: EJECUTAR-SISTEMA-ETIQUETAS.bat
    echo   2. O compilar a .exe: cd bandeja ^&^& npm run build:win
    echo.
    echo Para configurar inicio automático con Windows:
    echo   1. Ejecuta el .bat
    echo   2. Clic derecho en icono de bandeja
    echo   3. Configuración → Iniciar con Windows
    echo.
) else (
    echo.
    echo ❌ Error durante la instalación
    echo.
    echo Intenta ejecutar manualmente:
    echo   cd bandeja
    echo   npm install
    echo.
)

pause
