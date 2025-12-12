@echo off
:: =============================================
:: ABRIR PUERTO 3012 EN FIREWALL DE WINDOWS
:: Ejecutar como ADMINISTRADOR
:: =============================================

echo.
echo ========================================
echo  CONFIGURANDO FIREWALL PARA RED LOCAL
echo ========================================
echo.
echo Abriendo puerto 3012 para Sistema de Etiquetas...
echo.

:: Eliminar reglas existentes (si existen)
netsh advfirewall firewall delete rule name="Sistema Etiquetas - Puerto 3012" >nul 2>&1

:: Agregar regla de entrada (IN)
netsh advfirewall firewall add rule name="Sistema Etiquetas - Puerto 3012" dir=in action=allow protocol=TCP localport=3012

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Regla de entrada creada exitosamente
) else (
    echo.
    echo [ERROR] No se pudo crear la regla de entrada
    echo Verifica que ejecutaste como Administrador
    pause
    exit /b 1
)

:: Agregar regla de salida (OUT) - opcional pero recomendado
netsh advfirewall firewall add rule name="Sistema Etiquetas - Puerto 3012 Salida" dir=out action=allow protocol=TCP localport=3012

if %ERRORLEVEL% EQU 0 (
    echo [OK] Regla de salida creada exitosamente
) else (
    echo [ADVERTENCIA] No se pudo crear la regla de salida
)

echo.
echo ========================================
echo  CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Puerto 3012 ahora esta accesible desde:
echo.
echo   - Localhost:     http://localhost:3012
echo   - Tu PC:         http://192.168.15.22:3012
echo   - Otros en red:  http://192.168.15.22:3012
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
