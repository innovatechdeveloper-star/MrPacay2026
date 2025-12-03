@echo off
chcp 65001 >nul
title Sistema Etiquetas v2.5 - Instalador Gráfico
cls
echo.
echo ════════════════════════════════════════════════
echo    SISTEMA ETIQUETAS v2.5 - INSTALADOR
echo ════════════════════════════════════════════════
echo.
echo 📦 Iniciando instalador gráfico...
echo.

cd /d "%~dp0sistema-bandeja\instalador"

if not exist "node_modules" (
    echo 📥 Instalando dependencias por primera vez...
    call npm install
    echo.
)

echo 🚀 Abriendo instalador...
start "" npm start

echo.
echo ✅ Instalador iniciado
echo.
echo 💡 Se abrirá una ventana gráfica para completar la instalación.
echo    Si no aparece, espera unos segundos...
echo.
timeout /t 3 >nul
exit
