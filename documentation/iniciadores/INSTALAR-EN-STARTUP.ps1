# ====================================================================
# 🚀 INSTALACIÓN AUTOMÁTICA EN SHELL:STARTUP
# ====================================================================
# Script PowerShell para instalar bandeja.bat en startup automáticamente
# ====================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema Etiquetas - Instalador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Rutas
$ProjectDir = "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja"
$BatFile = Join-Path $ProjectDir "bandeja.bat"
$StartupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$DestFile = Join-Path $StartupDir "bandeja.bat"

# Verificar que existe el archivo bandeja.bat
if (-not (Test-Path $BatFile)) {
    Write-Host "❌ ERROR: No se encuentra bandeja.bat en:" -ForegroundColor Red
    Write-Host "   $BatFile" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Archivo encontrado: bandeja.bat" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js no encontrado en PATH" -ForegroundColor Red
        Write-Host ""
        pause
        exit 1
    }
} catch {
    Write-Host "⚠️  Node.js no encontrado" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}
Write-Host ""

# Verificar dependencias
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
$NodeModules = Join-Path $ProjectDir "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "⚠️  Dependencias no instaladas" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "¿Deseas instalar las dependencias ahora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
        Write-Host "   (Esto puede tardar 3-10 minutos)" -ForegroundColor Gray
        Write-Host ""
        
        Push-Location $ProjectDir
        npm install
        $installResult = $LASTEXITCODE
        Pop-Location
        
        if ($installResult -eq 0) {
            Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
            pause
            exit 1
        }
    } else {
        Write-Host "⚠️  Instalación cancelada" -ForegroundColor Yellow
        Write-Host "   Ejecuta: npm install en $ProjectDir" -ForegroundColor Gray
        pause
        exit 0
    }
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}
Write-Host ""

# Copiar a startup
Write-Host "Copiando a shell:startup..." -ForegroundColor Yellow
Write-Host "   Origen: $BatFile" -ForegroundColor Gray
Write-Host "   Destino: $DestFile" -ForegroundColor Gray
Write-Host ""

try {
    Copy-Item -Path $BatFile -Destination $DestFile -Force
    Write-Host "✅ Archivo copiado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error copiando archivo: $_" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# Verificar
if (Test-Path $DestFile) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Ubicación:" -ForegroundColor Cyan
    Write-Host "   $DestFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Reinicia Windows" -ForegroundColor White
    Write-Host "   2. Después del login, espera ~30 segundos" -ForegroundColor White
    Write-Host "   3. Busca el icono 🏷️ en la bandeja del sistema" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 Para probar sin reiniciar:" -ForegroundColor Cyan
    Write-Host "   Ejecuta: $DestFile" -ForegroundColor Gray
    Write-Host ""
    
    # Preguntar si quiere ejecutar ahora
    Write-Host "¿Deseas ejecutar la aplicación ahora? (S/N)" -ForegroundColor Cyan
    $runNow = Read-Host
    
    if ($runNow -eq "S" -or $runNow -eq "s") {
        Write-Host ""
        Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
        Write-Host "   Espera ~15-30 segundos y busca el icono 🏷️" -ForegroundColor Gray
        Write-Host ""
        Start-Process -FilePath $DestFile -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "✅ Aplicación iniciada" -ForegroundColor Green
    }
    
} else {
    Write-Host "❌ Error: El archivo no se copió correctamente" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
