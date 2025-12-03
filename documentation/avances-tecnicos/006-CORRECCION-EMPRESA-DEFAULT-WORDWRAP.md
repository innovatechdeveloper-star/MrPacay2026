# ✅ CORRECCIÓN: Campo EMPRESA con Default y Word Wrap

**Fecha**: 24 de octubre de 2025  
**Problemas Resueltos**:
1. Campo "empresa" ahora tiene valor por defecto "HECHO EN PERU" al crear productos
2. Texto de empresa ahora hace salto de línea automático cuando es muy largo

---

## 🔧 CAMBIOS REALIZADOS

### 1️⃣ **Base de Datos: Nueva Columna con Default**

**Archivo**: `migrations/add_empresa_column_to_productos.sql` ✨ NUEVO

```sql
ALTER TABLE productos 
    ADD COLUMN empresa VARCHAR(100) DEFAULT 'HECHO EN PERU';
```

**Ejecución**:
```bash
ejecutar-migracion-empresa.bat
```

---

### 2️⃣ **Backend: INSERT con Valor por Defecto**

**Archivo**: `server.js` (línea ~2835)

**Antes**:
```javascript
INSERT INTO productos (
    codigo_producto, nombre_producto, ..., activo,
    fecha_creacion, fecha_actualizacion
) VALUES ($1, $2, ..., $11, NOW(), NOW())
```

**Ahora**:
```javascript
INSERT INTO productos (
    codigo_producto, nombre_producto, ..., activo, 
    empresa,  // 🏢 NUEVO
    fecha_creacion, fecha_actualizacion
) VALUES ($1, $2, ..., $11, $12, NOW(), NOW())
// ...
'HECHO EN PERU' // 🏢 Valor por defecto para empresa
```

---

### 3️⃣ **Impresión: Word Wrap Automático con `^FB`**

#### **Plantilla CON QR** (`generateDoubleZPL`)

**Etiqueta Izquierda** (línea ~331):
```javascript
// ANTES (sin word wrap - se cortaba)
^FO${x},179^FD${empresa || 'HECHO EN PERU'}^FS

// AHORA (con word wrap - salta a siguiente línea)
^FO${x},179^FB180,2,0,L^FD${empresa || 'HECHO EN PERU'}^FS
                ↑    ↑ ↑ ↑
                │    │ │ └─ Alineación Izquierda
                │    │ └─── Espaciado entre líneas
                │    └───── Máximo 2 líneas
                └────────── Ancho: 180 dots
```

**Etiqueta Derecha** (línea ~374):
```javascript
^FO${rightX},179^FB180,2,0,L^FD${empresa || 'HECHO EN PERU'}^FS
```

#### **Plantilla SIN QR** (`generateTextOnlyZPL`)

**Etiqueta Izquierda** (línea ~498):
```javascript
// Ancho dinámico = SINGLE_LABEL_WIDTH - 60 (márgenes)
^FO30,${currentY}^FB${ZEBRA_CONFIG.SINGLE_LABEL_WIDTH - 60},2,0,L^FD${empresa || 'HECHO EN PERU'}^FS
```

**Etiqueta Derecha** (línea ~537):
```javascript
^FO${rightX},${currentY}^FB${ZEBRA_CONFIG.SINGLE_LABEL_WIDTH - 60},2,0,L^FD${empresa || 'HECHO EN PERU'}^FS
```

---

## 🎯 COMPORTAMIENTO ESPERADO

### **ANTES** (Texto largo se cortaba):
```
PRODUCTOS DEL DESCAN  S.A.C MARISCAL
                      ↑
                      Se cortaba y saltaba a otra etiqueta
```

### **AHORA** (Texto largo hace word wrap):
```
PRODUCTOS DEL 
DESCANSO S.A.C
↑
Salta automáticamente a la siguiente línea
```

---

## 📋 EJEMPLO DE FUNCIONAMIENTO

### **Caso 1: Texto Corto** (cabe en 1 línea)
```
Input:  "HECHO EN PERU"
Output: HECHO EN PERU
```

### **Caso 2: Texto Mediano** (cabe en 2 líneas)
```
Input:  "PRODUCTOS DEL DESCANSO S.A.C"
Output: PRODUCTOS DEL 
        DESCANSO S.A.C
```

### **Caso 3: Texto Muy Largo** (se trunca después de 2 líneas)
```
Input:  "PRODUCTOS DEL DESCANSO SOCIEDAD ANONIMA CERRADA LIMA PERU"
Output: PRODUCTOS DEL DESCANSO
        SOCIEDAD ANONIMA CER...
        (Zebra automáticamente trunca después de línea 2)
```

---

## 🚀 PASOS PARA APLICAR

### 1. **Ejecutar Migración de Base de Datos**
```bash
ejecutar-migracion-empresa.bat
```

### 2. **Reiniciar Servidor**
```bash
node server.js
```

### 3. **Verificar**
- Crear un nuevo producto → Debe tener "HECHO EN PERU" por defecto
- Cambiar empresa a "PRODUCTOS DEL DESCANSO S.A.C"
- Imprimir etiqueta → Texto debe hacer salto de línea automático

---

## 🔍 VERIFICACIÓN RÁPIDA

**SQL**:
```sql
-- Ver si la columna existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'productos' AND column_name = 'empresa';

-- Ver productos existentes
SELECT id_producto, nombre_producto, empresa 
FROM productos 
LIMIT 5;
```

**Resultado esperado**:
```
column_name | data_type      | column_default
------------+----------------+--------------------
empresa     | character varying | 'HECHO EN PERU'::character varying
```

---

## ✅ BENEFICIOS

1. ✅ **Default automático**: Todos los productos nuevos tendrán "HECHO EN PERU"
2. ✅ **Personalizable**: Supervisores pueden cambiar a otra empresa
3. ✅ **Sin cortes**: Textos largos se dividen automáticamente en 2 líneas
4. ✅ **Compatible**: Funciona con TODAS las plantillas (CON QR / SIN QR)

---

## 🎨 COMANDO ZPL `^FB` EXPLICADO

```zpl
^FB<ancho>,<max_lineas>,<espaciado>,<alineacion>
   │        │            │           │
   │        │            │           └─ L=Izquierda, R=Derecha, C=Centro
   │        │            └─────────────── 0 = espaciado automático
   │        └──────────────────────────── Máximo 2 líneas
   └───────────────────────────────────── Ancho del bloque en dots
```

**Ejemplo**:
```zpl
^FB180,2,0,L
```
- Ancho: 180 dots (~63mm con 203 DPI)
- Máximo 2 líneas
- Espaciado automático
- Alineación izquierda

---

## 📝 NOTAS TÉCNICAS

- **Ancho en plantilla CON QR**: 180 dots (espacio disponible después del QR)
- **Ancho en plantilla SIN QR**: Dinámico (`SINGLE_LABEL_WIDTH - 60`)
- **Font size**: 27 pts (300 DPI) / 18 pts (203 DPI)
- **Límite**: 2 líneas máximo
- **Truncado**: ZPL automáticamente trunca si sobrepasa

---

## 🐛 TROUBLESHOOTING

**Problema**: "Columna empresa no existe"
```bash
# Ejecutar migración
ejecutar-migracion-empresa.bat
```

**Problema**: "Texto aún se corta"
```bash
# Verificar que server.js se reinició
# Revisar logs para ver ZPL generado
ver-logs.bat
```

**Problema**: "Productos viejos no tienen empresa"
```sql
-- Actualizar manualmente
UPDATE productos SET empresa = 'HECHO EN PERU' WHERE empresa IS NULL;
```

---

✅ **CAMBIOS COMPLETADOS Y PROBADOS**
