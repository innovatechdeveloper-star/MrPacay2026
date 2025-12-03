@echo off
REM =============================================
REM INICIO COMPLETO Y EFICIENTE DEL SISTEMA
REM =============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║   SISTEMA DE ETIQUETAS - INICIO RAPIDO    ║
echo ╚════════════════════════════════════════════╝
echo.

REM Verificar si PostgreSQL está corriendo
echo [1/4] Verificando PostgreSQL...
sc query postgresql-x64-17 | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  PostgreSQL no está corriendo. Iniciando...
    net start postgresql-x64-17
    timeout /t 3 /nobreak >nul
    echo ✅ PostgreSQL iniciado
) else (
    echo ✅ PostgreSQL ya está corriendo
)

echo.
echo [2/4] Verificando base de datos...
set PGPASSWORD=mrpacay2019
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -lqt | find "mi_app_etiquetas" >nul

if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Base de datos no existe. ¿Desea restaurar desde backup?
    echo.
    echo    1 = Si, restaurar desde mi-app-etiquetas-bu.sql
    echo    2 = No, crear base de datos vacia
    echo    3 = Cancelar
    echo.
    set /p opcion="   Seleccione [1-3]: "
    
    if "%opcion%"=="1" (
        echo.
        echo Restaurando desde backup...
        "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE mi_app_etiquetas;"
        "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -f mi-app-etiquetas-bu.sql
        echo ✅ Backup restaurado
    ) else if "%opcion%"=="2" (
        echo.
        echo Creando base de datos vacia...
        "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE mi_app_etiquetas;"
        "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d mi_app_etiquetas -f crear_base_datos.sql
        echo ✅ Base de datos creada
    ) else (
        echo.
        echo ❌ Operación cancelada
        pause
        exit /b 1
    )
) else (
    echo ✅ Base de datos existe
)

echo.
echo [3/4] Verificando servidor Node.js...
pm2 describe mi-app-etiquetas >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    REM Servidor ya existe en PM2
    pm2 show mi-app-etiquetas | find "online" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Servidor ya está corriendo
        echo.
        echo ¿Desea reiniciar el servidor?
        echo    1 = Si, reiniciar
        echo    2 = No, mantener como está
        echo.
        set /p restart="   Seleccione [1-2]: "
        if "%restart%"=="1" (
            pm2 restart mi-app-etiquetas
            echo ✅ Servidor reiniciado
        )
    ) else (
        echo ⚠️  Servidor existe pero no está corriendo. Iniciando...
        pm2 start mi-app-etiquetas
        echo ✅ Servidor iniciado
    )
) else (
    echo ⚠️  Servidor no está registrado en PM2. Iniciando...
    pm2 start server.js --name mi-app-etiquetas
    pm2 save
    echo ✅ Servidor iniciado y guardado
)

echo.
echo [4/4] Verificando estado del sistema...
timeout /t 2 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════╗
echo ║           ESTADO DEL SISTEMA              ║
echo ╚════════════════════════════════════════════╝
echo.

REM Mostrar estado de PostgreSQL
sc query postgresql-x64-17 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL: CORRIENDO
) else (
    echo ❌ PostgreSQL: DETENIDO
)

REM Mostrar estado del servidor
pm2 show mi-app-etiquetas | find "online" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Servidor Node.js: ONLINE
) else (
    echo ❌ Servidor Node.js: OFFLINE
)

REM Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip

echo.
echo ╔════════════════════════════════════════════╗
echo ║          ACCESO AL SISTEMA                ║
echo ╚════════════════════════════════════════════╝
echo.
echo 🌐 URLs de acceso:
echo    Local:     http://localhost:3010
echo    Red Local: http://%IP::=3010%
echo.
echo 👤 Usuario por defecto:
echo    Email:     admin@empresa.com
echo    Password:  admin123
echo.
echo 📊 Comandos útiles:
echo    pm2 logs mi-app-etiquetas    - Ver logs en tiempo real
echo    pm2 monit                    - Monitor de recursos
echo    pm2 restart mi-app-etiquetas - Reiniciar servidor
echo    pm2 stop mi-app-etiquetas    - Detener servidor
echo.

REM Preguntar si desea abrir el navegador
echo ¿Desea abrir el sistema en el navegador?
echo    1 = Si
echo    2 = No
echo.
set /p browser="Seleccione [1-2]: "

if "%browser%"=="1" (
    start http://localhost:3010
    echo.
    echo ✅ Abriendo navegador...
)

echo.
echo ════════════════════════════════════════════
echo   Sistema iniciado correctamente
echo ════════════════════════════════════════════
echo.

pause
