@echo off
REM ============================================
REM SCRIPT DE INSTALACIÓN - PERSONALIZACIÓN v2.1.0
REM ============================================

echo.
echo ============================================
echo   INSTALACION DE PERSONALIZACION POR GENERO
echo   Version 2.1.0
echo ============================================
echo.

REM Paso 1: Migración SQL
echo [PASO 1/4] Ejecutando migracion SQL...
echo.
echo IMPORTANTE: Asegurate de que PostgreSQL este corriendo
echo.
pause

psql -U postgres -d postgres -f migrations\add_genero_column.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo ejecutar la migracion SQL
    echo Por favor ejecuta manualmente:
    echo psql -U postgres -d postgres -f migrations\add_genero_column.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Migracion SQL completada
echo.

REM Paso 2: Verificar archivos
echo [PASO 2/4] Verificando archivos creados...
echo.

if not exist "public\theme-system.js" (
    echo ERROR: Falta public\theme-system.js
    pause
    exit /b 1
)
echo ✓ theme-system.js encontrado

if not exist "public\gender-themes.css" (
    echo ERROR: Falta public\gender-themes.css
    pause
    exit /b 1
)
echo ✓ gender-themes.css encontrado

echo.
echo ✓ Todos los archivos necesarios estan presentes
echo.

REM Paso 3: Información de integración
echo [PASO 3/4] Proximos pasos manuales:
echo.
echo Debes agregar en CADA dashboard (costurera, supervisor, admin):
echo.
echo 1. En el ^<head^> de cada HTML:
echo    ^<link rel="stylesheet" href="gender-themes.css"^>
echo    ^<script src="theme-system.js" defer^>^</script^>
echo.
echo 2. En el header (junto al toggle de tema):
echo    ^<div class="decorations-toggle" onclick="toggleDecorations()" title="Decoraciones"^>
echo        ^<span id="decorations-toggle-icon"^>✨^</span^>
echo    ^</div^>
echo.
echo 3. En administracion-mejorado.html (formulario usuarios):
echo    Agregar campo select para genero:
echo    ^<select id="genero-usuario"^>
echo        ^<option value="femenino"^>Femenino^</option^>
echo        ^<option value="masculino"^>Masculino^</option^>
echo    ^</select^>
echo.

pause

REM Paso 4: Actualizar versión
echo.
echo [PASO 4/4] Actualizando version a 2.1.0...
echo.

REM Crear respaldo de package.json
if exist package.json (
    copy package.json package.json.bak >nul
    echo ✓ Respaldo de package.json creado
)

echo.
echo NOTA: Recuerda actualizar manualmente:
echo - package.json: "version": "2.1.0"
echo - setup-mejorado.iss: #define MyAppVersion "2.1.0"
echo.

pause

REM Resumen final
echo.
echo ============================================
echo   INSTALACION COMPLETADA
echo ============================================
echo.
echo ✓ Migracion SQL ejecutada
echo ✓ Archivos JS/CSS creados
echo.
echo PENDIENTE (MANUAL):
echo [ ] Agregar referencias en HTMLs
echo [ ] Agregar boton de decoraciones
echo [ ] Agregar campo genero en form usuarios
echo [ ] Actualizar version a 2.1.0
echo [ ] Probar con usuario femenino y masculino
echo.
echo Lee el archivo PERSONALIZACION-GENERO.md para mas detalles
echo.

pause
