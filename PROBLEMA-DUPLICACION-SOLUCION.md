# 🚨 PROBLEMA: ETIQUETAS DUPLICADAS / TAMAÑO INCORRECTO

**Fecha:** 12 de diciembre de 2025  
**Impresora:** Godex G530 (300 DPI)  
**Síntomas:**
- Etiquetas salen a 14cm o 16.5cm (deberían ser 7cm)
- Se imprimen duplicadas
- Espacios vacíos de 5-6cm arriba y abajo
- Últimamente salen completamente en blanco

---

## 🎯 CAUSA RAÍZ IDENTIFICADA

### Problema 1: MODO DE LENGUAJE INCORRECTO

La **Godex G530** tiene configuración de fábrica en **EZPL** (lenguaje nativo Godex), pero nuestro sistema envía comandos **ZPL** (emulación Zebra).

**Resultado:** Cuando la impresora recibe ZPL estando en modo EZPL:
- ❌ Ignora todos los comandos
- ❌ Imprime en blanco
- ❌ O interpreta incorrectamente las dimensiones

### Problema 2: DUPLICACIÓN POR CONFIGURACIÓN PREVIA

Si la impresora tiene configuración guardada con dimensiones diferentes:

```
Configuración guardada en Godex:  ^LL1100  (14cm aprox)
Nuestro ZPL actual:                ^LL826   (7cm)
```

**Resultado:** La impresora aplica AMBAS configuraciones:
1. Lee ^LL826 del ZPL → imprime primera etiqueta 7cm
2. Aplica configuración guardada ^LL1100 → imprime segunda etiqueta 14cm
3. Total: ~21cm de papel (3x el tamaño esperado)

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Paso 1: CONFIGURAR MODO ZPL

**Archivo creado:** `VERIFICAR-Y-CONFIGURAR-GODEX.bat`

Este script:
1. Verifica conexión con la impresora
2. Envía comandos para cambiar a modo ZPL
3. Resetea cualquier configuración previa conflictiva
4. Hace prueba de impresión

**Comandos enviados:**
```
~R                    // Reset completo (borra config guardada)
~S,LANGUAGE,ZPL       // Cambiar a modo ZPL
~S,RELOAD             // Recargar configuración
^XA
^CI28                 // UTF-8
^PW354                // Ancho 30mm (354 dots)
^LL826                // Alto 70mm (826 dots) ← VALOR CORRECTO
^MMC                  // Modo cutter
^JUS                  // Guardar permanente
^XZ
```

### Paso 2: CORRECCIÓN DE DIMENSIONES EN CÓDIGO

**Archivo modificado:** `server.js` → función `generarRotuladoZPL()`

**ANTES (incorrecto):**
```javascript
const ALTURA_LABEL = 827;  // ❌ 1 dot de más
const Y_BARCODE = ALTURA_LABEL - MARGEN_INFERIOR - 65;  // ❌ Cálculo dinámico
```

**AHORA (correcto según documentación oficial):**
```javascript
const ALTURA_LABEL = 826;  // ✅ 70mm @ 300 DPI (7.0cm exactos)
const Y_BARCODE = 653;     // ✅ Posición fija documentada (5.53cm)
```

**Fuente:** `CONFIGURACION-ROTULADO-GODEX-FINAL.md` (documento oficial del proyecto)

---

## 📋 PROCESO DE SOLUCIÓN PASO A PASO

### 1. EJECUTAR CONFIGURACIÓN

```bash
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
VERIFICAR-Y-CONFIGURAR-GODEX.bat
```

**Lo que hace:**
- Ping a 192.168.15.35 (verifica impresora encendida)
- Ejecuta `forzar-zpl-godex.js` (envía comandos de configuración)
- Ejecuta `test-godex-zpl.js` (prueba etiqueta simple)

### 2. **CRÍTICO:** REINICIO COMPLETO

⚠️ **SIN ESTE PASO NO FUNCIONA:**

1. **APAGAR** impresora (desconectar cable de poder)
2. **ESPERAR** 10 segundos completos
3. **MANTENER FEED** presionado
4. **CONECTAR** cable de poder (SIN soltar FEED)
5. **SOLTAR FEED** cuando luz parpadee
6. Esperar calibración automática
7. Luz debe quedar 🟢 **VERDE**

**¿Por qué es necesario?**
- La Godex guarda configuración en memoria flash
- Solo se actualiza al apagar/encender completamente
- El botón FEED durante encendido fuerza recalibración

### 3. VERIFICAR PRUEBA

Después del reinicio, el script ejecuta prueba automática:

**Resultado esperado:**
- ✅ Etiqueta de **7cm** (no 14cm o 16cm)
- ✅ Texto visible: "PRUEBA ZPL MODE"
- ✅ Código de barras: "123456"
- ✅ Solo **1 etiqueta** (no duplicada)
- ✅ Luz verde después de imprimir

**Si sale en blanco:**
- ❌ La impresora NO cambió a modo ZPL
- Repetir proceso de reinicio (paso 2)
- Verificar que se mantuvo FEED presionado al encender

---

## 🔍 VERIFICACIÓN DE CONFIGURACIÓN ACTUAL

### Método 1: Prueba de etiqueta

```bash
node test-godex-zpl.js
```

**Interpretación:**
- ✅ Sale con texto → Modo ZPL activo
- ❌ Sale en blanco → Modo EZPL (nativo), necesita configuración
- ❌ Sale doble → Configuración guardada conflictiva

### Método 2: Comando de diagnóstico

```bash
node -e "const net = require('net'); const s = new net.Socket(); s.connect(9100, '192.168.15.35', () => { s.write('~HS\n'); setTimeout(() => s.end(), 2000); }); s.on('data', d => console.log(d.toString()));"
```

**Buscar en respuesta:**
```
LANGUAGE: ZPL     ← ✅ Modo correcto
LANGUAGE: EZPL    ← ❌ Necesita configuración
```

---

## 🎯 RESUMEN DE CAMBIOS REALIZADOS

### Archivo: `server.js`

**Línea ~823:**
```javascript
// ANTES:
const ALTURA_LABEL = 827;  // ❌ Error de 1 dot

// AHORA:
const ALTURA_LABEL = 826;  // ✅ Según documentación oficial (70mm @ 300 DPI)
```

**Línea ~843:**
```javascript
// ANTES:
const Y_BARCODE = ALTURA_LABEL - MARGEN_INFERIOR - 65;  // ❌ Cálculo dinámico

// AHORA:
const Y_BARCODE = 653;  // ✅ Posición fija documentada (5.53cm)
```

### Archivo: `administracion-mejorado.html`

**Líneas ~40-45:**
```css
/* ANTES: */
body {
    overflow-y: auto;  /* ❌ No funcionaba */
}

/* AHORA: */
body {
    overflow-y: scroll !important;  /* ✅ Fuerza scroll vertical */
    padding-bottom: 50px;           /* ✅ Espacio para scroll completo */
}
```

### Archivo creado: `VERIFICAR-Y-CONFIGURAR-GODEX.bat`

Script automatizado que:
1. Verifica conexión
2. Configura modo ZPL
3. Resetea configuración conflictiva
4. Ejecuta prueba
5. Guía paso a paso para reinicio

---

## 📊 ESPECIFICACIONES FINALES

### Dimensiones Correctas

```
┌─────────────────────────────────────┐
│  🔧 GODEX G530 - 300 DPI            │
├─────────────────────────────────────┤
│  Ancho:  30mm = 354 dots            │
│  Alto:   70mm = 826 dots            │ ← CRÍTICO: Era 827 (error)
│                                     │
│  Comando ZPL:                       │
│  ^PW354  (ancho)                    │
│  ^LL826  (alto)                     │ ← CRÍTICO: Era 827 (error)
└─────────────────────────────────────┘
```

### Distribución de Contenido

```
  0 dots  ┌─────────────────────────┐
          │   Costura (1cm)         │
118 dots  ├─────────────────────────┤ ← Y_LOGO = 128
          │   Logo                  │
238 dots  │   Producto              │ ← Y_PRODUCTO_1 = 238
          │   Tela                  │
          │   Modelo                │
418 dots  ├─────────────────────────┤ ← Y_ICONOS_1 = 418
          │   Iconos advertencia    │
653 dots  │   Código barras         │ ← Y_BARCODE = 653 (fijo)
708 dots  ├─────────────────────────┤
          │   Costura (1cm)         │
826 dots  └─────────────────────────┘ ← ALTURA_LABEL = 826
```

---

## 🚀 PRÓXIMOS PASOS

1. **AHORA:** Ejecutar `VERIFICAR-Y-CONFIGURAR-GODEX.bat`
2. **DESPUÉS:** Reiniciar impresora (FEED presionado al encender)
3. **VERIFICAR:** Etiqueta de prueba debe ser 7cm con texto visible
4. **PRODUCCIÓN:** Si prueba exitosa, sistema listo para costura

---

## 📞 SI EL PROBLEMA PERSISTE

### Síntoma: Sigue saliendo en blanco

**Causa:** Impresora no cambió a modo ZPL

**Solución:**
1. Verificar que cable de poder se desconectó completamente
2. Esperar 15 segundos (no solo 10)
3. Asegurar que FEED se mantuvo presionado TODO el tiempo al encender
4. Repetir configuración con `VERIFICAR-Y-CONFIGURAR-GODEX.bat`

### Síntoma: Sigue saliendo doble (14cm)

**Causa:** Configuración antigua guardada en memoria flash

**Solución:**
```bash
# Enviar reset profundo
node -e "const net = require('net'); const s = new net.Socket(); s.connect(9100, '192.168.15.35', () => { s.write('~R\n~S,RESET\n~S,RELOAD\n'); setTimeout(() => s.end(), 3000); });"
```

Luego repetir reinicio con FEED presionado.

### Síntoma: Sigue saliendo a 16.5cm

**Causa:** Configuración de página en memoria de impresora

**Solución:**
1. Acceder al panel de control de la Godex (botones físicos)
2. Buscar menú "SYSTEM" o "CONFIG"
3. Seleccionar "RESTORE DEFAULT" o "FACTORY RESET"
4. Confirmar reset
5. Apagar/encender con FEED presionado
6. Ejecutar `VERIFICAR-Y-CONFIGURAR-GODEX.bat`

---

## ✅ CONFIRMACIÓN DE ÉXITO

**Checklist final:**

- [ ] Etiqueta sale a **7cm** (no 14cm, no 16cm)
- [ ] Solo **1 etiqueta** por impresión (no duplicada)
- [ ] Texto **visible** (no en blanco)
- [ ] Código de barras **escaneable**
- [ ] Márgenes de **1cm** arriba y abajo (para costura)
- [ ] Luz **verde** después de imprimir (no roja)
- [ ] Sin pitidos de error

Si todos los puntos están ✅, el sistema está listo para producción.

---

**Documentado por:** Sistema de Etiquetas V2.5  
**Última actualización:** 12 de diciembre de 2025  
**Archivos relacionados:**
- `CONFIGURACION-ROTULADO-GODEX-FINAL.md` (especificaciones oficiales)
- `SOLUCION-CONFIGURAR-GODEX-ZPL.md` (guía técnica ZPL vs EZPL)
- `forzar-zpl-godex.js` (script de configuración)
- `test-godex-zpl.js` (script de prueba)
- `VERIFICAR-Y-CONFIGURAR-GODEX.bat` (automatización completa)
