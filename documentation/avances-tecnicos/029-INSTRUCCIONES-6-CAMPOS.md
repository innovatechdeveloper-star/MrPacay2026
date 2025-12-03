# 🚀 PASOS PARA COMPLETAR LA INTEGRACIÓN DE 6 CAMPOS

## ✅ Cambios Realizados en el Código:

### 1. **Backend (server.js)**
- ✅ GET `/api/productos/:id` ahora incluye `mostrar_empresa`
- ✅ PUT `/api/productos/:id` ahora guarda `mostrar_empresa`
- ✅ Default cambiado: `mostrar_id = true` (antes era false)

### 2. **Frontend (supervisor-dashboard.html)**
- ✅ Agregado botón "EMPRESA" (🏢 HECHO EN PERU)
- ✅ Agregado hidden input `edit-product-mostrar-empresa`
- ✅ Actualizado array de campos: 6 campos en total
- ✅ Validación incluye el campo empresa
- ✅ Formulario envía el campo empresa al backend

### 3. **SQL Migrations**
- ✅ MIGRAR-AHORA.sql actualizado con mostrar_empresa
- ✅ ACTUALIZAR-PRODUCTOS-EXISTENTES.sql actualizado
- ✅ Creado AGREGAR-MOSTRAR-EMPRESA.sql

---

## 📋 LOS 6 CAMPOS DE LA ETIQUETA:

1. **QR Code** → `mostrar_qr` (DEFAULT: true)
2. **Nombre del Producto** → `mostrar_nombre` (DEFAULT: true)
3. **ID del Producto** → `mostrar_id` (DEFAULT: true) ⚠️ CAMBIÓ
4. **Unidad de Medida** → `mostrar_unidad` (DEFAULT: true)
5. **Modelo/Descripción** → `mostrar_modelo` (DEFAULT: true)
6. **Texto Empresa** → `mostrar_empresa` (DEFAULT: true) 🆕

---

## 🔧 ACCIÓN REQUERIDA:

### Paso 1: Ejecutar SQL en pgAdmin

1. **Abre pgAdmin**
2. **Conéctate a:** PostgreSQL 18 → Databases → **postgres**
3. **Clic derecho en `postgres`** → Query Tool
4. **Ejecuta este SQL:**

```sql
-- Agregar la columna mostrar_empresa
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS mostrar_empresa BOOLEAN DEFAULT true;

-- Actualizar TODOS los productos con los valores por defecto
UPDATE public.productos
SET 
    mostrar_qr = COALESCE(mostrar_qr, true),
    mostrar_nombre = COALESCE(mostrar_nombre, true),
    mostrar_id = COALESCE(mostrar_id, true),          -- ⚠️ Ahora TRUE
    mostrar_unidad = COALESCE(mostrar_unidad, true),
    mostrar_modelo = COALESCE(mostrar_modelo, true),
    mostrar_empresa = COALESCE(mostrar_empresa, true) -- 🆕 NUEVO
WHERE 
    mostrar_qr IS NULL 
    OR mostrar_nombre IS NULL 
    OR mostrar_id IS NULL 
    OR mostrar_unidad IS NULL 
    OR mostrar_modelo IS NULL
    OR mostrar_empresa IS NULL;

-- Verificar que todo está bien (debe mostrar 212 productos)
SELECT 
    COUNT(*) as total_productos,
    SUM(CASE WHEN mostrar_qr = true THEN 1 ELSE 0 END) as con_qr,
    SUM(CASE WHEN mostrar_nombre = true THEN 1 ELSE 0 END) as con_nombre,
    SUM(CASE WHEN mostrar_id = true THEN 1 ELSE 0 END) as con_id,
    SUM(CASE WHEN mostrar_unidad = true THEN 1 ELSE 0 END) as con_unidad,
    SUM(CASE WHEN mostrar_modelo = true THEN 1 ELSE 0 END) as con_modelo,
    SUM(CASE WHEN mostrar_empresa = true THEN 1 ELSE 0 END) as con_empresa
FROM public.productos;
```

**Resultado esperado:**
```
total_productos | con_qr | con_nombre | con_id | con_unidad | con_modelo | con_empresa
----------------|--------|------------|--------|------------|------------|-------------
     212        |  212   |    212     |  212   |    212     |    212     |     212
```

---

### Paso 2: Reiniciar el Servidor

En la terminal de VS Code:
- Detén el servidor (Ctrl+C si está corriendo)
- Vuelve a ejecutar: `node server.js`

---

### Paso 3: Recargar el Navegador

- **Ctrl + Shift + R** (recarga completa sin caché)

---

### Paso 4: Verificar en F12

Abre cualquier producto y verifica en la consola:

**ANTES (❌ MAL):**
```
🔍 Campos mostrar_*: {mostrar_qr: undefined, mostrar_nombre: undefined, ...}
```

**DESPUÉS (✅ BIEN):**
```
🔍 Campos mostrar_*: {
  mostrar_qr: true, 
  mostrar_nombre: true, 
  mostrar_id: true, 
  mostrar_unidad: true, 
  mostrar_modelo: true,
  mostrar_empresa: true
}
```

---

## 🎨 Interfaz Actualizada:

Ahora verás **6 botones** en la configuración de etiquetas:

1. 📱 **QR** - Código QR
2. 📝 **NOMBRE** - Nombre del producto
3. 🔢 **ID** - Código único
4. 📦 **UNIDAD** - Unidad de medida
5. 🏭 **MODELO** - Modelo/variante
6. 🏢 **EMPRESA** - "HECHO EN PERU" 🆕

---

## ✅ Verificación Final:

1. ✅ Editar producto → Ver 6 botones activos
2. ✅ Desactivar "EMPRESA" → Guardar
3. ✅ Re-editar producto → Verificar que "EMPRESA" sigue desactivado
4. ✅ Consola muestra: `mostrar_empresa: false`

---

## 🚨 IMPORTANTE:

- **TODOS los campos ahora tienen DEFAULT = true**
- **El ID ahora se imprime por defecto** (antes era false)
- **La columna mostrar_empresa es NUEVA** (requiere migration)

---

## 📁 Archivos Modificados:

1. ✅ `server.js` - Endpoints actualizados
2. ✅ `supervisor-dashboard.html` - UI y lógica actualizados
3. ✅ `MIGRAR-AHORA.sql` - Migration completa
4. ✅ `ACTUALIZAR-PRODUCTOS-EXISTENTES.sql` - Update de registros
5. ✅ `AGREGAR-MOSTRAR-EMPRESA.sql` - 🆕 Migration específica

---

**¡Ejecuta el SQL en pgAdmin y recarga el navegador!** 🚀
