@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           VERIFICACIÓN FINAL - GODEX G530 ZPL                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script verifica que TODO esté correcto antes de producción.
echo.
echo Verificaciones:
echo   1. Código genera ^LL826 (no 827, no 1100, no 1300)
echo   2. Godex configurada en modo ZPL
echo   3. Prueba de impresión 7cm exactos
echo.
pause

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 1: VERIFICAR CÓDIGO DEL SERVIDOR
echo ═══════════════════════════════════════════════════════════════
echo.
findstr /C:"ALTURA_LABEL = 826" server.js >nul
if %errorlevel% equ 0 (
    echo ✅ Código correcto: ALTURA_LABEL = 826
) else (
    echo ❌ ERROR: ALTURA_LABEL NO es 826
    echo    Verifica server.js línea ~827
    pause
    exit /b 1
)

findstr /C:"Y_BARCODE = 653" server.js >nul
if %errorlevel% equ 0 (
    echo ✅ Código correcto: Y_BARCODE = 653
) else (
    echo ❌ ERROR: Y_BARCODE NO es 653
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 2: VERIFICAR CONEXIÓN GODEX
echo ═══════════════════════════════════════════════════════════════
echo.
ping -n 1 192.168.15.35 >nul
if %errorlevel% equ 0 (
    echo ✅ Godex responde en 192.168.15.35
) else (
    echo ❌ ERROR: Godex NO responde
    echo    Verifica que esté encendida y en la red
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 3: LIMPIAR MEMORIA Y CONFIGURAR MODO ZPL
echo ═══════════════════════════════════════════════════════════════
echo.
echo ⚠️  LIMPIEZA AGRESIVA - BORRA TODA LA CONFIGURACIÓN GUARDADA
echo.
echo Lo que hará:
echo   • ~R: Borra memoria flash completa
echo   • Configura SOLO modo ZPL
echo   • NO guarda ninguna config (sin ^JUS)
echo   • Impresora leerá SOLO nuestro código
echo.
echo ¿Ejecutar limpieza y configuración?
echo    SI  = Limpia TODO y configura ZPL
echo    NO  = Solo si YA está limpia y funciona perfecto
echo.
choice /C SN /M "¿Limpiar memoria y configurar Godex"
if %errorlevel% equ 1 (
    echo.
    echo ⚡ Limpiando memoria flash y configurando modo ZPL...
    node forzar-zpl-godex.js
    if %errorlevel% neq 0 (
        echo ❌ Error al configurar
        pause
        exit /b 1
    )
    
    echo.
    echo ⚠️  AHORA DEBES REINICIAR LA IMPRESORA:
    echo.
    echo 1. APAGAR completamente ^(desconectar cable^)
    echo 2. ESPERAR 10 segundos
    echo 3. MANTENER FEED presionado
    echo 4. CONECTAR cable ^(sin soltar FEED^)
    echo 5. SOLTAR FEED cuando parpadee
    echo 6. Esperar calibración → Luz 🟢 verde
    echo.
    pause
) else (
    echo ✅ Saltando configuración ^(ya está en ZPL^)
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 4: DIAGNÓSTICO DE LIMPIEZA
echo ═══════════════════════════════════════════════════════════════
echo.
echo Verificando que NO haya configuración guardada...
echo.
node diagnostico-godex-limpia.js
if %errorlevel% neq 0 (
    echo ❌ Error en diagnóstico
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 5: PRUEBA DE IMPRESIÓN
echo ═══════════════════════════════════════════════════════════════
echo.
echo Imprimiendo etiqueta de prueba...
echo.
node test-godex-zpl.js
if %errorlevel% neq 0 (
    echo ❌ Error en prueba
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   PASO 6: VERIFICACIÓN VISUAL
echo ═══════════════════════════════════════════════════════════════
echo.
echo Mide la etiqueta que acaba de salir:
echo.
echo ✅ Debe medir: 7cm de alto ^(usa regla^)
echo ✅ Debe tener: Texto visible ^"PRUEBA ZPL MODE"^
echo ✅ Debe tener: Código de barras ^"123456"^
echo ✅ Solo: 1 etiqueta ^(no doble, no triple^)
echo.
echo ❌ Si mide 14cm, 16cm o sale en blanco:
echo    → Repite PASO 3 ^(configurar y reiniciar^)
echo.
choice /C SN /M "¿La etiqueta salió correcta (7cm con texto)"
if %errorlevel% equ 2 (
    echo.
    echo ═══════════════════════════════════════════════════════════════
    echo   DIAGNÓSTICO DE PROBLEMAS
    echo ═══════════════════════════════════════════════════════════════
    echo.
    echo Problema: Etiqueta incorrecta
    echo.
    echo Si sale EN BLANCO:
    echo   → Godex NO está en modo ZPL
    echo   → Repite PASO 3 y asegura el reinicio con FEED
    echo.
    echo Si sale a 14cm o 16cm:
    echo   → Configuración guardada conflictiva en Godex
    echo   → Panel LCD: MENU → Setup → Restore Default
    echo   → Luego repite PASO 3
    echo.
    echo Si sale duplicada:
    echo   → Verifica que el código NO tenga ^PQ en ZPL
    echo   → node -e "require('fs').readFileSync('server.js','utf8').match(/\^PQ/g)"
    echo.
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║               ✅ VERIFICACIÓN COMPLETADA                      ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  • Código correcto: ^LL826 / Y_BARCODE=653                    ║
echo ║  • Godex en modo ZPL                                          ║
echo ║  • Etiqueta de 7cm imprime correctamente                      ║
echo ║                                                               ║
echo ║  🚀 SISTEMA LISTO PARA PRODUCCIÓN                             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Ahora puedes:
echo   • Imprimir desde el sistema web
echo   • Costurar con márgenes de 1cm arriba y abajo
echo   • Eliminar estas pruebas desde Panel Administración
echo.
pause
