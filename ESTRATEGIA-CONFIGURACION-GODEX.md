# 🎯 ESTRATEGIA DE CONFIGURACIÓN GODEX - SIN CONFLICTOS

**Fecha:** 12 de diciembre de 2025  
**Problema Identificado:** Configuración guardada causaba duplicación/tamaños incorrectos  
**Solución:** Impresora lee SOLO nuestro código, no guarda configuración  

---

## ⚠️ PROBLEMA ANTERIOR

### Configuración Guardada con ^JUS

**Antes hacíamos:**
```zpl
^XA
^LL826
^JUS    ← Guardaba en memoria flash permanente
^XZ
```

**Problema:**
- Si la Godex tenía guardado `^LL1100` (14cm) de antes
- Y nosotros enviábamos `^LL826` (7cm)
- **La impresora aplicaba AMBAS configuraciones:**
  1. Leía nuestra `^LL826` → imprimía 7cm
  2. Leía la guardada `^LL1100` → imprimía 14cm ADICIONAL
  3. **Resultado:** 21cm total (3 etiquetas pegadas)

### Otros Conflictos

Si había configurado:
- `^PQ2` → Imprimía 2 copias por cada solicitud
- `^LL1300` → 16.5cm en lugar de 7cm
- `^MMT` → Modo tear-off en lugar de cutter

**Conclusión:** Guardar configuración en impresora = CONFLICTOS

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Estrategia: "Configuración Volátil"

La impresora **NO guarda nada en memoria**. Cada trabajo de impresión envía su propia configuración completa.

### Comandos de Limpieza

**Archivo: `forzar-zpl-godex.js`**

```javascript
const comandosCompletos = `
~R                    // ⭐ Reset completo (BORRA config guardada)
~S,LANGUAGE,ZPL       // Cambiar a modo ZPL
~S,RELOAD             // Recargar configuración
^XA
^CI28                 // UTF-8
^PW354                // Ancho 30mm
^LL826                // Alto 70mm (7cm)
^LH0,0                // Label Home
^LS0                  // Label Shift
^MMC                  // Modo cutter
^MNM                  // Media tracking
^MTD                  // Media type Direct thermal
^XZ
// ⚠️ SIN ^JUS - NO guardamos en memoria
`;
```

### Cada Impresión Envía Configuración Completa

**Archivo: `server.js` → función `generarRotuladoZPL()`**

```javascript
let zpl = `^XA
^MMC              // Modo cutter (cada vez)
^PW354            // Ancho (cada vez)
^LL826            // Alto (cada vez)
^LH0,0
^LS0
... datos del producto ...
^XZ
// ⚠️ SIN ^JUS - Configuración solo para esta etiqueta
`;
```

**Ventajas:**
- ✅ No hay conflictos con configuración anterior
- ✅ Cada etiqueta tiene su configuración exacta
- ✅ Cambios en código se aplican inmediatamente
- ✅ No necesita actualizar firmware de impresora
- ✅ Reset de fábrica borra TODO sin afectar funcionamiento

---

## 🔍 VERIFICACIÓN DE LIMPIEZA

### ¿Cómo saber si la Godex tiene configuración guardada?

**Método 1: Prueba en blanco**

Envía solo esto a la impresora:
```zpl
^XA
^FO50,50^FDPRUEBA^FS
^XZ
```

**Resultado esperado (sin config guardada):**
- Etiqueta pequeña con texto "PRUEBA" en posición 50,50
- Tamaño según default de impresora (no debería aplicar ^LL826)

**Resultado incorrecto (tiene config guardada):**
- Etiqueta a 7cm, 14cm o 16cm
- Indica que ^LL826 o similar está guardado

### Método 2: Comando de diagnóstico

```bash
node -e "const net = require('net'); const s = new net.Socket(); s.connect(9100, '192.168.15.35', () => { s.write('~HS\n'); setTimeout(() => s.end(), 2000); }); s.on('data', d => console.log(d.toString()));"
```

Buscar en respuesta:
```
STORED CONFIG: NONE    ← ✅ Limpia
STORED CONFIG: ^LL826  ← ⚠️ Tiene configuración guardada
```

---

## 🚀 PROCESO DE LIMPIEZA COMPLETA

### 1. Ejecutar Script de Limpieza

```cmd
node forzar-zpl-godex.js
```

**Lo que hace:**
1. `~R` → Borra TODA configuración guardada en flash
2. `~S,LANGUAGE,ZPL` → Cambia a modo ZPL
3. `~S,RELOAD` → Recarga configuración limpia
4. Envía parámetros ZPL básicos (sin guardar)

### 2. **CRÍTICO: Reinicio Físico**

⚠️ **El comando ~R se aplica SOLO después de reiniciar:**

```
1. APAGAR (desconectar cable de poder)
2. Esperar 10 segundos completos
3. MANTENER FEED presionado
4. CONECTAR cable (sin soltar FEED)
5. SOLTAR FEED cuando parpadee
6. Esperar calibración → Luz verde
```

**¿Por qué es necesario?**
- Flash memory se actualiza al apagar/encender
- FEED + power-on fuerza recalibración
- Sin esto, la config vieja permanece

### 3. Verificar Limpieza

```cmd
node test-godex-zpl.js
```

**Resultado esperado:**
- ✅ Etiqueta de 7cm (mide con regla)
- ✅ Texto visible "PRUEBA ZPL MODE"
- ✅ Código de barras "123456"
- ✅ SOLO 1 etiqueta (no doble, no triple)

**Si sale mal:**
- ❌ 14cm o más → Config no se borró, repetir reinicio
- ❌ En blanco → No está en modo ZPL, repetir todo

---

## 📊 COMPARACIÓN DE ESTRATEGIAS

| Aspecto | CON ^JUS (Guardada) | SIN ^JUS (Volátil) ✅ |
|---------|---------------------|------------------------|
| **Velocidad** | Más rápida (no reenvía config) | Ligeramente más lenta (+5% datos) |
| **Conflictos** | ❌ Sí, se acumulan | ✅ No, cada trabajo limpio |
| **Cambios** | Requiere actualizar impresora | ✅ Inmediato desde código |
| **Duplicación** | ❌ Riesgo alto | ✅ Sin riesgo |
| **Reset** | Requiere procedimiento complejo | ✅ Solo ~R |
| **Mantenimiento** | Difícil | ✅ Fácil |
| **Producción** | ❌ Peligroso | ✅ Seguro |

**Veredicto:** Configuración volátil (sin ^JUS) es más segura y mantenible.

---

## 🛡️ PROTECCIÓN CONTRA PROBLEMAS FUTUROS

### 1. Validación en Código

**Archivo: `server.js`**

```javascript
// Verificar que ZPL NO contenga ^JUS accidentalmente
if (zpl.includes('^JUS')) {
    console.error('❌ ERROR: ZPL contiene ^JUS (no permitido)');
    throw new Error('Configuración con ^JUS detectada - usar volátil');
}
```

### 2. Log de Verificación

```javascript
console.log(`🔧 [generarRotuladoZPL] VALORES CRÍTICOS:`);
console.log(`   ALTURA_LABEL: ${ALTURA_LABEL} dots (debe ser 826)`);
console.log(`   Contiene ^JUS: ${zpl.includes('^JUS') ? '❌ SÍ' : '✅ NO'}`);
```

### 3. Script de Verificación Periódica

**Crear: `verificar-godex-limpia.js`**

```javascript
// Verificar que Godex no tenga configuración guardada
const net = require('net');
const socket = new net.Socket();

socket.connect(9100, '192.168.15.35', () => {
    socket.write('~HS\n');
    setTimeout(() => socket.end(), 2000);
});

socket.on('data', (data) => {
    const response = data.toString();
    if (response.includes('STORED') && !response.includes('NONE')) {
        console.error('❌ Godex tiene configuración guardada');
        console.log('Ejecutar: node forzar-zpl-godex.js');
        process.exit(1);
    } else {
        console.log('✅ Godex limpia (sin config guardada)');
    }
});
```

---

## 📝 CHECKLIST DE LIMPIEZA

Antes de producción, verificar:

- [ ] `forzar-zpl-godex.js` NO tiene `^JUS`
- [ ] `server.js` NO genera `^JUS` en ZPL
- [ ] Ejecutado `node forzar-zpl-godex.js`
- [ ] Reiniciado Godex con FEED presionado
- [ ] Prueba imprime 7cm (no 14cm, no 16cm)
- [ ] Solo 1 etiqueta por solicitud (no duplica)
- [ ] Luz verde después de imprimir (no roja)

---

## 🔄 MANTENIMIENTO PERIÓDICO

### Cada Mes

```cmd
# Verificar que no haya configuración acumulada
node verificar-godex-limpia.js
```

### Después de Cambios en Código

```cmd
# Reiniciar servidor para aplicar cambios
npm restart
# O
node server.js
```

### Si hay Problemas

```cmd
# Limpieza completa
node forzar-zpl-godex.js
# Luego reiniciar Godex con FEED
```

---

## ✅ RESULTADO FINAL

**Configuración actual:**

```
┌─────────────────────────────────────────────┐
│  GODEX G530 - CONFIGURACIÓN LIMPIA          │
├─────────────────────────────────────────────┤
│  Modo: ZPL (emulación Zebra)                │
│  Memoria flash: VACÍA (sin config guardada) │
│  Cada trabajo: Envía ^LL826, ^PW354, ^MMC   │
│  Resultado: 7cm SIEMPRE, sin duplicación    │
└─────────────────────────────────────────────┘
```

**Ventajas de esta estrategia:**

1. ✅ **Predecible:** Cada etiqueta exactamente 7cm
2. ✅ **Sin duplicados:** Una solicitud = una etiqueta
3. ✅ **Fácil debug:** ZPL completo visible en logs
4. ✅ **Cambios rápidos:** Editar código → funciona inmediato
5. ✅ **Sin mantenimiento:** No necesita actualizar impresora
6. ✅ **Producción segura:** No hay sorpresas

---

**Documentado por:** Sistema de Etiquetas V2.5  
**Última actualización:** 12 de diciembre de 2025  
**Archivos relacionados:**
- `forzar-zpl-godex.js` (limpieza y configuración)
- `server.js` (generación ZPL sin ^JUS)
- `VERIFICACION-FINAL-GODEX.bat` (script verificación)
- `PROBLEMA-DUPLICACION-SOLUCION.md` (análisis problema)
