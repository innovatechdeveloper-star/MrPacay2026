@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════╗
echo ║   SISTEMA ETIQUETAS v2.5 - INSTALADOR RÁPIDO ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 📦 Instalando dependencias...
cd sistema-bandeja
call npm install
echo.
echo 🔧 Ejecutando instalador del servicio...
cd instalador
node install.js
echo.
echo ✅ Instalación completada
echo.
echo 📍 Para iniciar la aplicación de bandeja:
echo    cd sistema-bandeja
echo    npm start
echo.
pause
