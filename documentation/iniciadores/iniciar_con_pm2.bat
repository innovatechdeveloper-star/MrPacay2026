@echo off
REM ============================================
REM INICIAR CON PM2 - MI-APP-ETIQUETAS
REM Auto-reinicio automático
REM ============================================

echo.
echo ============================================
echo   INICIANDO CON PM2 - AUTO-REINICIO
echo ============================================
echo.

REM Verificar si PM2 está instalado
pm2 --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PM2 no está instalado
    echo Instala PM2 con: npm install -g pm2
    echo.
    echo Iniciando sin PM2...
    goto :normal_start
)

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no está instalado
    pause
    exit /b 1
)

echo Iniciando con PM2...
cd /d "%~dp0"

REM Detener instancia anterior si existe
pm2 delete mi-app-etiquetas 2>nul

REM Iniciar con PM2
pm2 start server.js --name mi-app-etiquetas

REM Guardar configuración
pm2 save

REM Iniciar PM2 al arranque del sistema
pm2 startup

echo.
echo ✅ Servidor iniciado con PM2
echo ✅ Auto-reinicio activado
echo.
echo Comandos útiles:
echo   pm2 status          - Ver estado
echo   pm2 logs            - Ver logs
echo   pm2 restart mi-app-etiquetas - Reiniciar
echo   pm2 stop mi-app-etiquetas    - Detener
echo.

goto :end

:normal_start
echo Iniciando servidor normalmente...
node server.js

:end
pause