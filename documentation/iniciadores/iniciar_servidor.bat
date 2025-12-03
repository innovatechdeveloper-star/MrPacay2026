@echo off
rem Inicia y mantiene vivo el servidor Node.js en un bucle.
rem Si node termina (crash o cierre), el script esperará 5s y lo reiniciará.
cd /d "D:\mi-app-etiquetas\mi-app-etiquetas"

:REINICIAR
echo [%date% %time%] Iniciando server.js...
node server.js
set "EXITCODE=%ERRORLEVEL%"
echo [%date% %time%] server.js finalizado con codigo %EXITCODE%.
echo Reiniciando en 5 segundos (cerrar esta ventana para detener)...
timeout /t 5 /nobreak >nul
goto REINICIAR
