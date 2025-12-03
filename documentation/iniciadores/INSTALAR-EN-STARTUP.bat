@echo off
REM ====================================================================
REM 🚀 INSTALAR EN SHELL:STARTUP - Sistema Etiquetas
REM ====================================================================

echo.
echo ========================================
echo   Instalador en shell:startup
echo ========================================
echo.
echo Este script:
echo   1. Verifica Node.js
echo   2. Instala dependencias (si faltan)
echo   3. Copia bandeja.bat a shell:startup
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

REM Ejecutar script PowerShell
PowerShell -ExecutionPolicy Bypass -File "%~dp0INSTALAR-EN-STARTUP.ps1"

echo.
pause
