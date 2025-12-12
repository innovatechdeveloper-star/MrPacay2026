@echo off
echo ========================================
echo  REINICIAR SERVIDOR PUERTO 3012
echo ========================================
echo.

echo [1] Buscando proceso en puerto 3012...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3012 ^| findstr LISTENING') do (
    echo    Proceso encontrado: PID %%a
    echo [2] Deteniendo proceso...
    taskkill /F /PID %%a
    timeout /t 2 /nobreak > nul
)

echo.
echo [3] Iniciando servidor nuevamente...
start "Sistema Etiquetas v2.5" cmd /k "cd /d "%~dp0" && node server.js"

echo.
echo ========================================
echo  SERVIDOR REINICIADO
echo ========================================
echo.
echo Espera 3 segundos y prueba:
echo   http://192.168.15.22:3012
echo.
echo Desde 192.168.15.26 ahora deberia funcionar
echo.
pause
