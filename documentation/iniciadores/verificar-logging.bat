@echo off
chcp 65001 >nul
cls

echo ============================================
echo   VERIFICACIÓN DE SISTEMA DE LOGGING
echo ============================================
echo.

set ERRORES=0

REM Verificar archivo logger.js
if exist "logger.js" (
    echo ✅ logger.js encontrado
) else (
    echo ❌ logger.js NO encontrado
    set /a ERRORES+=1
)

REM Verificar directorio logs
if exist "logs" (
    echo ✅ Directorio logs/ existe
) else (
    echo ⚠️  Directorio logs/ no existe (se creará al iniciar servidor)
)

REM Verificar scripts bat
if exist "ver-logs.bat" (
    echo ✅ ver-logs.bat encontrado
) else (
    echo ❌ ver-logs.bat NO encontrado
    set /a ERRORES+=1
)

if exist "verificacion-rapida.bat" (
    echo ✅ verificacion-rapida.bat encontrado
) else (
    echo ❌ verificacion-rapida.bat NO encontrado
    set /a ERRORES+=1
)

if exist "verificar-bd.bat" (
    echo ✅ verificar-bd.bat encontrado
) else (
    echo ❌ verificar-bd.bat NO encontrado
    set /a ERRORES+=1
)

REM Verificar monitor web
if exist "public\monitor-sistema.html" (
    echo ✅ monitor-sistema.html encontrado
) else (
    echo ❌ monitor-sistema.html NO encontrado
    set /a ERRORES+=1
)

REM Verificar documentación
if exist "DOCUMENTACION-LOGGING.md" (
    echo ✅ DOCUMENTACION-LOGGING.md encontrado
) else (
    echo ❌ DOCUMENTACION-LOGGING.md NO encontrado
    set /a ERRORES+=1
)

if exist "RESUMEN-LOGGING.md" (
    echo ✅ RESUMEN-LOGGING.md encontrado
) else (
    echo ❌ RESUMEN-LOGGING.md NO encontrado
    set /a ERRORES+=1
)

REM Verificar que logger esté importado en server.js
findstr /C:"require('./logger')" server.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ logger importado en server.js
) else (
    echo ❌ logger NO importado en server.js
    set /a ERRORES+=1
)

echo.
echo ============================================
echo   RESULTADOS
echo ============================================
echo.

if %ERRORES% EQU 0 (
    echo ✅ ✅ ✅ SISTEMA DE LOGGING CORRECTO ✅ ✅ ✅
    echo.
    echo Todos los archivos necesarios están presentes.
    echo.
    echo PRÓXIMOS PASOS:
    echo 1. Reiniciar servidor: node server.js
    echo 2. Abrir monitor web: http://localhost:3010/monitor-sistema.html
    echo 3. Ver logs en consola: .\ver-logs.bat
    echo 4. Probar impresión y verificar logs
) else (
    echo ❌ ❌ ❌ ERRORES ENCONTRADOS: %ERRORES% ❌ ❌ ❌
    echo.
    echo Algunos archivos están faltando.
    echo Por favor, verifica la instalación.
)

echo.
echo ============================================
echo   ARCHIVOS DE LOG ACTUALES
echo ============================================
echo.

if exist "logs" (
    dir /B logs\*.log 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo (No hay logs aún - se crearán al iniciar servidor)
    )
) else (
    echo (Directorio logs/ no existe)
)

echo.
pause
