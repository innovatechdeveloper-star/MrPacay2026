@echo off
REM Ejecutar como ADMINISTRADOR
echo ========================================
echo  EJECUTANDO SOLUCION COMO ADMIN
echo ========================================
echo.

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0SOLUCION-ADMIN.ps1\"'"

echo.
echo Script lanzado con permisos de Administrador
echo Se abrira una nueva ventana
pause
