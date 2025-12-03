@echo off
setlocal enabledelayedexpansion

echo ============================================
echo LIMPIAR SOLICITUDES ATASCADAS
echo ============================================
echo.

REM Configurar credenciales
set PGPASSWORD=alsimtex
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo IMPORTANTE: Este script va a:
echo 1. Completar solicitudes en 'proceso' que tienen mas de 1 hora
echo 2. Marcar como error trabajos de impresion antiguos
echo 3. Limpiar la cola de impresion
echo.
echo Presiona Ctrl+C para cancelar, o
pause

echo.
echo Completando solicitudes antiguas en 'proceso'...
%PSQL% -U postgres -d postgres -c "UPDATE solicitudes_etiquetas SET estado = 'completada', fecha_completado = NOW() WHERE estado = 'proceso' AND fecha_creacion < NOW() - INTERVAL '1 hour';"

echo.
echo Marcando trabajos de impresion antiguos como error...
%PSQL% -U postgres -d postgres -c "UPDATE cola_impresion SET estado = 'error', error_mensaje = 'Timeout - trabajo antiguo' WHERE estado = 'pendiente' AND fecha_creacion < NOW() - INTERVAL '1 hour';"

echo.
echo Limpiando cola de impresion (errores y completadas)...
%PSQL% -U postgres -d postgres -c "DELETE FROM cola_impresion WHERE estado IN ('error', 'impresa') AND fecha_creacion < NOW() - INTERVAL '1 day';"

echo.
echo ============================================
echo LIMPIEZA COMPLETADA
echo ============================================
echo.
echo Verificando estado actual...
echo.

%PSQL% -U postgres -d postgres -c "SELECT estado, COUNT(*) as cantidad FROM solicitudes_etiquetas GROUP BY estado ORDER BY estado;"

echo.
pause
