# 📘 GUÍA DE USO - SISTEMA DE ETIQUETAS ZEBRA

## 🎯 ¿Qué es este sistema?

Sistema completo de gestión de etiquetas QR para productos textiles que imprime en dos impresoras:
- **Zebra ZD230 (203 DPI)**: Etiquetas pequeñas dobles (5cm × 2.5cm)
- **Godex G530 (300 DPI)**: Rotulados grandes (3cm × 5cm)

---

## 🌐 ACCESO AL SISTEMA

### URLs de acceso:
- **Dashboard Costurera**: `http://localhost:3012/costurera-dashboard.html`
- **Dashboard Supervisor**: `http://localhost:3012/supervisor-dashboard.html`

### Credenciales por defecto:
| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Costurera | costurera | alsimtex |
| Supervisor | supervisor | alsimtex |

---

## 👥 ROLES Y FUNCIONES

### 🪡 COSTURERA (Operador de producción)
**Permisos:**
- ✅ Ver productos
- ✅ Crear solicitudes de etiquetas
- ✅ Crear solicitudes de rotulado
- ✅ Ver historial de sus propias solicitudes
- ❌ Aprobar/rechazar solicitudes
- ❌ Imprimir directamente

**Flujo de trabajo:**
1. Busca el producto en el sistema
2. Crea solicitud de etiquetas (indica cantidad)
3. Espera aprobación del supervisor
4. Una vez aprobada, se imprime automáticamente

### 👔 SUPERVISOR (Control de calidad)
**Permisos:**
- ✅ Ver todos los productos
- ✅ Crear solicitudes (como costurera)
- ✅ Aprobar/Rechazar solicitudes
- ✅ Ver historial completo
- ✅ Imprimir manualmente
- ✅ Gestionar cola de impresión

**Flujo de trabajo:**
1. Recibe notificación de nuevas solicitudes
2. Revisa los datos del producto
3. Aprueba o rechaza con observaciones
4. Si aprueba, se imprime automáticamente

---

## 📦 GESTIÓN DE PRODUCTOS

### ¿Cómo se registran productos?

Los productos se registran directamente en la base de datos PostgreSQL. No hay interfaz web para esto (se puede agregar en el futuro).

**Campos principales:**
- `id`: ID único del producto (ej: 425)
- `nombre`: Nombre del producto (ej: "ALMOHADA RIZADA")
- `modelo`: Modelo o tipo (ej: "QUEEN", "2 PLAZAS")
- `unidad_medida`: Unidad (ej: "UNIDAD", "DOCENA", "PAR")
- `precio`: Precio unitario
- `descripcion`: Descripción extendida

### Búsqueda de productos

En ambos dashboards hay un buscador que busca por:
- ✅ Nombre del producto
- ✅ ID del producto
- ✅ Descripción

**Ejemplo:**
- Buscar "almohada" muestra todos los productos con esa palabra
- Buscar "425" muestra el producto con ID 425

---

## 🏷️ ETIQUETAS ZEBRA (5cm × 2.5cm)

### Características:
- **Formato**: Etiqueta doble (izquierda y derecha iguales)
- **Contenido**:
  - QR Code (máximo 2.4cm)
  - Nombre del producto (hasta 2 líneas)
  - Modelo/Tipo
  - Unidad de medida
  - ID del producto
  - Empresa ("HECHO EN PERU" por defecto)

### ¿Cómo crear una solicitud de etiquetas?

1. **Buscar producto**: Escribe en el buscador
2. **Hacer clic en "Solicitar Etiquetas"**
3. **Completar formulario**:
   - Cantidad de etiquetas (múltiplo de 2)
   - Observaciones (opcional)
4. **Enviar solicitud**
5. **Esperar aprobación** (costurera) o **Aprobar inmediatamente** (supervisor)

### Impresión automática:
- Al aprobar, se envía automáticamente a la **Zebra ZD230**
- IP: 192.168.1.34:9100
- Se muestra animación de impresión (supervisor)
- Cantidad se redondea a número par (2, 4, 6, 8...)

---

## 🎨 ROTULADO GODEX (3cm × 5cm)

### Características:
- **Formato**: Etiqueta vertical con logo
- **Contenido configurable**:
  - Logo principal arriba (6 opciones)
  - Logo secundario Misti (opcional)
  - Nombre del producto
  - Tamaño/Modelo
  - Iconos de advertencia (lavado, planchado, etc.)
  - QR Code

### Opciones de logo principal:
1. **Logo Camitex** (logo de empresa)
2. **100% Algodón** (textil)
3. **Máxima Suavidad** ⭐ (PREDETERMINADO)
4. **Producto Peruano** (bandera)
5. **Producto Arequipeño** (volcán Misti)
6. **Sin Logo**

### Configuración por defecto:
- ✅ Logo: Máxima Suavidad
- ✅ Logo secundario: Sin Logo
- ✅ Iconos: Con Iconos

### ¿Cómo crear una solicitud de rotulado?

1. **Buscar producto**
2. **Hacer clic en "Solicitar Rotulado"**
3. **Configurar rotulado**:
   - Logo principal arriba (predeterminado: Máxima Suavidad)
   - Logo secundario Misti (predeterminado: Sin Logo)
   - Iconos de advertencia (predeterminado: Con Iconos)
   - Cantidad
   - Observaciones
4. **Visualizar preview** (botón 👁️)
5. **Enviar solicitud**
6. **Esperar aprobación**

### Impresión automática:
- Al aprobar, se envía a **Godex G530**
- IP: 192.168.1.35:9100
- Incluye corte automático de etiquetas

---

## 🔄 AUTOMATIZACIÓN

### Impresión automática al aprobar:
- ✅ Costurera crea solicitud → Supervisor aprueba → Imprime automáticamente
- ✅ Supervisor crea solicitud → Aprueba directamente → Imprime inmediatamente

### Redondeo automático de cantidad:
- Etiquetas Zebra: Se redondean a número par
  - Solicitas 5 → Imprime 6
  - Solicitas 7 → Imprime 8

### Generación automática de QR:
- Cada solicitud genera un código QR único
- Formato: `SOL-{número_solicitud}` (ej: SOL-000123)
- El QR contiene: código, nombre producto, unidad de medida

### Estados automáticos:
| Estado | Significado | Acción siguiente |
|--------|-------------|------------------|
| `pendiente` | Esperando aprobación | Supervisor debe aprobar/rechazar |
| `proceso` | Aprobada, imprimiendo | Se está imprimiendo |
| `completada` | Impresa exitosamente | Historial |
| `rechazada` | Rechazada por supervisor | Revisar observaciones |

---

## 🖨️ CONFIGURACIÓN DE IMPRESORAS

### Zebra ZD230 (Etiquetas)
```
Modelo: ZD230-203dpi ZPL
IP: 192.168.1.34
Puerto: 9100
DPI: 203
Tamaño: 100mm × 150mm (rollo)
Etiqueta: 50mm × 25mm (doble)
```

### Godex G530 (Rotulados)
```
Modelo: G530 EZPL
IP: 192.168.1.35
Puerto: 9100
DPI: 300
Tamaño: 30mm × 50mm
Corte: Automático (guillotina)
```

### Verificación de conexión:
- En ambos dashboards hay indicadores en la tarjeta de bienvenida
- 🟢 Verde = Conectada
- 🔴 Rojo = Desconectada
- Se actualiza cada 30 segundos

### ¿Qué hacer si una impresora no conecta?
1. Verificar que esté encendida
2. Verificar cable de red
3. Hacer ping a la IP:
   - Zebra: `ping 192.168.1.34`
   - Godex: `ping 192.168.1.35`
4. Verificar que el puerto 9100 esté abierto
5. Revisar logs del servidor

---

## 📊 BASE DE DATOS

### PostgreSQL
```
Host: localhost
Puerto: 5432
Base de datos: postgres
Usuario: postgres
Contraseña: alsimtex
```

### Tablas principales:
- `productos`: Catálogo de productos
- `etiquetas_solicitudes`: Solicitudes de etiquetas Zebra
- `rotulado_solicitudes`: Solicitudes de rotulado Godex
- `usuarios`: Usuarios del sistema (costureras, supervisores)

### Respaldos:
Se recomienda hacer respaldo semanal de la base de datos:
```bash
pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### No se ve el sistema en el navegador
✅ Verificar que el servidor esté corriendo
✅ Abrir: `http://localhost:3012`
✅ Revisar en terminal si hay errores

### La impresora no imprime
✅ Verificar indicador de conexión (🟢/🔴)
✅ Hacer ping a la IP de la impresora
✅ Verificar que tenga papel/etiquetas
✅ Reiniciar la impresora

### No puedo aprobar solicitudes
✅ Verificar que estés logueado como SUPERVISOR
✅ La solicitud debe estar en estado "pendiente"
✅ Refrescar la página

### El QR no se escanea
✅ Verificar que el tamaño sea correcto (máximo 2.4cm)
✅ Asegurar que la impresora tenga buena densidad
✅ Limpiar cabezal de impresión

### Error al guardar solicitud
✅ Verificar conexión a base de datos
✅ Revisar logs del servidor
✅ Verificar que el producto exista

---

## 📱 ATAJOS Y TIPS

### Atajos de teclado:
- `Ctrl + F`: Buscar producto (en buscador)
- `Enter`: Buscar (después de escribir)
- `Esc`: Cerrar modales

### Consejos:
- 💡 Usa nombres cortos para productos (máximo 2 palabras largas)
- 💡 Si el nombre es muy largo, se divide automáticamente en 2 líneas
- 💡 Los rotulados con logos se ven mejor con nombres cortos
- 💡 Revisa el preview antes de aprobar rotulados
- 💡 Guarda las observaciones importantes en cada solicitud

---

## 📞 SOPORTE

Para problemas técnicos:
- Revisar logs en: `d:\mi-app-etiquetas\mi-app-etiquetas\logs\`
- Consultar documentación técnica en carpeta `documentation/`
- Contactar al administrador del sistema

---

## 📝 HISTORIAL DE CAMBIOS

**v2.5** (Noviembre 2025)
- ✅ Sistema de 4 líneas para nombres largos
- ✅ Nuevo logo "Producto Arequipeño"
- ✅ Configuración por defecto: Máxima Suavidad + Con Iconos
- ✅ Optimización de espaciado en etiquetas Zebra
- ✅ QR reducido a tamaño 5 (máximo 2.4cm)

---

## 🎓 ENTRENAMIENTO RECOMENDADO

### Para nuevas costureras:
1. Practicar búsqueda de productos (10 min)
2. Crear 3-5 solicitudes de prueba
3. Familiarizarse con el formulario de rotulado
4. Ver preview de diferentes configuraciones

### Para nuevos supervisores:
1. Todo lo anterior +
2. Aprobar/rechazar solicitudes de prueba
3. Verificar impresión física
4. Revisar historial y observaciones
5. Conocer indicadores de estado de impresoras

---

**Versión del documento**: 1.0  
**Última actualización**: 3 de noviembre de 2025  
**Sistema**: Mi-App-Etiquetas v2.5
