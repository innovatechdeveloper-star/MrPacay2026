@echo off
echo ========================================
echo  MONITOR DE LOGS EN TIEMPO REAL
echo  Sistema de Etiquetas - Puerto 3012
echo ========================================
echo.
echo Mostrando logs del servidor Node.js...
echo Presiona Ctrl+C para detener
echo.
echo ========================================
echo.

REM Filtrar solo los procesos de Node.js en puerto 3012
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3012"') do (
    set PID=%%a
    goto :found
)

:found
if defined PID (
    echo Puerto 3012 encontrado - PID: %PID%
    echo.
    echo NOTA: Este script solo muestra el estado.
    echo Para ver logs en tiempo real, usa:
    echo   1. Abre la consola donde corre 'node server.js'
    echo   2. O revisa el archivo de logs en la carpeta 'logs/'
    echo.
) else (
    echo ERROR: No se encontro proceso escuchando en puerto 3012
    echo El servidor puede no estar corriendo.
    echo.
)

echo ========================================
echo  ULTIMOS REGISTROS DE IMPRESION
echo ========================================
echo.

REM Verificar si existe la carpeta logs
if exist "logs\" (
    echo Ultimos 20 registros del servidor:
    echo.
    powershell -Command "if (Test-Path 'logs\server*.log') { Get-Content 'logs\server*.log' -Tail 20 } else { Write-Host 'No hay archivos de log disponibles' }"
) else (
    echo Carpeta 'logs/' no encontrada.
)

echo.
pause
