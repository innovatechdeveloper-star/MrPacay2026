@echo off
REM ====================================================================
REM 📌 AGREGAR SISTEMA ETIQUETAS AL INICIO DE WINDOWS
REM ====================================================================
REM Crea acceso directo en shell:startup
REM ====================================================================

echo.
echo ========================================
echo   Agregar al Inicio de Windows
echo ========================================
echo.

REM Obtener ruta de la carpeta Startup
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo 📂 Carpeta Startup: %STARTUP%
echo.

REM Crear acceso directo usando PowerShell
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP%\Sistema Etiquetas.lnk'); $Shortcut.TargetPath = '%~dp0EJECUTAR-SISTEMA-ETIQUETAS.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Sistema Etiquetas v2.5 - Bandeja'; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ ACCESO DIRECTO CREADO
    echo ========================================
    echo.
    echo El Sistema Etiquetas se iniciará automáticamente
    echo cada vez que inicies sesión en Windows.
    echo.
    echo Ubicación:
    echo %STARTUP%\Sistema Etiquetas.lnk
    echo.
    echo Para verificar:
    echo   1. Win + R
    echo   2. Escribe: shell:startup
    echo   3. Enter
    echo.
    echo Para QUITAR del inicio:
    echo   - Elimina el acceso directo de esa carpeta
    echo.
) else (
    echo.
    echo ❌ Error creando el acceso directo
    echo.
    echo Intenta el método manual:
    echo   1. Win + R → shell:startup
    echo   2. Crear acceso directo manualmente
    echo.
)

pause
