# 🔥 GUÍA DE PRUEBAS - MODO TEXTO SOLO (SIN QR)

## 📋 Objetivo
Verificar que la plantilla TEXT_ONLY funciona correctamente con letras grandes cuando se desactiva el QR.

---

## ⚠️ REGLAS DEL SISTEMA

### 🚫 PROHIBIDO: QR Solo
- ❌ **NO se puede tener SOLO el QR activo** sin ningún texto
- El QR es cuadrado y necesita texto al lado para aprovechar el espacio
- Si intentas activar solo QR, el sistema muestra error

### ✅ PERMITIDO: Texto Solo
- ✅ **SÍ se puede tener SOLO texto** sin QR
- Activa la plantilla TEXT_ONLY con letras **GIGANTES**
- Ideal para productos que ya tienen código de barras propio

### ✅ PERMITIDO: QR + Texto
- ✅ Plantilla DEFAULT normal con QR y texto al lado

---

## 🧪 PRUEBA 1: Modo TEXTO SOLO básico

### Paso 1: Preparar producto
1. Abre el dashboard de supervisor
2. Edita un producto (ej: "CUELLERA" ID 182)
3. Estado inicial: **TODOS activos** (verde ✓)

### Paso 2: Desactivar QR
1. Haz clic en el botón "📱 QR"
2. Debe cambiar a **ROJO con ✗**
3. Consola debe mostrar: `✅ QR desactivado → Modo TEXTO GRANDE activado`
4. **NO debe aparecer ninguna alerta de error**

### Paso 3: Configurar campos visibles
Deja activos (verde ✓):
- ✅ NOMBRE
- ✅ MODELO  
- ✅ UNIDAD
- ❌ ID (desactiva este)
- ❌ EMPRESA (desactiva este)

### Paso 4: Guardar y verificar
1. Guarda cambios
2. Recarga página (F5)
3. Vuelve a editar el producto
4. **Verifica** que QR sigue desactivado (rojo ✗)

### Paso 5: Imprimir etiqueta
1. Ve a "Mis Solicitudes" en el menú
2. Crea solicitud para ese producto (3 etiquetas = 6 pares)
3. Envía solicitud
4. Ve al dashboard de supervisor
5. Aprueba la solicitud

### Resultado esperado en TERMINAL:
```
🎯 [selectZPLTemplate] Seleccionando plantilla...
📋 Configuración producto: {
  "mostrar_qr": false,      ⬅️ QR DESACTIVADO
  "mostrar_nombre": true,
  "mostrar_id": false,
  "mostrar_unidad": true,
  "mostrar_modelo": true,
  "mostrar_empresa": false
}
📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)
📄 [generateTextOnlyZPL] ⭐ MODO SIN QR - Textos grandes para ZD230
```

### Resultado esperado en ETIQUETA IMPRESA:
```
┌─────────────────────────┐
│                         │
│   CUELLERA              │  ⬅️ LETRAS GIGANTES (40pts)
│                         │
│   [MODELO si existe]    │  ⬅️ Letras grandes (32pts)
│                         │
│   UM: UNIDAD            │  ⬅️ Visible
│                         │
│   (Sin ID)              │  ⬅️ NO aparece porque lo desactivaste
│   (Sin HECHO EN PERU)   │  ⬅️ NO aparece porque lo desactivaste
│                         │
└─────────────────────────┘

❌ SIN CÓDIGO QR
✅ TEXTO OCUPANDO TODO EL ESPACIO
```

---

## 🧪 PRUEBA 2: Validación QR solo (debe fallar)

### Objetivo: Confirmar que NO se puede tener solo QR

### Paso 1: Preparar escenario
1. Edita un producto
2. Estado inicial: TODOS activos

### Paso 2: Intentar dejar solo QR
1. Desactiva NOMBRE → OK
2. Desactiva MODELO → OK  
3. Desactiva UNIDAD → OK
4. Desactiva ID → OK
5. Intenta desactivar EMPRESA (el último texto)

### Resultado esperado:
```
⚠️ El QR debe ir acompañado de texto. 
   Desactiva el QR primero para modo TEXTO SOLO
```

❌ **NO debe permitir desactivar el último campo de texto si QR está activo**

---

## 🧪 PRUEBA 3: Texto solo mínimo (1 campo)

### Objetivo: Verificar que funciona con solo UN campo de texto

### Paso 1: Configurar
1. Edita producto "HUESO" (ID 183)
2. Desactiva QR (rojo ✗)
3. Desactiva MODELO
4. Desactiva ID
5. Desactiva UNIDAD
6. Desactiva EMPRESA
7. **Deja solo NOMBRE activo** (verde ✓)

### Paso 2: Guardar e imprimir
1. Guarda cambios
2. Crea solicitud (2 etiquetas)
3. Aprueba

### Resultado esperado en TERMINAL:
```
📋 Configuración producto: {
  "mostrar_qr": false,
  "mostrar_nombre": true,     ⬅️ SOLO NOMBRE
  "mostrar_id": false,
  "mostrar_unidad": false,
  "mostrar_modelo": false,
  "mostrar_empresa": false
}
📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)
```

### Resultado en ETIQUETA:
```
┌─────────────────────────┐
│                         │
│                         │
│   HUESO                 │  ⬅️ SÚPER GIGANTE (60pts)
│                         │
│                         │
│   (nada más)            │
│                         │
│                         │
└─────────────────────────┘

✅ SOLO el nombre en letras ENORMES
```

---

## 🧪 PRUEBA 4: Intentar desactivar TODO (debe fallar)

### Objetivo: Sistema NO permite etiqueta completamente vacía

### Paso 1:
1. Edita producto
2. Desactiva QR
3. Intenta desactivar NOMBRE, MODELO, UNIDAD, ID, EMPRESA

### Paso 2: Al intentar desactivar el último texto
```
⚠️ Debe haber al menos un campo de texto activo
```

❌ **NO debe permitir desactivar el último campo**

---

## 🧪 PRUEBA 5: Cambiar entre modos

### Objetivo: Verificar transición QR ↔ TEXTO SOLO

### Escenario A: QR → TEXTO SOLO
1. Producto con QR activo + NOMBRE + UNIDAD
2. Desactiva QR
3. Guarda → Imprime
4. **Verifica:** Plantilla TEXT_ONLY

### Escenario B: TEXTO SOLO → QR
1. Mismo producto en modo TEXTO SOLO
2. Activa QR de nuevo
3. Guarda → Imprime
4. **Verifica:** Plantilla DEFAULT (QR pequeño + texto al lado)

---

## 🧪 PRUEBA 6: Diferentes combinaciones de texto

### Configuraciones válidas en modo TEXTO SOLO:

| Configuración | NOMBRE | MODELO | UNIDAD | ID | EMPRESA | ✅/❌ |
|---------------|--------|--------|--------|----|---------| -----|
| Solo Nombre | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Nombre + Unidad | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Nombre + Modelo + Unidad | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Todos menos ID | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Todos los textos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NADA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ PROHIBIDO |

---

## 📊 Checklist de Validación

### Frontend (F12 Console):
- [ ] Al desactivar QR muestra: `✅ QR desactivado → Modo TEXTO GRANDE`
- [ ] No permite QR solo: `⚠️ No puedes activar solo el QR`
- [ ] No permite desactivar todos los textos con QR activo
- [ ] No permite desactivar el último texto en modo TEXTO SOLO

### Backend (Terminal):
- [ ] Muestra: `📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)`
- [ ] Muestra: `📄 [generateTextOnlyZPL] ⭐ MODO SIN QR - Textos grandes`
- [ ] Config muestra `"mostrar_qr": false`

### Etiqueta Física:
- [ ] NO tiene código QR
- [ ] Texto es VISIBLEMENTE más grande que modo normal
- [ ] Solo aparecen los campos activados
- [ ] Texto está alineado correctamente
- [ ] Se imprimieron 2 etiquetas por hoja (duplicado)

---

## 🎯 Casos de Uso Reales

### 1. Producto con código de barras propio
**Escenario:** Almohadas importadas que ya traen código de barras del fabricante
**Config:** QR=OFF, NOMBRE=ON, MODELO=ON, UNIDAD=ON
**Resultado:** Etiqueta con texto grande, fácil de leer desde lejos

### 2. Producto de tamaño grande
**Escenario:** Edredones king size que se ven desde lejos
**Config:** QR=OFF, NOMBRE=ON, MODELO=ON
**Resultado:** Nombre gigante visible a 3 metros de distancia

### 3. Etiqueta temporal para inventario
**Escenario:** Productos en proceso que solo necesitan identificación rápida
**Config:** QR=OFF, NOMBRE=ON
**Resultado:** Solo el nombre en letras enormes

---

## 🐛 Problemas Comunes

### ❌ Problema: El texto no se ve más grande
**Causa:** El servidor no reinició después de los cambios
**Solución:** 
```cmd
taskkill /F /IM node.exe
node server.js
```

### ❌ Problema: Sigue imprimiendo QR aunque lo desactivé
**Causa:** Configuración no se guardó en BD
**Solución:** 
1. Verifica en F12: `mostrar_qr: false`
2. Si muestra `undefined`, recarga página
3. Si persiste, ejecuta SQL: `SELECT mostrar_qr FROM productos WHERE id_producto = X;`

### ❌ Problema: Me deja activar solo QR
**Causa:** Frontend no se actualizó
**Solución:** 
1. Recarga con Ctrl+Shift+R
2. Limpia caché del navegador

---

## 🚀 Siguiente Paso

Una vez que todas las pruebas pasen, el sistema estará **100% listo** para:
- ✅ Etiquetas personalizadas por producto
- ✅ Dos modos de impresión (QR + texto / Solo texto)
- ✅ Validación robusta que previene errores
- ✅ Producción estable

**¿Listo para comenzar? ¡Arranca con la PRUEBA 1!** 🎯
