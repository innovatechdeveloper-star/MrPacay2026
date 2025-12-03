# ====================================
# SISTEMA DE BANDEJA - ETIQUETAS
# ====================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Rutas
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Split-Path -Parent $scriptPath
$serverScript = Join-Path $serverPath "server.js"
$iconPath = Join-Path $scriptPath "icon.ico"

# Variable global para el proceso del servidor
$global:serverProcess = $null

# Crear icono de bandeja
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Text = "Sistema Etiquetas - Detenido"
$notifyIcon.Visible = $true

# Usar icono por defecto si no existe el personalizado
if (Test-Path $iconPath) {
    $notifyIcon.Icon = New-Object System.Drawing.Icon($iconPath)
} else {
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}

# Función para encender servidor
function Encender-Servidor {
    if ($global:serverProcess -eq $null -or $global:serverProcess.HasExited) {
        Write-Host "🚀 Iniciando servidor..."
        $global:serverProcess = Start-Process -FilePath "node" -ArgumentList $serverScript -WorkingDirectory $serverPath -WindowStyle Hidden -PassThru
        $notifyIcon.Text = "Sistema Etiquetas - Activo"
        $notifyIcon.ShowBalloonTip(3000, "Sistema Etiquetas", "Servidor iniciado en http://localhost:3012", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $notifyIcon.ShowBalloonTip(3000, "Sistema Etiquetas", "El servidor ya está en ejecución", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
}

# Función para apagar servidor
function Apagar-Servidor {
    if ($global:serverProcess -ne $null -and !$global:serverProcess.HasExited) {
        Write-Host "🛑 Deteniendo servidor..."
        Stop-Process -Id $global:serverProcess.Id -Force
        $global:serverProcess = $null
        $notifyIcon.Text = "Sistema Etiquetas - Detenido"
        $notifyIcon.ShowBalloonTip(3000, "Sistema Etiquetas", "Servidor detenido", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $notifyIcon.ShowBalloonTip(3000, "Sistema Etiquetas", "El servidor ya está detenido", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
}

# Función para reiniciar servidor
function Reiniciar-Servidor {
    Write-Host "🔄 Reiniciando servidor..."
    Apagar-Servidor
    Start-Sleep -Seconds 2
    Encender-Servidor
}

# Crear menú contextual
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

# Opción ENCENDER
$menuEncender = New-Object System.Windows.Forms.ToolStripMenuItem
$menuEncender.Text = "🟢 Encender"
$menuEncender.Add_Click({ Encender-Servidor })
$contextMenu.Items.Add($menuEncender)

# Opción REINICIAR
$menuReiniciar = New-Object System.Windows.Forms.ToolStripMenuItem
$menuReiniciar.Text = "🔄 Reiniciar"
$menuReiniciar.Add_Click({ Reiniciar-Servidor })
$contextMenu.Items.Add($menuReiniciar)

# Opción APAGAR
$menuApagar = New-Object System.Windows.Forms.ToolStripMenuItem
$menuApagar.Text = "🔴 Apagar"
$menuApagar.Add_Click({ Apagar-Servidor })
$contextMenu.Items.Add($menuApagar)

# Separador
$contextMenu.Items.Add("-")

# Opción CERRAR
$menuCerrar = New-Object System.Windows.Forms.ToolStripMenuItem
$menuCerrar.Text = "❌ Cerrar"
$menuCerrar.Add_Click({
    Apagar-Servidor
    $notifyIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
})
$contextMenu.Items.Add($menuCerrar)

# Asignar menú al icono
$notifyIcon.ContextMenuStrip = $contextMenu

# Encender automáticamente al iniciar
Write-Host "🎯 Iniciando Sistema de Etiquetas en bandeja..."
Encender-Servidor

# Mantener el script ejecutándose
$appContext = New-Object System.Windows.Forms.ApplicationContext
[System.Windows.Forms.Application]::Run($appContext)
