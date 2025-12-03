# 🎨 SISTEMA DE PLANTILLAS ZPL DINÁMICAS

## 📋 OVERVIEW

Sistema que genera etiquetas diferentes según la configuración de cada producto:
- **Plantilla DEFAULT**: QR + Texto (formato actual, NO modificado)
- **Plantilla TEXT_ONLY**: Solo texto grande sin QR (NUEVO)

---

## 🔧 ARQUITECTURA

### **1. Frontend (supervisor-dashboard.html)**
```
┌─────────────────────────────────────┐
│  Editar Producto                    │
│  ┌───────────────────────────────┐  │
│  │ QR   ✓  Código QR escaneable │  │
│  │ NOMBRE ✓  Nombre del producto│  │
│  │ ID     ✗  Código único        │  │
│  │ UNIDAD ✓  Unidad de medida   │  │
│  │ MODELO ✓  Modelo/variante    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Validaciones JS:**
- ✅ Si QR=false, debe haber ≥1 campo de texto activo
- ✅ No permite desactivar todos los campos
- ✅ Muestra notificación de advertencia

### **2. Backend (server.js)**

#### Función Principal: `selectZPLTemplate(data, config)`
```javascript
if (config.mostrar_qr === false) {
    return generateTextOnlyZPL(data, config);  // 🆕 Plantilla nueva
} else {
    return generateDoubleZPL(data);            // ✅ Plantilla original
}
```

#### Plantilla DEFAULT (generateDoubleZPL)
- **Estado:** ✅ FUNCIONAL - NO MODIFICADO
- **Cuándo:** `mostrar_qr = true` (por defecto)
- **Layout:** QR 50% izquierda + Texto 50% derecha
- **Campos:** TODOS visibles siempre

#### Plantilla TEXT_ONLY (generateTextOnlyZPL) 🆕
- **Estado:** 🆕 NUEVO - EN PRUEBAS
- **Cuándo:** `mostrar_qr = false`
- **Layout:** Texto ocupa 100% del ancho
- **Tamaños de fuente:** 
  - Nombre: 40/60 (DPI 203/300)
  - Modelo: 32/48
  - Unidad: 24/36
  - ID: 24/36
  - Hecho en Perú: 22/33

---

## 🧪 CÓMO PROBAR

### **PASO 1: Migrar la Base de Datos**
```sql
-- Ejecutar en pgAdmin
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS mostrar_qr BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_nombre BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_id BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mostrar_unidad BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_modelo BOOLEAN DEFAULT true;
```

### **PASO 2: Reiniciar Servidor**
```cmd
cd d:\Informacion\DESARROLLO\mi-app-etiquetas\mi-app-etiquetas
node server.js
```

### **PASO 3: Configurar Producto para Prueba SIN QR**

1. Abre Dashboard Supervisor: `https://localhost:3010/supervisor-dashboard.html`
2. Busca un producto de prueba (ej: "ALMOHADA")
3. Click en **"Editar ✏️"**
4. En "Configuración de Etiqueta":
   - ❌ Desactiva **QR** (click en el botón)
   - ✅ Deja activos: NOMBRE, UNIDAD, MODELO
5. Click **"💾 Guardar Cambios"**

### **PASO 4: Crear Solicitud de Prueba**

1. Abre Dashboard Costurera: `https://localhost:3010/costurera-dashboard.html`
2. Busca el producto configurado (ALMOHADA)
3. Crea solicitud con **cantidad: 2**
4. Click **"Crear Solicitud"**

### **PASO 5: Aprobar e Imprimir**

1. Ve al Dashboard Supervisor
2. En "Solicitudes Recientes (24h)" verás la solicitud
3. Click **"Aprobar"** → Automáticamente se enviará a imprimir

### **PASO 6: Verificar en Terminal**

Busca estos logs en la terminal del servidor:

```
🎯 [selectZPLTemplate] Seleccionando plantilla...
📋 Configuración producto: { mostrar_qr: false, mostrar_nombre: true, ... }
📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)
📄 [generateTextOnlyZPL] ⭐ MODO SIN QR - Textos grandes para ZD230
✅ [generateTextOnlyZPL] ZPL generado: XXXX caracteres
```

---

## 📐 COMPARACIÓN DE FORMATOS

### **Formato CON QR (Default)**
```
┌────────────┬────────────┐
│  ▓▓▓▓▓▓   │ ALMOHADA   │
│  ▓▓▓▓▓▓   │            │
│  ▓▓▓▓▓▓   │ 2 PLAZAS   │
│  ▓ QR ▓   │ UM: UNIDAD │
│  ▓▓▓▓▓▓   │ ID: 000123 │
│  ▓▓▓▓▓▓   │ HECHO PERU │
└────────────┴────────────┘
```

### **Formato SIN QR (Text Only)**
```
┌─────────────────────────┐
│                         │
│   ALMOHADA              │
│   (GRANDE 40-60 DPI)    │
│                         │
│   2 PLAZAS              │
│   (32-48 DPI)           │
│                         │
│   UM: UNIDAD            │
│   ID: 000123            │
│   HECHO EN PERU         │
│                         │
└─────────────────────────┘
```

---

## 🐛 RESOLUCIÓN DE PROBLEMAS

### **Error: "Debe haber al menos un campo activo"**
**Causa:** Intentaste desactivar todos los campos  
**Solución:** Deja al menos QR o un campo de texto activo

### **Imprime QR vacío**
**Causa:** Configuración no se cargó correctamente  
**Solución:** Verifica logs:
```
🎨 [processPrintQueue] Configuración personalizada cargada: {...}
```

### **Plantilla incorrecta**
**Causa:** Configuración tiene valores NULL en BD  
**Solución:** Ejecuta UPDATE:
```sql
UPDATE productos 
SET 
    mostrar_qr = COALESCE(mostrar_qr, true),
    mostrar_nombre = COALESCE(mostrar_nombre, true),
    mostrar_id = COALESCE(mostrar_id, false),
    mostrar_unidad = COALESCE(mostrar_unidad, true),
    mostrar_modelo = COALESCE(mostrar_modelo, true);
```

---

## 📊 REGLAS DE NEGOCIO

| Configuración | Plantilla Usada | Resultado |
|--------------|----------------|-----------|
| QR=true + todos los textos | DEFAULT | QR + Texto estándar |
| QR=true + algunos textos off | DEFAULT | QR + Textos seleccionados |
| QR=false + ≥1 texto activo | TEXT_ONLY | Texto grande sin QR |
| QR=false + 0 textos | ❌ ERROR | Frontend impide guardarlo |

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Probar con impresora real
2. ✅ Ajustar tamaños de fuente si es necesario
3. ✅ Validar alineación vertical en TEXT_ONLY
4. 📸 Tomar fotos de etiquetas impresas
5. 🔧 Ajustar espaciado entre líneas si es necesario

---

## 📝 NOTAS TÉCNICAS

### Archivos Modificados:
- `server.js` (líneas ~240-540): Nuevas funciones ZPL
- `supervisor-dashboard.html` (líneas ~1350-1520): CSS botones
- `supervisor-dashboard.html` (líneas ~3250-3340): HTML configuración
- `supervisor-dashboard.html` (líneas ~5362-5415): JS validación

### Base de Datos:
- Tabla: `productos`
- Columnas nuevas: `mostrar_qr`, `mostrar_nombre`, `mostrar_id`, `mostrar_unidad`, `mostrar_modelo`
- Tipo: `BOOLEAN`

### Impresora:
- Modelo: Zebra ZD230-203dpi
- IP: 192.168.1.34:9100
- Resolución: 203 DPI
- Tamaño etiqueta: 100x150mm (799x1199 dots)

---

**¡Sistema listo para probar!** 🚀
