@echo off
setlocal enabledelayedexpansion

echo ============================================
echo VERIFICACION RAPIDA DE BASE DE DATOS
echo ============================================
echo.

REM Configurar credenciales
set PGPASSWORD=alsimtex
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Verificando tablas...
echo.

%PSQL% -U postgres -d postgres -c "SELECT COUNT(*) as solicitudes FROM solicitudes_etiquetas; SELECT COUNT(*) as cola_pendiente FROM cola_impresion WHERE estado = 'pendiente';"

echo.
echo ============================================
echo Solicitudes en PROCESO (no completadas):
echo ============================================
echo.

%PSQL% -U postgres -d postgres -c "SELECT numero_solicitud, estado, fecha_solicitud FROM solicitudes_etiquetas WHERE estado = 'proceso' ORDER BY fecha_solicitud DESC LIMIT 5;"

echo.
echo ============================================
echo Cola de impresion PENDIENTE:
echo ============================================
echo.

%PSQL% -U postgres -d postgres -c "SELECT id, numero_solicitud, estado, fecha_creacion FROM cola_impresion WHERE estado = 'pendiente' ORDER BY fecha_creacion DESC LIMIT 5;"

echo.
pause
