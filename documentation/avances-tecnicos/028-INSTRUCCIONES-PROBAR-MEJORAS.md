# 🚀 Instrucciones Rápidas - Probar Mejoras

## 📋 Cambios Implementados

### 1. ✅ CSS de Pestañas Mejorado
Las pestañas ahora se ven así:

```
┌──────────┬──────────┬──────────┬──────────┐
│    🌐    │    ⏳    │    🔄    │    ✅    │
│  Todas   │Pendientes│En Proceso│Completad.│
│    5     │    1     │    1     │    3     │
└──────────┴──────────┴──────────┴──────────┘
```

**Características**:
- Iconos grandes arriba
- Texto pequeño en medio
- Número grande abajo
- Colores rosa/magenta cuando está activo
- Animaciones suaves

---

### 2. ✅ Botones Toggle en Modal Editar Producto

**Ubicación**: Modal "Editar Producto" → Nueva sección "🏷️ Configuración de Etiqueta"

**Aspecto**:
```
┌─────────────────────────────────────────────┐
│ 🏷️ Configuración de Etiqueta              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────┐  ┌────────┐  ┌─────┐  ┌────────┐│
│  │  📱  │  │   📝   │  │ 🔢  │  │   📦   ││
│  │  QR  │  │ NOMBRE │  │ ID  │  │ UNIDAD ││
│  │   ✓  │  │   ✓    │  │  ✗  │  │   ✓    ││
│  └──────┘  └────────┘  └─────┘  └────────┘│
│   Activo     Activo   Inactivo   Activo   │
│                                             │
│  ┌────────┐                                │
│  │   🏭   │                                │
│  │ MODELO │                                │
│  │   ✓    │                                │
│  └────────┘                                │
│   Activo                                   │
└─────────────────────────────────────────────┘
```

**Comportamiento**:
- **Click en botón** → Se activa/desactiva
- **Activo**: Rosa/magenta, crece, ✓ verde
- **Inactivo**: Gris, se achica, ✗ roja
- **Animaciones**: Suaves y fluidas

---

## 🔧 Pasos para Probar

### Paso 1: Ejecutar Migración SQL (IMPORTANTE)

Antes de empezar, necesitas ejecutar la migración:

```sql
-- Abrir pgAdmin → Base de datos: mi_app_etiquetas → Query Tool

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS mostrar_qr BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_nombre BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_id BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mostrar_unidad BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_modelo BOOLEAN DEFAULT true;

-- Verificar:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'productos' 
  AND column_name LIKE 'mostrar_%';

-- Debe mostrar:
-- mostrar_qr      | boolean | true
-- mostrar_nombre  | boolean | true
-- mostrar_id      | boolean | false
-- mostrar_unidad  | boolean | true
-- mostrar_modelo  | boolean | true
```

---

### Paso 2: Reiniciar Servidor

```bash
cd D:\Informacion\DESARROLLO\mi-app-etiquetas\mi-app-etiquetas

# Si está corriendo, detenerlo: Ctrl+C

# Iniciar:
node server.js

# Esperar:
# ✅ Servidor corriendo en https://localhost:3010
# ✅ Base de datos PostgreSQL conectada
```

---

### Paso 3: Probar Dashboard Supervisor

#### A. Abrir Dashboard:
```
https://localhost:3010/supervisor-dashboard.html
```

#### B. Ver Pestañas Mejoradas:

**Antes** (feas):
```
[🌐 Todas (5)] [⏳ Pendientes (1)] [🔄 En Proceso (1)] [✅ Completadas (3)]
```

**Ahora** (bonitas):
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ 🌐  │ │ ⏳  │ │ 🔄  │ │ ✅  │
│Todas│ │Pend.│ │Proc.│ │Comp.│
│  5  │ │  1  │ │  1  │ │  3  │
└─────┘ └─────┘ └─────┘ └─────┘
```

#### C. Probar Filtros:
1. Click en cada pestaña
2. Verificar que filtra correctamente
3. Ver animaciones suaves

---

### Paso 4: Probar Modal de Editar Producto

#### A. Abrir Modal:
1. Ir a sección "Gestión de Productos"
2. Click en "🔍 Consultar Productos"
3. Click en botón "✏️ Editar" de cualquier producto

#### B. Verificar Botones Toggle:

**Deberías ver**:
- 5 botones: QR, NOMBRE, ID, UNIDAD, MODELO
- QR, NOMBRE, UNIDAD, MODELO → ✓ Activos (rosa)
- ID → ✗ Inactivo (gris)

#### C. Probar Interacción:

1. **Click en "QR"** (activo):
   - ✅ Se desactiva
   - ✅ Se pone gris
   - ✅ Se achica
   - ✅ ✓ cambia a ✗
   - ✅ Consola muestra: `Campo "qr" ✗ DESACTIVADO`

2. **Click en "ID"** (inactivo):
   - ✅ Se activa
   - ✅ Se pone rosa/magenta
   - ✅ Crece
   - ✅ ✗ cambia a ✓
   - ✅ Consola muestra: `Campo "id" ✓ ACTIVADO`

3. **Probar todos los botones**

#### D. Guardar Cambios:

1. Activar/desactivar algunos campos
2. Click en "💾 Guardar Cambios"
3. Verificar mensaje: "✅ Producto actualizado exitosamente"
4. Abrir el modal de nuevo
5. **Verificar que los cambios se guardaron** (campos activos/inactivos según lo guardado)

#### E. Verificar en Base de Datos:

```sql
SELECT 
    id_producto,
    nombre_producto,
    mostrar_qr,
    mostrar_nombre,
    mostrar_id,
    mostrar_unidad,
    mostrar_modelo
FROM productos
WHERE id_producto = 208; -- O el ID que editaste

-- Debería mostrar los valores que configuraste
```

---

## 🔍 Qué Buscar

### ✅ Señales de Éxito:

#### Pestañas:
- ✅ Se ven con diseño vertical (icono arriba, texto, número)
- ✅ Tienen fondo blanco/rosa
- ✅ Activa tiene gradiente rosa/magenta
- ✅ Hover tiene animación suave
- ✅ Click cambia filtro instantáneamente

#### Botones Toggle:
- ✅ Responden al click
- ✅ Animación suave al activar/desactivar
- ✅ Colores cambian correctamente
- ✅ Check/X se actualiza
- ✅ Consola muestra logs
- ✅ Cambios se guardan en BD
- ✅ Cambios persisten al reabrir modal

#### Consola del Navegador (F12):
```
✅ Configuración de etiqueta cargada: { qr: true, nombre: true, id: false, unidad: true, modelo: true }
Campo "qr" ✗ DESACTIVADO
Campo "id" ✓ ACTIVADO
📋 Enviando datos del producto: { nombre_producto: "...", mostrar_qr: false, mostrar_id: true, ... }
```

#### Consola del Servidor:
```
📝 Producto 208 actualizado: {
  id_producto: 208,
  nombre_producto: 'SABANA BP 1.5P ESPECIAL 30CM',
  mostrar_qr: false,
  mostrar_nombre: true,
  mostrar_id: true,
  mostrar_unidad: true,
  mostrar_modelo: true
}
```

---

## ❌ Problemas Comunes

### Problema 1: Botones no responden al click

**Causa**: Función `toggleLabelFieldBtn` no encontrada

**Solución**: 
- Hard reload: Ctrl + Shift + R
- O abrir en ventana incógnito

---

### Problema 2: Error al guardar producto

**Mensaje**: `error: column "mostrar_qr" does not exist`

**Causa**: No ejecutaste la migración SQL

**Solución**:
```sql
-- En pgAdmin:
ALTER TABLE productos 
ADD COLUMN mostrar_qr BOOLEAN DEFAULT true,
ADD COLUMN mostrar_nombre BOOLEAN DEFAULT true,
ADD COLUMN mostrar_id BOOLEAN DEFAULT false,
ADD COLUMN mostrar_unidad BOOLEAN DEFAULT true,
ADD COLUMN mostrar_modelo BOOLEAN DEFAULT true;
```

---

### Problema 3: Botones se ven feos/mal alineados

**Causa**: Caché del navegador

**Solución**:
1. Ctrl + Shift + R (hard reload)
2. O borrar caché del navegador
3. O abrir en incógnito

---

### Problema 4: Pestañas se ven feas (imagen que enviaste)

**Causa**: CSS antiguo cacheado

**Solución**:
1. Ctrl + Shift + R
2. Verificar que el archivo supervisor-dashboard.html se actualizó
3. Ver en inspector (F12) que los estilos `.solicitudes-tabs` y `.tab-btn` tienen los nuevos valores

---

## 📊 Resultado Esperado

### Pestañas ANTES:
```
┌────────────────────────────────────────────────────┐
│ [Todas (8)] [Pendientes (1)] [Proceso (1)] ...    │
└────────────────────────────────────────────────────┘
```
❌ Se veían como texto plano en línea

### Pestañas AHORA:
```
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│  🌐  │  │  ⏳  │  │  🔄  │  │  ✅  │
│Todas │  │Pend. │  │Proc. │  │Compl.│
│   8  │  │   1  │  │   1  │  │   6  │
└──────┘  └──────┘  └──────┘  └──────┘
```
✅ Diseño vertical limpio con animaciones

### Modal ANTES:
```
┌─────────────────────────┐
│ Nombre: [...]           │
│ Marca: [...]            │
│ Modelo: [...]           │
│ Estado: [Activo ▼]      │
│                         │
│ [Cancelar] [Guardar]    │
└─────────────────────────┘
```
❌ Sin configuración de etiquetas

### Modal AHORA:
```
┌───────────────────────────────────────┐
│ Nombre: [...]                         │
│ Marca: [...]                          │
│ Modelo: [...]                         │
│ Estado: [Activo ▼]                    │
│                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                       │
│ 🏷️ Configuración de Etiqueta        │
│                                       │
│  [📱 QR ✓] [📝 NOMBRE ✓] [🔢 ID ✗]  │
│  [📦 UNIDAD ✓] [🏭 MODELO ✓]        │
│                                       │
│ [Cancelar]          [💾 Guardar]     │
└───────────────────────────────────────┘
```
✅ Con botones toggle interactivos

---

## 🎯 Próximo Paso (Futuro)

Una vez que todo funcione correctamente, el siguiente paso será:

**Generar formatos ZPL personalizados** según la configuración:

```javascript
// Si mostrar_qr = false:
// → ZPL sin código QR, texto grande en todo el espacio

// Si mostrar_id = false:
// → ZPL sin ID, más espacio para nombre

// Etc.
```

Pero eso es para después. Por ahora, enfócate en que los botones funcionen correctamente.

---

**Última actualización**: 15 de octubre de 2025 - 21:30  
**Estado**: ✅ Listo para probar
