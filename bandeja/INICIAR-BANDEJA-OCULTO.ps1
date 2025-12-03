# ====================================================================
# 🏷️ SISTEMA ETIQUETAS - LAUNCHER OCULTO (PowerShell)
# ====================================================================
# Este script inicia la aplicación de bandeja completamente invisible
# Sin ventanas CMD, sin notificaciones, sin interrupciones
# ====================================================================

# ⚠️ CAMBIAR ESTA RUTA A TU UBICACIÓN ⚠️
$PROJECT_DIR = "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja"

# Verificar que el directorio existe
if (-not (Test-Path "$PROJECT_DIR\main.js")) {
    exit 1
}

# Verificar Node.js instalado
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    exit 1
}

# Verificar node_modules
if (-not (Test-Path "$PROJECT_DIR\node_modules")) {
    # Instalar dependencias en segundo plano oculto
    $installProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$PROJECT_DIR`" && npm install" `
        -WindowStyle Hidden `
        -PassThru
    Start-Sleep -Seconds 3
}

# Iniciar aplicación Electron completamente oculto
$startProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d `"$PROJECT_DIR`" && npm start" `
    -WindowStyle Hidden `
    -PassThru

# Script finaliza, proceso queda en segundo plano
exit 0
