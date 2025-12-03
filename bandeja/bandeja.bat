@echo off
REM ====================================================================
REM 🏷️ SISTEMA ETIQUETAS - BANDEJA (LANZADOR INVISIBLE)
REM ====================================================================
REM Este archivo ejecuta la aplicación COMPLETAMENTE OCULTA
REM No muestra CMD, no muestra ventanas, no interrumpe al usuario
REM ====================================================================
REM
REM PARA SHELL:STARTUP:
REM 1. Win + R → "shell:startup"
REM 2. Copiar este archivo .bat ahí
REM 3. Al reiniciar PC → Aplicación inicia invisible automáticamente
REM
REM ⚠️ IMPORTANTE: CAMBIAR LA RUTA ABAJO ANTES DE USAR ⚠️
REM
REM ====================================================================

REM ⚠️⚠️⚠️ CAMBIAR ESTA RUTA A TU UBICACIÓN ⚠️⚠️⚠️
REM Ruta COMPLETA hasta la carpeta "bandeja" del proyecto
set PROJECT_DIR=d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
REM ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

REM Cambiar al directorio del proyecto
cd /d "%PROJECT_DIR%"

REM Verificar que el directorio existe
if not exist "%PROJECT_DIR%\main.js" (
    echo ERROR: No se encuentra el proyecto en %PROJECT_DIR%
    exit /b 1
)

REM Verificar Node.js (en silencio)
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    exit /b 1
)

REM Verificar si node_modules existe
if not exist "node_modules" (
    REM Intentar instalar dependencias en segundo plano
    start /min cmd /c "cd /d %PROJECT_DIR% && npm install"
    timeout /t 3 /nobreak >nul
)

REM Crear script VBS temporal para ejecutar completamente oculto
set "VBS_TEMP=%TEMP%\bandeja_oculto.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_TEMP%"
echo WshShell.Run "cmd /c cd /d ""%PROJECT_DIR%"" && npm start", 0, False >> "%VBS_TEMP%"

REM Ejecutar VBS (ventana completamente invisible)
cscript //nologo "%VBS_TEMP%"

REM Eliminar VBS temporal
del "%VBS_TEMP%" 2>nul

REM Salir inmediatamente
exit
