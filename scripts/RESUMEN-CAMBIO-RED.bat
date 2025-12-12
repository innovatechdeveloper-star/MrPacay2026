@echo off
chcp 65001 >nul
color 0B
title ACTUALIZACIÓN RED IMPRESORAS - 192.168.15.x

echo.
echo ════════════════════════════════════════════════════════════
echo     ACTUALIZACIÓN DE RED COMPLETADA - RESUMEN
echo ════════════════════════════════════════════════════════════
echo.
echo [✓] NUEVA CONFIGURACIÓN DE RED:
echo     • Subnet: 192.168.15.0/24
echo     • Gateway: 192.168.15.1
echo     • DNS: 1.1.1.1, 38.255.105.232
echo.
echo ════════════════════════════════════════════════════════════
echo     CONFIGURACIÓN DE IMPRESORAS EN WINDOWS
echo ════════════════════════════════════════════════════════════
echo.
echo [✓] ZEBRA ZD230-203dpi ZPL
echo     • Puerto Windows: IP_192.168.15.34
echo     • IP destino: 192.168.15.34:9100
echo     • Estado: Normal
echo.
echo [✓] GODEX G530
echo     • Puerto Windows: PORT_192.168.15.35
echo     • IP destino: 192.168.15.35:9100
echo     • Estado: Normal
echo.
echo ════════════════════════════════════════════════════════════
echo     ARCHIVOS ACTUALIZADOS
echo ════════════════════════════════════════════════════════════
echo.
echo [✓] server.js
echo     • IPs autorizadas: 192.168.15.21, .6, .20, .34, .35, .36
echo     • Zebra IP: 192.168.15.34
echo     • Godex IP: 192.168.15.35
echo.
echo [✓] config.json
echo     • zebra.ip: 192.168.15.34
echo     • godex.ip: 192.168.15.35
echo.
echo [✓] system.config
echo     • ZEBRA_CONFIG.PRINTER_IP: 192.168.15.34
echo     • GODEX_CONFIG.PRINTER_IP: 192.168.15.35
echo.
echo ════════════════════════════════════════════════════════════
echo     PRÓXIMOS PASOS CRÍTICOS
echo ════════════════════════════════════════════════════════════
echo.
echo [!] CONFIGURAR IPS FÍSICAS EN LAS IMPRESORAS:
echo.
echo ┌──────────────────────────────────────────────────────────┐
echo │  1. GODEX G530                                           │
echo └──────────────────────────────────────────────────────────┘
echo.
echo    Opción A - Panel LCD de la impresora:
echo    ────────────────────────────────────────
echo    1. Presiona [MENU] en el panel
echo    2. Navega: Interface → Ethernet
echo    3. Configura:
echo       • IP Address: 192.168.15.35
echo       • Subnet Mask: 255.255.255.0
echo       • Gateway: 192.168.15.1
echo    4. Presiona [SAVE] y reinicia
echo.
echo    Opción B - Software GoLabel:
echo    ────────────────────────────────────────
echo    1. Conecta impresora por USB
echo    2. Abre "GoLabel" o "Godex Printer Tool"
echo    3. Communication → Network Setup
echo    4. IP: 192.168.15.35
echo    5. Gateway: 192.168.15.1
echo    6. Apply y desconecta USB
echo.
echo ┌──────────────────────────────────────────────────────────┐
echo │  2. ZEBRA ZD230                                          │
echo └──────────────────────────────────────────────────────────┘
echo.
echo    Opción A - Interfaz Web:
echo    ────────────────────────────────────────
echo    1. Conecta a la IP actual desde navegador
echo    2. Usuario: admin / Pass: 1234 (o vacío)
echo    3. Network → Wired Settings
echo    4. Configura:
echo       • IP Address: 192.168.15.34
echo       • Subnet: 255.255.255.0
echo       • Gateway: 192.168.15.1
echo    5. Apply Changes y Restart
echo.
echo    Opción B - Zebra Setup Utilities:
echo    ────────────────────────────────────────
echo    1. Descarga "Zebra Setup Utilities"
echo    2. Conecta por USB
echo    3. Printer → Network Settings
echo    4. IP: 192.168.15.34
echo    5. Gateway: 192.168.15.1
echo.
echo    Opción C - Botón FEED (configuración):
echo    ────────────────────────────────────────
echo    1. Apaga la impresora
echo    2. Mantén [FEED] presionado al encender
echo    3. Suelta cuando parpadee
echo    4. Imprimirá etiqueta con IP actual
echo.
echo ════════════════════════════════════════════════════════════
echo     VERIFICACIÓN FINAL
echo ════════════════════════════════════════════════════════════
echo.
echo Después de configurar ambas impresoras, ejecuta:
echo.
echo    ping 192.168.15.34
echo    ping 192.168.15.35
echo.
echo Ambas deben responder correctamente.
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
