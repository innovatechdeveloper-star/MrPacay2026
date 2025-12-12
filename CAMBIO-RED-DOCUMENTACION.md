# CAMBIO DE RED - SISTEMA DE ETIQUETAS V2.5
**Fecha:** 5 de diciembre de 2025  
**Razón:** Cambio de proveedor de internet / Nueva configuración de red

---

## 🌐 NUEVA CONFIGURACIÓN DE RED

### Red Anterior
```
Subnet:  192.168.1.0/24
Gateway: 192.168.1.1
```

### Red Nueva
```
Subnet:  192.168.15.0/24
Gateway: 192.168.15.1
DNS:     1.1.1.1, 38.255.105.232
```

---

## 💻 SERVIDOR

| Concepto | IP Anterior | IP Nueva |
|----------|-------------|----------|
| Servidor | 192.168.1.22 | **192.168.15.21** (Estática) |
| PC Actual | 192.168.1.36 | **192.168.15.6** (DHCP) |

**Configurar IP estática en servidor:**
```powershell
# Ejecutar como Administrador
netsh interface ip set address name="Ethernet" static 192.168.15.21 255.255.255.0 192.168.15.1
netsh interface ip set dns name="Ethernet" static 1.1.1.1
netsh interface ip add dns name="Ethernet" 38.255.105.232 index=2
```

---

## 🖨️ IMPRESORAS

### Resumen de Cambios

| Impresora | IP Anterior | IP Nueva | Puerto Windows |
|-----------|-------------|----------|----------------|
| **Zebra ZD230** | 192.168.1.34 | **192.168.15.34** | `IP_192.168.15.34` |
| **Godex G530** | 192.168.1.40 | **192.168.15.35** | `PORT_192.168.15.35` |

### Estado Actual

✅ **Puertos de Windows actualizados** (completado)  
⚠️ **IPs físicas de impresoras** (pendiente - ver instrucciones abajo)

---

## 📝 ARCHIVOS ACTUALIZADOS

### 1. `server.js`

**IPs autorizadas actualizadas:**
```javascript
const ipsPermitidas = [
    '127.0.0.1',          // Localhost
    '::1',                // Localhost IPv6
    '192.168.15.21',      // Servidor (IP estática nueva)
    '192.168.15.6',       // PC actual (DHCP)
    '192.168.15.20',      // Dispositivo en red
    '192.168.15.36',      // Brother / dispositivo
    '192.168.15.34',      // Zebra ZD230
    '192.168.15.35'       // Godex G530
];
```

**Configuración de impresoras:**
```javascript
// Zebra
PRINTER_IP: '192.168.15.34'

// Godex (múltiples ubicaciones actualizadas)
GODEX_IP = '192.168.15.35'
GODEX_CONFIG.IP = '192.168.15.35'
```

### 2. `config.json`
```json
{
    "printers": {
        "zebra": {
            "ip": "192.168.15.34",
            "port": 9100
        },
        "godex": {
            "ip": "192.168.15.35",
            "port": 9100
        }
    }
}
```

### 3. `system.config`
```ini
[ZEBRA_CONFIG]
PRINTER_IP=192.168.15.34

[GODEX_CONFIG]
PRINTER_IP=192.168.15.35
```

---

## ⚙️ CONFIGURAR IPS FÍSICAS DE IMPRESORAS

### 🖨️ GODEX G530 → 192.168.15.35

#### Opción 1: Panel LCD (Recomendado)
1. Presiona **MENU** en el panel de la impresora
2. Navega: `Interface` → `Ethernet`
3. Configura:
   - **IP Address:** `192.168.15.35`
   - **Subnet Mask:** `255.255.255.0`
   - **Gateway:** `192.168.15.1`
4. Presiona **SAVE** y **reinicia** la impresora

#### Opción 2: Software GoLabel
1. Conecta la impresora por **USB**
2. Abre "GoLabel" o "Godex Printer Tool"
3. Ve a: `Communication` → `Network Setup`
4. Establece:
   - IP: `192.168.15.35`
   - Gateway: `192.168.15.1`
5. **Apply** y desconecta USB

---

### 🖨️ ZEBRA ZD230 → 192.168.15.34

#### Opción 1: Interfaz Web (Recomendado)
1. Abre navegador y ve a la **IP actual** de Zebra
2. Login:
   - Usuario: `admin`
   - Contraseña: `1234` (o déjala vacía)
3. Ve a: `Network` → `Wired Settings`
4. Configura:
   - **IP Address:** `192.168.15.34`
   - **Subnet Mask:** `255.255.255.0`
   - **Gateway:** `192.168.15.1`
5. Clic en **Apply Changes** y **Restart**

#### Opción 2: Zebra Setup Utilities
1. Descarga "Zebra Setup Utilities" (si no lo tienes)
2. Conecta impresora por **USB**
3. En el software: `Printer` → `Network Settings`
4. Configura:
   - IP: `192.168.15.34`
   - Gateway: `192.168.15.1`
5. **Apply**

#### Opción 3: Botón FEED (Acceso rápido)
1. **Apaga** la impresora
2. Mantén presionado el botón **FEED** mientras la **enciendes**
3. Suelta cuando empiece a **parpadear**
4. Imprimirá etiqueta con configuración actual
5. Anota la IP y accede vía web (Opción 1)

---

## ✅ VERIFICACIÓN FINAL

Después de configurar ambas impresoras, ejecuta en CMD:

```cmd
ping 192.168.15.34
ping 192.168.15.35
```

**Resultado esperado:**
```
Respuesta desde 192.168.15.34: bytes=32 tiempo<1ms TTL=64
Respuesta desde 192.168.15.35: bytes=32 tiempo<1ms TTL=64
```

---

## 🚀 REINICIAR SERVIDOR

Después de verificar conectividad:

```cmd
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
node server.js
```

Deberías ver en la consola:
```
✅ Configuración para Zebra ZD230:
   PUERTO: ZEBRA_ZD230_34 (192.168.15.34:9100)

🚀 Servidor Express iniciado en puerto 3012
```

---

## 📋 CHECKLIST

- [x] Actualizar IPs en `server.js`
- [x] Actualizar IPs en `config.json`
- [x] Actualizar IPs en `system.config`
- [x] Crear puertos nuevos en Windows
- [x] Asignar Zebra ZD230 a `IP_192.168.15.34`
- [x] Asignar Godex G530 a `PORT_192.168.15.35`
- [ ] **Configurar IP física en Godex G530** ⚠️ PENDIENTE
- [ ] **Configurar IP física en Zebra ZD230** ⚠️ PENDIENTE
- [ ] Verificar ping a ambas impresoras
- [ ] Configurar IP estática del servidor (192.168.15.21)
- [ ] Reiniciar servidor Node.js
- [ ] Probar impresión de prueba

---

## 🔧 TROUBLESHOOTING

### Las impresoras no responden al ping
- Verifica que estén encendidas
- Confirma que el cable Ethernet esté conectado
- Revisa que estén en la misma VLAN/red
- Usa el panel LCD para verificar IP actual

### El servidor no inicia
- Verifica que el puerto 3012 esté libre: `netstat -ano | findstr 3012`
- Revisa los logs: `logs/` folder
- Confirma que PostgreSQL esté corriendo

### Errores de autenticación de IP
- Verifica que tu IP esté en `ipsPermitidas[]` en `server.js`
- Ejecuta `ipconfig` para confirmar tu IP actual
- Reinicia el servidor después de cambios

---

## 📞 INFORMACIÓN ADICIONAL

**Rango de IPs reservado para impresoras:**
- `192.168.15.30` - `192.168.15.35`

**IPs detectadas en arp-a:**
- `192.168.15.20` → `00-e0-70-bb-37-ec`
- Múltiples IPs `192.168.1.x` (red antigua, pronto desaparecerán)

**Configuración DHCP:**
- Tu PC actual: `192.168.15.6` (DHCP)
- Considerar IP estática si es servidor

---

**Generado:** 5 de diciembre de 2025  
**Script de verificación:** `scripts/actualizar-red-impresoras-simple.ps1`  
**Resumen visual:** `scripts/RESUMEN-CAMBIO-RED.bat`
