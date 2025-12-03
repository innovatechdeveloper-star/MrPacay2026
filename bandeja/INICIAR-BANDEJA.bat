@echo off
REM ====================================
REM INICIAR BANDEJA - SISTEMA ETIQUETAS
REM ====================================

cd /d "%~dp0"

REM Ejecutar PowerShell en modo oculto (sin ventana)
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0bandeja.ps1"
