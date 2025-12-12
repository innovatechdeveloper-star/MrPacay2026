# 🖨️ SOLUCIÓN: CONFIGURAR GODEX G530 PARA ACEPTAR ZPL

**Fecha:** 12 de diciembre de 2025  
**Impresora:** Godex G530 (300 DPI)  
**Problema:** Etiquetas salen en blanco + luz roja + pitidos  
**Causa:** Impresora en modo EZPL, necesita cambiar a ZPL  

---

## ⚠️ SÍNTOMAS DEL PROBLEMA

- ✅ Servidor envía comandos ZPL correctamente
- ✅ Puerto 9100 responde
- ❌ Etiquetas salen **EN BLANCO**
- 🔴 Luz **ROJA** después de imprimir
- 🔊 Pitidos **BIP BIP**
- 💡 La impresora acepta comandos pero no interpreta ZPL

**DIAGNÓSTICO:** La Godex G530 está en modo **EZPL** (lenguaje nativo) y no acepta comandos **ZPL** (Zebra emulation).

---

## ✅ SOLUCIÓN EXITOSA

### Archivo creado: `forzar-zpl-godex.js`

Script que envía la secuencia correcta de comandos para cambiar de EZPL a ZPL.

### Comandos enviados:

```javascript
~R                    // Reset general de la impresora
~S,LANGUAGE,ZPL       // Cambiar lenguaje a ZPL (COMANDO CLAVE)
~S,RELOAD             // Recargar configuración
^XA                   // Inicio formato ZPL
^CI28                 // Encoding UTF-8
^PW354                // Ancho 354 dots (30mm @ 300 DPI)
^LL826                // Alto 826 dots (70mm @ 300 DPI)
^LH0,0                // Label Home
^LS0                  // Label Shift
^MMC                  // Media Mode Cutter (guillotina)
^MNM                  // Media tracking
^MTD                  // Media type Direct thermal
^JUS                  // Guardar en memoria permanente
^XZ                   // Fin formato
```

---

## 📋 PROCESO COMPLETO PASO A PASO

### 1. Verificar conexión

```bash
ping 192.168.15.35
```

Si no responde → Impresora apagada o desconectada

### 2. Verificar puerto abierto

```powershell
Test-NetConnection -ComputerName 192.168.15.35 -Port 9100
```

Si falla → Impresora apagada o servicio no activo

### 3. Ejecutar configuración

```bash
node forzar-zpl-godex.js
```

**Salida esperada:**
```
✅ Conectado
📤 Enviando configuración completa...
✅ 14 comandos enviados
⏳ Procesando...
✅ CONFIGURACIÓN COMPLETADA
```

### 4. **CRÍTICO: Reinicio completo**

⚠️ **SIN ESTE PASO NO FUNCIONARÁ:**

1. **APAGAR** la impresora (desconectar cable de poder)
2. **ESPERAR** 10 segundos completos
3. **MANTENER FEED** presionado
4. **CONECTAR** cable de poder (sin soltar FEED)
5. **SOLTAR FEED** cuando la luz parpadee
6. Esperar calibración automática
7. Luz debe cambiar a 🟢 **VERDE**

### 5. Probar impresión

```bash
node test-godex-zpl.js
```

**Resultado esperado:**
- ✅ Etiqueta con texto visible
- ✅ "PRUEBA ZPL MODE"
- ✅ Código de barras "123456"
- ✅ Luz verde después de imprimir

---

## 🔧 ARCHIVOS CREADOS

### Scripts principales:

1. **`forzar-zpl-godex.js`** ⭐
   - Script definitivo para cambiar a ZPL
   - Secuencia completa de comandos
   - Incluye reset + configuración + guardado

2. **`configurar-godex-lenguaje.js`**
   - Versión simplificada (solo comandos ~S)
   - Útil para cambios rápidos

3. **`configurar-godex-simple.js`**
   - Intento inicial (solo ZPL sin reset)
   - No funcionó solo

4. **`test-godex-zpl.js`**
   - Prueba de etiqueta simple
   - Verifica si ZPL funciona
   - Etiqueta 30mm × 70mm con texto y barcode

### Scripts auxiliares:

- **`PROBAR-GODEX-ZPL.bat`** - Wrapper para ejecutar test
- **`CONFIGURAR-GODEX-ZPL.bat`** - Wrapper para configurar
- **`VER-LOGS-SERVIDOR.bat`** - Monitor de logs

---

## 🎯 DIFERENCIAS CLAVE: EZPL vs ZPL

### EZPL (Godex nativo):
```
^L              // Inicio
H10             // Darkness
S2              // Speed
Q354,024        // Dimensiones
A10,10,0,3,1,1,N,"TEXTO"  // Comando A para texto
E               // Fin
```

### ZPL (Zebra emulation):
```zpl
^XA             // Inicio
^PW354          // Page Width
^LL826          // Label Length
^CF0,35         // Change Font
^FO20,130^FDTEXTO^FS  // Field Origin + Data
^XZ             // Fin
```

**IMPORTANTE:** El sistema usa **ZPL puro**, por lo que la Godex G530 debe estar en **modo emulación ZPL**.

---

## 🔍 COMANDOS GODEX NATIVOS (~S)

| Comando | Descripción |
|---------|-------------|
| `~C` | Limpiar buffer |
| `~R` | Reset general |
| `~S,LANGUAGE,ZPL` | **Cambiar a ZPL** |
| `~S,LANGUAGE,EZPL` | Cambiar a EZPL |
| `~S,RELOAD` | Recargar configuración |
| `~S,CUTTER,ENABLE` | Activar guillotina |
| `~S,CUTTER,BATCH,1` | Cortar cada etiqueta |

---

## 📊 LOGS IMPLEMENTADOS

El servidor ahora genera logs detallados al imprimir:

```javascript
========================================
🏷️  [ROTULADO GODEX] INICIO
========================================
📡 Datos recibidos del dispositivo:
   • ID Solicitud: 123
   • Corte automático: ✅ ACTIVADO
   • IP Cliente: 192.168.15.26

📦 Datos del producto:
   • Nombre: SABANA BP QUEEN
   • Subcategoría: SABANA
   • Marca (Tela): BP
   • Modelo (Tamaño): QUEEN
   • Código: 10011

🎨 Configuración de logos:
   • Logo Principal: camitex (default)
   • Logo Misti: ✅ Sí
   • Iconos: ✅ Sí

🔧 Generando código ZPL...
📝 Código ZPL generado:
   • Longitud: 5234 caracteres
   • Primeros 500 caracteres: ^XA^MMC^PW354...
   
✅ ROTULADO COMPLETADO
========================================
```

---

## ⚙️ CONFIGURACIÓN DE RED

### IPs actualizadas:

```javascript
// Servidor
IP: 192.168.15.22
Puerto: 3012

// Zebra ZD230 (etiquetas QR)
IP: 192.168.15.34
Puerto: 9100

// Godex G530 (rotulados)
IP: 192.168.15.35
Puerto: 9100

// IPs permitidas en validación:
const ipsPermitidas = [
    '127.0.0.1',
    '::1',
    '192.168.15.22',    // Servidor
    '192.168.15.26',    // Dispositivo cliente ⭐ AGREGADA
    '192.168.15.34',    // Zebra ZD230
    '192.168.15.35'     // Godex G530
];
```

---

## 🚨 TROUBLESHOOTING

### Problema: Etiqueta en blanco después de configurar

**Solución:**
```bash
# 1. Verificar que se reinició la impresora
node forzar-zpl-godex.js

# 2. APAGAR completamente (desconectar)
# Esperar 10 segundos

# 3. Calibración al encender:
# Mantener FEED + conectar + soltar cuando parpadee

# 4. Probar nuevamente
node test-godex-zpl.js
```

### Problema: Luz roja permanente

**Solución:**
```bash
# Método 1: FEED 3 veces
Presionar botón FEED 3 veces seguidas

# Método 2: Calibración completa
Apagar → Mantener FEED → Encender → Soltar al parpadear

# Método 3: Manual
Panel físico → Presionar FEED hasta que calibre
```

### Problema: Puerto 9100 no responde

**Diagnóstico:**
```powershell
# Verificar conexión
ping 192.168.15.35

# Verificar puerto
Test-NetConnection -ComputerName 192.168.15.35 -Port 9100
```

**Solución:**
- Impresora apagada → Encender
- Cable desconectado → Reconectar
- Puerto ocupado → Reiniciar impresora

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
mi-app-etiquetas/
├── server.js                          # Código principal con logs
├── forzar-zpl-godex.js               # ⭐ Script configuración ZPL
├── test-godex-zpl.js                 # Prueba de ZPL
├── configurar-godex-lenguaje.js      # Config simplificada
├── PROBAR-GODEX-ZPL.bat              # Wrapper de prueba
├── CONFIGURAR-GODEX-ZPL.bat          # Wrapper de config
├── VER-LOGS-SERVIDOR.bat             # Monitor logs
├── SOLUCION-ADMIN.ps1                # Config firewall/red
├── DIAGNOSTICO-CONEXION-COMPLETO.bat # Diagnóstico red
└── documentation/
    └── avances-tecnicos/
        ├── 042-REVISION-GODEX-COMPLETA.md
        ├── 044-SOLUCION-LUZ-ROJA-GODEX.md
        └── 005-CONFIGURACION-ROTULADO-GODEX.md
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de usar el sistema:

- [x] Godex G530 encendida
- [x] Cable de red conectado
- [x] IP 192.168.15.35 responde a ping
- [x] Puerto 9100 abierto
- [x] Configuración ZPL aplicada (`forzar-zpl-godex.js`)
- [x] Impresora reiniciada completamente
- [x] Calibración realizada (FEED al encender)
- [x] Luz verde encendida
- [x] Prueba exitosa (`test-godex-zpl.js`)
- [x] Etiqueta de prueba impresa con texto visible

---

## 🎓 LECCIONES APRENDIDAS

1. **La Godex G530 por defecto usa EZPL**, no ZPL
2. **Cambiar el lenguaje requiere comandos nativos ~S**
3. **El reinicio completo es OBLIGATORIO** para aplicar cambios
4. **La calibración (FEED al encender) es crítica** después del cambio
5. **Los comandos ZPL estándar funcionan** una vez en modo emulación
6. **El comando clave es `~S,LANGUAGE,ZPL`**
7. **Siempre guardar con `^JUS`** para persistir configuración

---

## 🔄 MANTENIMIENTO FUTURO

### Si la impresora vuelve a EZPL:

**Causa común:** Reset de fábrica o actualización de firmware

**Solución rápida:**
```bash
node forzar-zpl-godex.js
# Apagar + Encender con FEED
node test-godex-zpl.js
```

### Verificar modo actual:

```bash
# Enviar etiqueta ZPL de prueba
node test-godex-zpl.js

# Si sale en blanco → Modo EZPL
# Si sale con texto → Modo ZPL
```

---

## 📞 CONTACTO Y SOPORTE

**Documentación Godex:**
- Manual G530: https://www.godexprinters.com
- Comandos ~S: Ver manual técnico sección "Setup Commands"

**Documentación ZPL:**
- Zebra Programming Guide: https://www.zebra.com/zpl

**Soporte técnico:**
- Buscar distribuidor autorizado Godex en Perú
- Verificar firmware compatible con emulación ZPL

---

## 📝 NOTAS ADICIONALES

- **DPI:** 300 (Godex G530)
- **Dimensiones etiqueta:** 30mm × 70mm (354 × 826 dots)
- **Conexión:** TCP/IP puerto 9100
- **Protocolo:** Raw TCP (no requiere drivers)
- **Lenguaje requerido:** ZPL II (Zebra emulation)
- **Backup recomendado:** Documentar IP y configuración

---

**Estado:** ✅ **FUNCIONANDO CORRECTAMENTE**

**Última actualización:** 12 de diciembre de 2025

---

## 🔗 ENLACES RELACIONADOS

- [CONFIGURACION-ROTULADO-GODEX-FINAL.md](./CONFIGURACION-ROTULADO-GODEX-FINAL.md) - Especificaciones técnicas de etiquetas
- [042-REVISION-GODEX-COMPLETA.md](./documentation/avances-tecnicos/042-REVISION-GODEX-COMPLETA.md) - Revisión del sistema
- [044-SOLUCION-LUZ-ROJA-GODEX.md](./documentation/avances-tecnicos/044-SOLUCION-LUZ-ROJA-GODEX.md) - Solución luz roja
- [server.js](./server.js) - Línea 726: `generarRotuladoZPL()`
- [server.js](./server.js) - Línea 3301: `enviarZPLAGodex()`
- [server.js](./server.js) - Línea 5132: `/api/registros/:id/imprimir-rotulado`

---

**✅ CONFIGURACIÓN VALIDADA Y DOCUMENTADA**
