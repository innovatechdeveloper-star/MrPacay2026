@echo off
chcp 65001 >nul
cls

echo ============================================
echo    VISOR DE LOGS EN TIEMPO REAL
echo ============================================
echo.
echo Seleccione qué log desea monitorear:
echo.
echo [1] DATABASE   - Consultas y errores de PostgreSQL
echo [2] PRINTER    - Impresión y comunicación con Zebra
echo [3] SERVER     - Peticiones HTTP y eventos del servidor
echo [4] ERRORS     - Solo errores críticos
echo [5] SECURITY   - Intentos de login y seguridad
echo [6] COMBINED   - Todos los logs mezclados
echo [7] TODOS      - Mostrar todos en paralelo (4 ventanas)
echo.
echo [0] Salir
echo.
set /p opcion="Ingrese su opción: "

if "%opcion%"=="1" goto database
if "%opcion%"=="2" goto printer
if "%opcion%"=="3" goto server
if "%opcion%"=="4" goto errors
if "%opcion%"=="5" goto security
if "%opcion%"=="6" goto combined
if "%opcion%"=="7" goto todos
if "%opcion%"=="0" goto fin

:database
cls
echo ============================================
echo   LOGS DE BASE DE DATOS (DATABASE.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\database.log' -Wait -Tail 50"
goto fin

:printer
cls
echo ============================================
echo   LOGS DE IMPRESORA (PRINTER.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\printer.log' -Wait -Tail 50"
goto fin

:server
cls
echo ============================================
echo   LOGS DEL SERVIDOR (SERVER.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\server.log' -Wait -Tail 50"
goto fin

:errors
cls
echo ============================================
echo   SOLO ERRORES (ERRORS.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\errors.log' -Wait -Tail 50"
goto fin

:security
cls
echo ============================================
echo   LOGS DE SEGURIDAD (SECURITY.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\security.log' -Wait -Tail 50"
goto fin

:combined
cls
echo ============================================
echo   TODOS LOS LOGS (COMBINED.LOG)
echo ============================================
echo Presione Ctrl+C para detener
echo.
powershell -Command "Get-Content -Path 'logs\combined.log' -Wait -Tail 50"
goto fin

:todos
echo Abriendo 4 ventanas de monitoreo...
start "DATABASE LOGS" cmd /k "powershell -Command \"Get-Content -Path 'logs\database.log' -Wait -Tail 30\""
timeout /t 1 >nul
start "PRINTER LOGS" cmd /k "powershell -Command \"Get-Content -Path 'logs\printer.log' -Wait -Tail 30\""
timeout /t 1 >nul
start "SERVER LOGS" cmd /k "powershell -Command \"Get-Content -Path 'logs\server.log' -Wait -Tail 30\""
timeout /t 1 >nul
start "ERRORS ONLY" cmd /k "powershell -Command \"Get-Content -Path 'logs\errors.log' -Wait -Tail 30\""
echo.
echo ✅ 4 ventanas de logs abiertas
goto fin

:fin
echo.
pause
