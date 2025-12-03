@echo off
echo ============================================
echo VERIFICACION DE BASE DE DATOS
echo ============================================
echo.

set PGUSER=postgres
set PGPASSWORD=alsimtex
set DATABASE=postgres
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Verificando tablas existentes...
echo.

%PSQL% -U %PGUSER% -d %DATABASE% -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo.
echo ============================================
echo Verificando estructura de solicitudes_etiquetas...
echo ============================================
echo.

%PSQL% -U %PGUSER% -d %DATABASE% -c "\d solicitudes_etiquetas"

echo.
echo ============================================
echo Verificando estructura de productos_especiales...
echo ============================================
echo.

%PSQL% -U %PGUSER% -d %DATABASE% -c "\d productos_especiales"

echo.
echo ============================================
echo Contando registros...
echo ============================================
echo.

%PSQL% -U %PGUSER% -d %DATABASE% -c "SELECT 'Solicitudes' as tabla, COUNT(*) as cantidad FROM solicitudes_etiquetas UNION ALL SELECT 'Productos especiales', COUNT(*) FROM productos_especiales UNION ALL SELECT 'Cola pendiente', COUNT(*) FROM cola_impresion WHERE estado = 'pendiente' UNION ALL SELECT 'Cola total', COUNT(*) FROM cola_impresion;"

echo.
echo ============================================
echo Verificando solicitudes en estado 'proceso'...
echo ============================================
echo.

%PSQL% -U %PGUSER% -d %DATABASE% -c "SELECT numero_solicitud, estado, fecha_solicitud FROM solicitudes_etiquetas WHERE estado = 'proceso' ORDER BY fecha_solicitud DESC LIMIT 10;"

echo.
pause
