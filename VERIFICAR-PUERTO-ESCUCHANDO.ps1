# Script para verificar que el puerto 3012 esta realmente escuchando
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " VERIFICACION DE PUERTO 3012" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si el puerto esta escuchando
Write-Host "[1] Verificando si puerto 3012 esta ESCUCHANDO..." -ForegroundColor Yellow
$listening = Get-NetTCPConnection -LocalPort 3012 -State Listen -ErrorAction SilentlyContinue

if ($listening) {
    Write-Host "OK - Puerto 3012 esta ESCUCHANDO" -ForegroundColor Green
    $listening | Format-Table LocalAddress, LocalPort, State, OwningProcess
    
    # Obtener proceso
    $processId = $listening[0].OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "  Proceso: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
    }
} else {
    Write-Host "ERROR - Puerto 3012 NO esta escuchando" -ForegroundColor Red
    Write-Host "  El servidor Node.js no esta corriendo o no esta en puerto 3012" -ForegroundColor Yellow
}
Write-Host ""

# 2. Verificar direccion de escucha
Write-Host "[2] Verificando en que direcciones esta escuchando..." -ForegroundColor Yellow
$allListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3012 }

foreach ($conn in $allListening) {
    $addr = $conn.LocalAddress
    if ($addr -eq "0.0.0.0") {
        Write-Host "OK - Escuchando en TODAS las interfaces (0.0.0.0) - CORRECTO" -ForegroundColor Green
    } elseif ($addr -eq "127.0.0.1") {
        Write-Host "ERROR - Solo escuchando en LOCALHOST (127.0.0.1) - PROBLEMA" -ForegroundColor Red
        Write-Host "  Necesitas cambiar el servidor para escuchar en 0.0.0.0" -ForegroundColor Yellow
    } elseif ($addr -eq "::") {
        Write-Host "OK - Escuchando en IPv6 (::) - Puede funcionar" -ForegroundColor Yellow
    } else {
        Write-Host "OK - Escuchando en: $addr" -ForegroundColor Green
    }
}
Write-Host ""

# 3. Verificar interfaces de red
Write-Host "[3] Interfaces de red disponibles:" -ForegroundColor Yellow
$interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
$interfaces | Format-Table IPAddress, InterfaceAlias, PrefixLength
Write-Host ""

# 4. Verificar conectividad local
Write-Host "[4] Probando conectividad LOCAL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3012" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "OK - Localhost funciona - Codigo: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - Localhost NO responde - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Probar con IP local
Write-Host "[5] Probando con IP 192.168.15.22..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.15.22:3012" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "OK - IP 192.168.15.22 funciona - Codigo: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - IP 192.168.15.22 NO responde - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar reglas de firewall
Write-Host "[6] Reglas de firewall para puerto 3012:" -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*3012*" -or $_.DisplayName -like "*Sistema Etiquetas*" }
if ($firewallRules) {
    $firewallRules | ForEach-Object {
        $rule = $_
        $portFilter = $rule | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue
        Write-Host "  - $($rule.DisplayName) | Dirección: $($rule.Direction) | Habilitado: $($rule.Enabled)" -ForegroundColor Cyan
        if ($portFilter) {
            Write-Host "    Puertos: $($portFilter.LocalPort)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  No se encontraron reglas de firewall específicas" -ForegroundColor Yellow
}
Write-Host ""

# 7. Estado del firewall
Write-Host "[7] Estado de Windows Defender Firewall:" -ForegroundColor Yellow
$firewallProfiles = Get-NetFirewallProfile
$firewallProfiles | Format-Table Name, Enabled
Write-Host ""

# 8. Categoría de red
Write-Host "[8] Categoría de red actual:" -ForegroundColor Yellow
$netProfile = Get-NetConnectionProfile
$netProfile | Format-Table Name, NetworkCategory, InterfaceAlias
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RECOMENDACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $listening) {
    Write-Host "PROBLEMA: El servidor no esta corriendo" -ForegroundColor Red
    Write-Host "  Solucion: Inicia el servidor con 'node server.js'" -ForegroundColor Yellow
} elseif ($listening -and ($listening[0].LocalAddress -eq "127.0.0.1")) {
    Write-Host "PROBLEMA: El servidor solo escucha en localhost" -ForegroundColor Red
    Write-Host "  Solucion: Verifica que server.js use 0.0.0.0 en app.listen()" -ForegroundColor Yellow
} elseif ($listening -and (($listening[0].LocalAddress -eq "0.0.0.0") -or ($listening[0].LocalAddress -eq "::"))) {
    Write-Host "OK - El servidor esta configurado correctamente" -ForegroundColor Green
    Write-Host "  Si aun no puedes acceder desde .26, el problema es:" -ForegroundColor Yellow
    Write-Host "  - Firewall bloqueando" -ForegroundColor Yellow
    Write-Host "  - Aislamiento AP en el router" -ForegroundColor Yellow
    Write-Host "  - Red publica en lugar de privada" -ForegroundColor Yellow
}

Write-Host ""
