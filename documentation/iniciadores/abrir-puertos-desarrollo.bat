@echo off
echo ============================================
echo  CONFIGURAR FIREWALL - SERVIDOR DESARROLLO
echo ============================================
echo.
echo Configurando Windows Firewall para puerto 3011...
echo (Servidor de desarrollo)
echo.

echo [1/2] Abriendo puerto 5432 para PostgreSQL...
netsh advfirewall firewall add rule name="PostgreSQL Mi-App-Desarrollo" dir=in action=allow protocol=TCP localport=5432
if %ERRORLEVEL% EQU 0 (
    echo ✅ Puerto 5432 abierto exitosamente
) else (
    echo ❌ Error abriendo puerto 5432
)

echo.
echo [2/2] Abriendo puerto 3011 para Node.js Server (Desarrollo)...
netsh advfirewall firewall add rule name="Node.js Mi-App-Desarrollo" dir=in action=allow protocol=TCP localport=3011
if %ERRORLEVEL% EQU 0 (
    echo ✅ Puerto 3011 abierto exitosamente
) else (
    echo ❌ Error abriendo puerto 3011
)

echo.
echo ============================================
echo  CONFIGURACIÓN COMPLETADA
echo ============================================
echo.
echo Puertos configurados:
echo   - Puerto 5432: PostgreSQL Database
echo   - Puerto 3011: Servidor Node.js (Desarrollo)
echo.
echo URLs de acceso:
echo   Web App:    http://localhost:3011
echo   Web Red:    http://%COMPUTERNAME%:3011
echo.
echo NOTA: El servidor productivo (puerto 3010) no se ve afectado
echo.

pause