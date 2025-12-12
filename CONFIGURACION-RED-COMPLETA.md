# 🌐 GUÍA DE CONFIGURACIÓN DE RED - Sistema de Etiquetas V2.5

## 📊 CONFIGURACIÓN ACTUAL

**Servidor:**
- IP: `192.168.15.22`
- Puerto: `3012`
- Host: `0.0.0.0` (acepta conexiones de cualquier IP)

**Impresoras:**
- Zebra ZD230: `192.168.15.34:9100`
- Godex G530: `192.168.15.35:9100`

---

## ✅ OPCIÓN 1: MISMA RED (LAN + Wireless)

### Requisitos:
- Todos los dispositivos conectados al **mismo router**
- Rango de IPs: `192.168.15.x`
- Funciona para Ethernet y WiFi

### URLs de Acceso:
```
http://192.168.15.22:3012
```

### Configuración Necesaria:

#### 1️⃣ Abrir Puerto en Firewall

**EJECUTAR COMO ADMINISTRADOR:**

```batch
Clic derecho en: ABRIR-PUERTO-FIREWALL.bat
Seleccionar: "Ejecutar como administrador"
```

O manualmente:

```powershell
# PowerShell como Administrador
netsh advfirewall firewall add rule name="Sistema Etiquetas - Puerto 3012" dir=in action=allow protocol=TCP localport=3012
```

#### 2️⃣ Verificar que el servidor está corriendo

```powershell
node server.js
```

Debes ver:
```
🌐 Servidor HTTP ejecutándose en http://localhost:3012
🌐 Acceso RED LOCAL: http://192.168.15.22:3012
```

#### 3️⃣ Probar desde otro dispositivo

Desde cualquier PC/tablet/celular en la red:

```
http://192.168.15.22:3012
```

---

## 🌍 OPCIÓN 2: DIFERENTES REDES (LAN vs Wireless en diferentes subredes)

Si tienes:
- Ethernet en red: `192.168.1.x`
- Wireless en red: `192.168.15.x`

### Solución A: Configurar el router para permitir comunicación entre redes

**Pasos:**
1. Acceder al router (generalmente `192.168.1.1` o `192.168.15.1`)
2. Buscar sección: **"Enrutamiento"** o **"Routing"**
3. Agregar ruta estática:
   - Red destino: `192.168.15.0/24`
   - Gateway: IP del router principal
   - Interfaz: LAN o WAN según configuración

### Solución B: Servidor con dos interfaces de red

**Windows:**
1. Conectar un adaptador Ethernet en `192.168.1.x`
2. Conectar un adaptador WiFi en `192.168.15.x`
3. El servidor escuchará en ambas redes simultáneamente

**Configurar IPs estáticas:**

```powershell
# Ver adaptadores de red
Get-NetAdapter

# Configurar IP estática en Ethernet
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.1.100 -PrefixLength 24 -DefaultGateway 192.168.1.1

# Configurar IP estática en WiFi
New-NetIPAddress -InterfaceAlias "Wi-Fi" -IPAddress 192.168.15.22 -PrefixLength 24 -DefaultGateway 192.168.15.1
```

### Solución C: Bridge entre redes

**Crear un puente de red en Windows:**

1. Ir a: `Panel de Control > Redes e Internet > Conexiones de Red`
2. Seleccionar ambos adaptadores (Ethernet + WiFi)
3. Clic derecho → **"Crear puente"**
4. Todos los dispositivos estarán en la misma red

⚠️ **ADVERTENCIA:** Esto puede afectar la configuración de red existente.

### Solución D: VPN o ZeroTier (Más profesional)

**Usar ZeroTier (Gratuito):**

1. Descargar: https://www.zerotier.com/download/
2. Crear una red virtual
3. Conectar todos los dispositivos a la misma red ZeroTier
4. Acceder usando la IP virtual asignada

---

## 🔥 OPCIÓN 3: CONFIGURACIÓN DUAL IP

Si tu servidor tiene **DOS IPs** (Ethernet + WiFi):

**Ejemplo:**
- Ethernet: `192.168.1.100` (red cableada)
- WiFi: `192.168.15.22` (red wireless)

El servidor ya escucha en `0.0.0.0`, por lo que responderá en **AMBAS IPs:**

### Acceso desde red cableada:
```
http://192.168.1.100:3012
```

### Acceso desde red wireless:
```
http://192.168.15.22:3012
```

---

## 🛠️ VERIFICAR CONECTIVIDAD

### Desde el servidor:

```powershell
# Ver todas las IPs del servidor
ipconfig

# Verificar que el puerto está escuchando
netstat -an | Select-String "3012"

# Debería mostrar:
# TCP    0.0.0.0:3012           0.0.0.0:0              LISTENING
```

### Desde otro dispositivo:

```powershell
# Probar conectividad (ping)
ping 192.168.15.22

# Probar puerto (PowerShell)
Test-NetConnection -ComputerName 192.168.15.22 -Port 3012

# O desde CMD/navegador
curl http://192.168.15.22:3012
```

### Desde un celular/tablet:

1. Conectar a la misma WiFi
2. Abrir navegador
3. Ir a: `http://192.168.15.22:3012`

---

## 🔒 SOLUCIÓN DE PROBLEMAS

### ❌ "No se puede acceder al sitio"

**Verificar:**

1. **Servidor corriendo:**
   ```powershell
   # En el servidor
   netstat -an | Select-String "3012"
   ```

2. **Firewall abierto:**
   ```powershell
   netsh advfirewall firewall show rule name="Sistema Etiquetas - Puerto 3012"
   ```

3. **Misma red:**
   ```powershell
   # Desde dispositivo cliente
   ping 192.168.15.22
   ```

4. **Puerto correcto:**
   - Verificar `system.config` → PORT=3012

### ❌ "ERR_CONNECTION_REFUSED"

- Servidor no está corriendo
- Puerto incorrecto
- IP incorrecta

**Solución:**
```powershell
cd D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
node server.js
```

### ❌ "ERR_CONNECTION_TIMED_OUT"

- Firewall bloqueando
- Diferentes subredes sin enrutamiento

**Solución:**
1. Ejecutar `ABRIR-PUERTO-FIREWALL.bat` como administrador
2. Verificar que ambos dispositivos estén en `192.168.15.x`

### ❌ Dispositivos en redes diferentes

**Ejemplo:**
- PC servidor: `192.168.15.22`
- Tablet: `192.168.1.50`

**Opciones:**
1. Cambiar configuración de router (routing)
2. Conectar tablet al WiFi correcto (192.168.15.x)
3. Usar servidor con 2 interfaces de red
4. Usar VPN/ZeroTier

---

## 📱 CONFIGURACIÓN RECOMENDADA PARA PRODUCCIÓN

### Para un entorno industrial con tablets/celulares:

1. **Todos los dispositivos en la MISMA red WiFi:** `192.168.15.x`
2. **IP estática para el servidor:** `192.168.15.22`
3. **IPs estáticas para impresoras:**
   - Zebra: `192.168.15.34`
   - Godex: `192.168.15.35`
4. **Firewall configurado:** Puerto 3012 abierto
5. **Acceso fácil para usuarios:** Crear acceso directo en tablets con URL

### Configurar IP estática en Windows (servidor):

```powershell
# Obtener nombre del adaptador
Get-NetAdapter

# Configurar IP estática (ajustar InterfaceAlias según tu adaptador)
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.15.22 -PrefixLength 24 -DefaultGateway 192.168.15.1

# Configurar DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","8.8.4.4")
```

---

## 🎯 RESUMEN RÁPIDO

### Tu configuración actual es CORRECTA para:

✅ Todos los dispositivos en red `192.168.15.x` (LAN + WiFi)

### URLs de acceso:

- **Desde el servidor:** `http://localhost:3012`
- **Desde otros dispositivos:** `http://192.168.15.22:3012`

### Acción requerida:

1. ✅ Ejecutar `ABRIR-PUERTO-FIREWALL.bat` como administrador
2. ✅ Asegurar que todos los dispositivos estén en red `192.168.15.x`
3. ✅ Probar acceso desde tablet/celular

---

## 📞 CASOS DE USO

### Caso 1: Todos en la misma red WiFi
**✅ FUNCIONA:** Sin configuración adicional

### Caso 2: Algunos por cable, otros por WiFi (mismo router)
**✅ FUNCIONA:** Sin configuración adicional

### Caso 3: Cable en red `192.168.1.x`, WiFi en red `192.168.15.x`
**⚠️ REQUIERE:** Configuración de routing o servidor con 2 IPs

### Caso 4: Dispositivos fuera de la red local (internet)
**❌ NO FUNCIONA:** Requiere puerto forwarding en router o servicio VPN

---

## 🚀 COMANDO RÁPIDO DE VERIFICACIÓN

```powershell
# Ejecutar esto para verificar configuración completa
Write-Host "=== VERIFICACION DE RED ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "IPs del servidor:" -ForegroundColor Yellow
ipconfig | Select-String "IPv4"
Write-Host ""
Write-Host "Puerto 3012 escuchando:" -ForegroundColor Yellow
netstat -an | Select-String "3012"
Write-Host ""
Write-Host "Regla de firewall:" -ForegroundColor Yellow
netsh advfirewall firewall show rule name="Sistema Etiquetas - Puerto 3012" | Select-String "Habilitado"
Write-Host ""
Write-Host "Acceso desde red:" -ForegroundColor Green
Write-Host "http://192.168.15.22:3012" -ForegroundColor Green
```

---

**Documentación actualizada:** 11 de diciembre de 2025
**Sistema:** Etiquetas V2.5
**Puerto:** 3012
**Red:** 192.168.15.x
