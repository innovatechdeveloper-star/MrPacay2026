# IMPLEMENTACIÓN DE PRODUCTOS ESPECIALES PARA COSTURERAS

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad completa para que las costureras puedan crear solicitudes de productos especiales (JUEGOS/COMBOS) desde su dashboard.

---

## ✅ Componentes Implementados

### 1. Interfaz de Usuario (costurera-dashboard.html)

#### 🎯 Popup de Selección de Tipo
- **Modal interactivo** que se muestra al hacer clic en "Crear Nuevo Registro"
- **Dos opciones visuales:**
  - 📦 **Producto Normal**: Abre el formulario existente
  - ⭐ **Producto Especial**: Abre el nuevo formulario para JUEGOS/COMBOS

#### 📝 Formulario de Producto Especial
- **Campo de búsqueda** con datalist para productos especiales
- **Visualización automática** de componentes al seleccionar un producto
- **Campos configurables:**
  - Cantidad de juegos/combos
  - Prioridad (normal/alta/urgente)
  - Observaciones opcionales
- **Botón de retorno** al formulario normal

#### 🎨 Mejoras Visuales
- Degradados de color para distinguir tipos de producto
- Iconos descriptivos (📦 normal, ⭐ especial)
- Panel con lista de componentes del producto seleccionado
- Animaciones de hover en opciones del popup

---

### 2. Lógica JavaScript (costurera-dashboard.html)

#### Funciones Principales:

**`seleccionarTipoSolicitud(tipo)`**
- Cierra el popup de selección
- Activa la pestaña "Crear"
- Muestra/oculta formularios según tipo
- Carga productos especiales si es necesario

**`cargarProductosEspecialesDisponibles()`**
- Consulta API para obtener lista de productos especiales
- Llena el datalist con código y nombre
- Almacena en cache local

**`mostrarComponentesProductoEspecial(idProductoEspecial)`**
- Obtiene componentes del producto especial
- Muestra panel con lista detallada
- Incluye cantidades de cada componente

**`volverFormularioNormal()`**
- Vuelve al formulario de producto normal
- Limpia el formulario especial
- Oculta panel de componentes

**Manejador de Formulario Especial**
- Valida selección de producto especial
- Recopila datos del formulario
- Envía solicitud a API
- Maneja respuesta y feedback visual
- Auto-redirige a registros tras éxito

---

### 3. Backend (server.js)

#### 🆕 Nuevo Endpoint: `/api/crear-solicitud-especial`

**Flujo de Trabajo:**
1. **Valida** datos de entrada
2. **Obtiene** producto especial y componentes
3. **Crea una solicitud por componente**:
   - Calcula cantidad total (componente.cantidad × cantidad_juegos)
   - Genera número de solicitud único por componente
   - Agrupa con número base (ESP-timestamp)
4. **Registra en historial** cada solicitud
5. **Si auto_services activo:**
   - Envía todas las solicitudes a cola de impresión
   - Marca como completadas automáticamente
6. **Retorna** resumen con todas las solicitudes creadas

**Características:**
- ✅ Soporte para `auto_services` (aprobación automática)
- ✅ Múltiples solicitudes agrupadas
- ✅ Historial detallado por componente
- ✅ Integración con cola de impresión
- ✅ Manejo de errores robusto

---

### 4. Base de Datos

#### 📊 Migración: `add_producto_especial_columns.sql`

**Campos agregados a `solicitudes_etiquetas`:**

```sql
id_producto_especial INTEGER
  - Referencia al producto especial (FK)
  - Permite rastrear origen de la solicitud

numero_solicitud_grupo VARCHAR(50)
  - Agrupa solicitudes del mismo JUEGO/COMBO
  - Formato: ESP-timestamp
  - Facilita consultas grupales
```

**Índices creados:**
- `idx_solicitudes_producto_especial`: Búsqueda por producto especial
- `idx_solicitudes_grupo`: Búsqueda por grupo de solicitudes

---

## 🔄 Flujo Completo de Trabajo

### Escenario 1: Usuario Normal (auto_services = false)

1. Costurera hace clic en **"Crear Nuevo Registro"**
2. Se muestra **popup de selección**
3. Selecciona **"Producto Especial"**
4. Busca y selecciona un **JUEGO/COMBO**
5. Sistema muestra **componentes automáticamente**
6. Ingresa **cantidad de juegos** (ej: 5)
7. Configura **prioridad y observaciones**
8. Hace clic en **"Solicitar Etiquetas"**
9. Sistema crea **N solicitudes** (una por componente)
10. Solicitudes quedan en estado **"pendiente"**
11. Supervisor las aprueba manualmente

### Escenario 2: Usuario con auto_services = true

Pasos 1-8 igual que escenario 1

9. Sistema crea **N solicitudes** (una por componente)
10. Solicitudes se marcan como **"proceso"**
11. Automáticamente se **envían a impresión**
12. Tras impresión exitosa, se marcan como **"completada"**
13. Costurera ve confirmación inmediata

---

## 📦 Ejemplo Práctico

### Producto Especial: "Conjunto Deportivo"
- **Código**: COMBO-001
- **Componentes**:
  - Camiseta (x1)
  - Pantalón (x1)
  - Shorts (x1)

### Solicitud: 10 Conjuntos

**Resultado:**
```
Número Grupo: ESP-1736541234567

Solicitudes creadas:
1. ESP-1736541234567-C1: Camiseta x10
2. ESP-1736541234567-C2: Pantalón x10
3. ESP-1736541234567-C3: Shorts x10

Total etiquetas a imprimir: 60 (10×3×2)
```

---

## 🛠️ Instrucciones de Instalación

### Paso 1: Ejecutar Migración

```batch
cd d:\Informacion\DESARROLLO\mi-app-etiquetas\mi-app-etiquetas
ejecutar-migracion-especiales.bat
```

O manualmente:
```batch
psql -U postgres -d mi_app_etiquetas -f migrations\add_producto_especial_columns.sql
```

### Paso 2: Reiniciar Servidor

```batch
INICIAR-SISTEMA.bat
```

O con PM2:
```batch
pm2 restart mi-app-etiquetas
```

### Paso 3: Verificar Funcionamiento

1. Ingresar como costurera
2. Ir a "Crear Nuevo Registro"
3. Verificar que aparece popup con dos opciones
4. Seleccionar "Producto Especial"
5. Verificar que se muestran productos especiales
6. Crear solicitud de prueba

---

## 🧪 Testing

### Verificar en Base de Datos

```sql
-- Ver solicitudes de productos especiales
SELECT 
    numero_solicitud,
    numero_solicitud_grupo,
    id_producto_especial,
    cantidad_solicitada,
    estado
FROM solicitudes_etiquetas
WHERE id_producto_especial IS NOT NULL
ORDER BY fecha_creacion DESC;

-- Ver solicitudes agrupadas
SELECT 
    numero_solicitud_grupo,
    COUNT(*) as total_componentes,
    SUM(cantidad_solicitada) as etiquetas_totales
FROM solicitudes_etiquetas
WHERE numero_solicitud_grupo IS NOT NULL
GROUP BY numero_solicitud_grupo
ORDER BY numero_solicitud_grupo DESC;
```

---

## 📊 Endpoints API Disponibles

### GET `/api/productos-especiales/listar`
- **Descripción**: Obtiene lista de productos especiales
- **Auth**: Requerida
- **Response**:
```json
{
  "productos": [
    {
      "id": 1,
      "codigo": "COMBO-001",
      "nombre": "Conjunto Deportivo",
      "descripcion": "Camiseta + Pantalón + Shorts"
    }
  ]
}
```

### GET `/api/productos-especiales/:id/componentes`
- **Descripción**: Obtiene componentes de un producto especial
- **Auth**: Requerida
- **Response**:
```json
{
  "componentes": [
    {
      "id_producto": 10,
      "codigo_producto": "CAM-001",
      "nombre_producto": "Camiseta Deportiva",
      "cantidad": 1
    }
  ]
}
```

### POST `/api/crear-solicitud-especial`
- **Descripción**: Crea solicitud de producto especial
- **Auth**: Requerida
- **Body**:
```json
{
  "id_producto_especial": 1,
  "cantidad_juegos": 10,
  "prioridad": "normal",
  "observaciones": "Urgente para pedido X",
  "id_usuario_costurera": 5
}
```
- **Response**:
```json
{
  "mensaje": "Solicitud especial creada (3 componentes)",
  "solicitud": {
    "numero_solicitud": "ESP-1736541234567",
    "producto_especial": "Conjunto Deportivo",
    "cantidad_juegos": 10,
    "componentes": [...]
  },
  "auto_approved": false
}
```

---

## 🎯 Beneficios

1. ✅ **Interfaz Unificada**: Mismo patrón visual entre supervisor y costurera
2. ✅ **Selección Clara**: Popup distingue claramente tipo de solicitud
3. ✅ **Feedback Visual**: Muestra componentes antes de crear
4. ✅ **Automatización**: Crea múltiples solicitudes en un solo clic
5. ✅ **Trazabilidad**: Agrupa solicitudes relacionadas
6. ✅ **Integración**: Funciona con auto_services y cola de impresión
7. ✅ **Escalabilidad**: Soporta productos especiales con N componentes

---

## 🔮 Futuras Mejoras

- [ ] Vista de solicitudes agrupadas en dashboard
- [ ] Edición de solicitudes especiales pendientes
- [ ] Reimpresión de grupos completos
- [ ] Estadísticas por producto especial
- [ ] Alertas de stock para componentes
- [ ] Historial de combinaciones más solicitadas

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisar logs del servidor: `pm2 logs`
2. Verificar migración ejecutada correctamente
3. Comprobar que productos especiales tienen componentes
4. Validar permisos de usuario en base de datos

---

**Fecha de Implementación**: Enero 2025  
**Versión**: 1.0  
**Estado**: ✅ Producción
