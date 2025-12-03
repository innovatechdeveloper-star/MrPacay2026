@echo off
REM =============================================
REM ABRIR PUERTOS EN FIREWALL DE WINDOWS
REM Ejecutar como Administrador
REM =============================================

echo.
echo ============================================
echo   ABRIENDO PUERTOS EN FIREWALL
echo ============================================
echo.

echo [1/2] Abriendo puerto 5432 para PostgreSQL...
netsh advfirewall firewall add rule name="PostgreSQL Server" dir=in action=allow protocol=TCP localport=5432
if %ERRORLEVEL% EQU 0 (
    echo ✅ Puerto 5432 abierto exitosamente
) else (
    echo ❌ Error abriendo puerto 5432
)

echo.
echo [2/2] Abriendo puerto 3010 para Node.js Server...
netsh advfirewall firewall add rule name="Node.js Mi-App-Etiquetas" dir=in action=allow protocol=TCP localport=3010
if %ERRORLEVEL% EQU 0 (
    echo ✅ Puerto 3010 abierto exitosamente
) else (
    echo ❌ Error abriendo puerto 3010
)

echo.
echo ============================================
echo   CONFIGURACIÓN COMPLETADA
echo ============================================
echo.
echo Puertos abiertos:
echo   - Puerto 5432: PostgreSQL
echo   - Puerto 3010: Servidor Node.js
echo.
echo Ahora puedes conectarte desde otras máquinas:
echo   PostgreSQL: 192.168.1.20:5432
echo   Web App:    http://192.168.1.20:3010
echo.

pause
