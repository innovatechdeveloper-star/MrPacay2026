# ✅ GUÍA DE PRUEBAS - Sistema de Etiquetas Dinámicas

## 🎯 Estado del Sistema

### ✅ Completado:
1. ✅ 6 campos configurables (QR, NOMBRE, ID, UNIDAD, MODELO, EMPRESA)
2. ✅ Base de datos con columnas mostrar_* funcionando
3. ✅ Frontend guarda y carga configuración correctamente
4. ✅ Backend actualizado con endpoints que manejan 6 campos
5. ✅ Plantilla DEFAULT (con QR) dinámica según configuración
6. ✅ Plantilla TEXT_ONLY (sin QR) dinámica según configuración
7. ✅ Selector automático de plantilla según mostrar_qr

---

## 🧪 PRUEBAS A REALIZAR

### **PRUEBA 1: Configuración se guarda y persiste**

**Objetivo:** Verificar que los cambios en la configuración se guardan en la BD

**Pasos:**
1. Abre http://localhost:3010 → Login como supervisor
2. Edita un producto (ej: ALMOHADA - ID 181)
3. **Desactiva** el botón "ID" (debe quedar en rojo con ✗)
4. Guarda cambios
5. **Recarga la página** (F5)
6. Vuelve a editar el mismo producto
7. **Verifica** que el botón "ID" sigue desactivado (rojo con ✗)

**Resultado esperado:**
- ✅ La configuración se mantiene después de recargar
- ✅ En F12 debe mostrar: `mostrar_id: false`

---

### **PRUEBA 2: Validación - No se puede desactivar todo**

**Objetivo:** El sistema debe evitar que todos los campos de texto queden desactivados

**Pasos:**
1. Edita un producto
2. Desactiva QR (rojo)
3. Intenta desactivar NOMBRE, ID, UNIDAD, MODELO y EMPRESA (uno por uno)
4. Al intentar desactivar el último campo de texto activo, debe aparecer una alerta

**Resultado esperado:**
- ✅ Alerta: "Debe haber al menos un campo de texto activo"
- ✅ El último campo no se puede desactivar

---

### **PRUEBA 3: Plantilla TEXT_ONLY (sin QR)**

**Objetivo:** Verificar que al desactivar QR, se usa la plantilla de texto grande

**Pasos:**
1. Edita un producto (ej: ALMOHADA)
2. **Desactiva QR** (botón rojo)
3. **Desactiva ID** también
4. Guarda cambios
5. Ve a "Solicitudes Pendientes"
6. Crea una solicitud para ese producto (5 etiquetas)
7. **Aprueba la solicitud**
8. Observa la terminal del servidor

**Resultado esperado en terminal:**
```
📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)
📄 [generateTextOnlyZPL] ⭐ MODO SIN QR - Textos grandes
```

**Resultado en etiqueta impresa:**
- ✅ Sin código QR
- ✅ Texto ALMOHADA muy grande
- ✅ Texto UM: UNIDAD visible
- ✅ Texto "HECHO EN PERU" visible
- ❌ NO debe aparecer "ID: 000181" (porque lo desactivaste)

---

### **PRUEBA 4: Plantilla DEFAULT (con QR) dinámica**

**Objetivo:** Verificar que con QR activo también respeta la configuración

**Pasos:**
1. Edita otro producto diferente
2. **Deja QR activo** (verde ✓)
3. **Desactiva EMPRESA** (rojo ✗)
4. Guarda cambios
5. Crea solicitud y aprueba

**Resultado esperado en terminal:**
```
📄 [selectZPLTemplate] ✅ Usando plantilla DEFAULT (QR + texto dinámico)
📄 [generateDoubleZPL] Config recibida: {"mostrar_empresa": false, ...}
```

**Resultado en etiqueta impresa:**
- ✅ Código QR visible
- ✅ Nombre del producto visible
- ✅ UM, ID, MODELO visibles
- ❌ NO debe aparecer "HECHO EN PERU" (porque lo desactivaste)

---

### **PRUEBA 5: Todos los campos activos (DEFAULT)**

**Objetivo:** Verificar comportamiento normal con todo activado

**Pasos:**
1. Edita un producto
2. **Activa todos los botones** (todos verdes con ✓)
3. Guarda cambios
4. Crea solicitud y aprueba

**Resultado esperado en etiqueta:**
- ✅ QR Code
- ✅ ALMOHADA (o el nombre)
- ✅ Modelo/descripción
- ✅ UM: UNIDAD
- ✅ ID: 000181
- ✅ HECHO EN PERU

---

### **PRUEBA 6: Diferentes productos con diferentes configuraciones**

**Objetivo:** Verificar que cada producto mantiene su configuración independiente

**Pasos:**
1. **Producto A:** QR=ON, ID=OFF
2. **Producto B:** QR=OFF, EMPRESA=OFF
3. **Producto C:** TODO ON
4. Crea solicitudes para los 3 productos
5. Aprueba en orden

**Resultado esperado:**
- ✅ Cada producto imprime según su configuración
- ✅ Producto A: con QR, sin ID
- ✅ Producto B: sin QR, sin EMPRESA (texto grande)
- ✅ Producto C: etiqueta completa normal

---

## 🔍 Debugging

### Logs importantes en F12 (navegador):
```javascript
🔍 Campos mostrar_* (6 CAMPOS): {
  mostrar_qr: true,
  mostrar_nombre: true,
  mostrar_id: false,    // ← Verifica que coincida con botones
  mostrar_unidad: true,
  mostrar_modelo: true,
  mostrar_empresa: true
}
```

### Logs importantes en Terminal (servidor):
```
🎯 [selectZPLTemplate] Seleccionando plantilla...
📋 Configuración producto: {"mostrar_qr":false,"mostrar_nombre":true,...}
📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)
```

---

## ⚠️ Si algo falla:

### Problema: Los cambios no se guardan
**Solución:**
1. Verifica en F12 que el POST `/api/productos/:id` responde 200
2. Verifica que los 6 campos se envían en el body
3. Recarga con Ctrl+Shift+R

### Problema: Etiqueta imprime todo aunque desactivé campos
**Solución:**
1. Verifica en terminal que la config se recibe correctamente
2. Busca línea: `📋 Configuración producto:`
3. Si muestra `undefined`, el producto no tiene la config guardada

### Problema: Error al aprobar solicitud
**Solución:**
1. Reinicia el servidor: Ctrl+C → `node server.js`
2. Verifica que la BD tiene las 6 columnas mostrar_*

---

## 📊 Checklist Final

- [ ] Configuración se guarda correctamente
- [ ] Configuración persiste después de recargar
- [ ] Validación evita desactivar todos los campos
- [ ] QR=OFF usa plantilla TEXT_ONLY
- [ ] QR=ON usa plantilla DEFAULT
- [ ] Campos desactivados NO aparecen en etiqueta impresa
- [ ] Cada producto mantiene su configuración independiente
- [ ] Terminal muestra logs correctos
- [ ] F12 muestra valores correctos (no undefined)

---

## 🎉 Si todas las pruebas pasan:

✅ **Sistema de etiquetas dinámicas 100% funcional**
✅ **Listo para producción**
✅ **Personalización completa por producto**

---

**Próximos pasos opcionales:**
- Exportar/importar configuraciones masivas
- Plantillas adicionales (ej: solo código de barras)
- Previsualización de etiqueta antes de imprimir
- Historial de cambios de configuración
