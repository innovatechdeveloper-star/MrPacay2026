# 📚 Sistema de Ayuda Integrado - Manual Interactivo

## 🎯 Descripción General

Se ha implementado un sistema completo de ayuda con manual interactivo y botón flotante de acceso rápido para facilitar el uso del sistema a las costureras y supervisores.

---

## 📦 Componentes Creados

### 1. **Manual Interactivo (`manual-ayuda.html`)**

Página HTML completa con sistema de ayuda navegable por categorías.

#### Características:
- ✅ Diseño moderno y responsivo con gradientes morados
- ✅ Navegación por categorías con tarjetas interactivas
- ✅ Secciones expandibles con videos y guías paso a paso
- ✅ Placeholders para integrar videos MP4 de Veo 3
- ✅ Sección de código QR para acceso móvil
- ✅ Botón de regreso a dashboard

#### Categorías Incluidas:

1. **📝 Crear Solicitud de Etiquetas**
   - Video tutorial del proceso completo
   - 5 pasos detallados (Login → Búsqueda → Selección → Aprobación → Recogida)
   - Explicación del flujo con y sin auto-aprobación

2. **➕ Crear Nuevo Producto**
   - Proceso de acceso al panel de administración
   - Llenado de información básica
   - Configuración de logos e íconos
   - Vista previa y guardado

3. **✏️ Editar Producto**
   - Búsqueda de producto existente
   - Modificación de campos
   - Vista previa de cambios
   - Actualización

4. **🗑️ Eliminar Producto**
   - Localización del producto
   - Confirmación de eliminación
   - Advertencias sobre irreversibilidad

5. **✅ Aprobar Solicitudes (Supervisor)**
   - Revisión de solicitudes pendientes
   - Proceso de aprobación/rechazo
   - Impresión automática tras aprobación

6. **📊 Ver Historial**
   - Consulta de historial de solicitudes
   - Aplicación de filtros
   - Exportación a Excel
   - Visualización de estadísticas

7. **🖨️ Proceso de Impresión**
   - Explicación técnica del sistema ZPL
   - Envío TCP/IP a impresoras
   - Cola de impresión
   - Confirmaciones automáticas

8. **⚠️ Seguridad del Equipo**
   - **Medidas de seguridad con videos demostrativos**
   - Video de qué NO hacer (desconectar sin apagar)
   - Procedimientos correctos de apagado
   - Cuidado de cables y extensiones
   - Mantenimiento preventivo

---

### 2. **Botón Flotante de Ayuda**

Botón circular con ícono "?" implementado en:
- ✅ `costurera-dashboard.html`
- ✅ `supervisor-dashboard.html`

#### Características del Botón:
- **Posición**: Fixed, esquina inferior derecha (30px bottom, 30px right)
- **Diseño**: Círculo morado con gradiente, borde blanco
- **Tamaño**: 60px × 60px (desktop), 50px × 50px (móvil)
- **Efecto hover**: Escala 1.1 y rotación 5°, sombra aumentada
- **Tooltip**: Aparece al pasar el mouse con texto "Ayuda"
- **Acción**: Abre `manual-ayuda.html` en nueva pestaña
- **Z-index**: 999 (por encima de otros elementos)

#### CSS Implementado:
```css
.help-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 999;
    border: 3px solid white;
    text-decoration: none;
}
```

---

## 🎬 Integración de Videos MP4

### Videos Integrados ✅:

#### 1. **Video Explicativo (Solicitud de Etiquetas)**
- **Archivo**: `founds/animations-info/video_explicativo.mp4`
- **Sección**: `section-crear-solicitud`
- **Ruta en HTML**: `../founds/animations-info/video_explicativo.mp4`
- **Contenido**: Proceso completo de solicitud de etiquetas
- **Estado**: ✅ Integrado

#### 2. **Video de Aplicación de Rotulado**
- **Archivo**: `founds/animations-info/aplicacionde_rotulado.mp4`
- **Sección**: `section-imprimir` (Proceso de Impresión)
- **Ruta en HTML**: `../founds/animations-info/aplicacionde_rotulado.mp4`
- **Contenido**: Costurera aplicando etiquetas/rotulados en productos
- **Estado**: ✅ Integrado

#### 3. **Video de Advertencia de Usos**
- **Archivo**: `founds/animations-info/advertencia_usos.mp4`
- **Sección**: `section-seguridad`
- **Ruta en HTML**: `../founds/animations-info/advertencia_usos.mp4`
- **Contenido**: Medidas de seguridad y qué NO hacer con el equipo
- **Estado**: ✅ Integrado

### Integración Implementada ✅:

**Videos HTML5 con controles:**
```html
<video controls autoplay loop muted style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
    <source src="../founds/animations-info/video_explicativo.mp4" type="video/mp4">
    Tu navegador no soporta la reproducción de videos HTML5.
</video>
```

**Estructura de carpetas actual:**
```
mi-app-etiquetas/
  founds/
    animations-info/       ← Carpeta con videos
      video_explicativo.mp4
      aplicacionde_rotulado.mp4
      advertencia_usos.mp4
  public/
    manual-ayuda.html      ← Referencias: ../founds/animations-info/
```

**Características de los videos:**
- ✅ Autoplay activado
- ✅ Loop infinito
- ✅ Muted para permitir autoplay sin interacción del usuario
- ✅ Controles visibles para pausar/adelantar
- ✅ Responsive (100% width/height con object-fit: cover)
- ✅ Bordes redondeados (10px)

---

## 🎨 Estilo de Animación Identificado

### **Nombre Técnico**: Flat Design Illustration / Corporate Explainer Style

**Características del estilo:**
- Vector illustration animation
- 2D character animation con minimal design
- Colores pastel suaves (morados, azules, beiges)
- Personajes con rasgos simplificados
- Movimientos fluidos pero no exagerados
- Sombras sutiles y degradados suaves
- Estética profesional similar a videos de awareness (COVID, salud, corporativos)

**Keywords para Veo 3:**
- `flat design illustration`
- `corporate explainer style`
- `2D character animation`
- `minimal vector animation`
- `infographic animation style`
- `soft pastel colors`
- `COVID awareness animation style`

**Software común para este estilo:**
- Adobe After Effects
- Vyond
- Animaker
- Moho (Anime Studio)

---

## 📱 Funcionalidad QR

### Placeholder Actual:
```html
<div class="qr-placeholder">
    🔲 QR Code<br>
    <small>(Se generará automáticamente)</small>
</div>
```

### Para Implementar QR Real:

**Opción 1: Usar QRCode.js (Librería JavaScript)**
```html
<!-- Agregar en <head> -->
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

<!-- Modificar JavaScript -->
<script>
window.addEventListener('DOMContentLoaded', function() {
    const qrContainer = document.querySelector('.qr-placeholder');
    qrContainer.innerHTML = ''; // Limpiar placeholder
    
    new QRCode(qrContainer, {
        text: window.location.href,
        width: 250,
        height: 250,
        colorDark: "#667eea",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
});
</script>
```

**Opción 2: Generar QR desde servidor (Node.js)**
```javascript
// Instalar: npm install qrcode
const QRCode = require('qrcode');

app.get('/api/generar-qr-manual', async (req, res) => {
    const url = 'http://192.168.1.XX:3012/manual-ayuda.html';
    const qrDataUrl = await QRCode.toDataURL(url);
    res.json({ qr: qrDataUrl });
});
```

---

## 🔧 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `manual-ayuda.html` | ✅ Creado desde cero (900+ líneas) |
| `costurera-dashboard.html` | ✅ Agregado botón flotante + CSS (~100 líneas) |
| `supervisor-dashboard.html` | ✅ Agregado botón flotante + CSS (~100 líneas) |

---

## 🚀 Cómo Usar el Sistema de Ayuda

### Para Costureras/Supervisores:

1. **Desde cualquier dashboard**, verás el botón **?** flotante en la esquina inferior derecha
2. **Pasa el mouse** sobre el botón para ver el tooltip "Ayuda"
3. **Haz clic** en el botón para abrir el manual en nueva pestaña
4. **Selecciona la categoría** de ayuda que necesitas (ejemplo: "Crear Solicitud de Etiquetas")
5. **Ve el video tutorial** y sigue los pasos detallados
6. **Cierra la sección** cuando termines y vuelve a elegir otra categoría
7. **Escanea el QR** con tu celular para tener el manual siempre disponible

---

## 📸 Próximos Pasos (Screenshots)

Cuando necesites agregar capturas de pantalla de los dashboards:

1. **Tomar screenshots** de:
   - Pantalla de login
   - Dashboard de costurera
   - Dashboard de supervisor
   - Panel de solicitudes pendientes
   - Gestión de productos
   - Historial de solicitudes

2. **Guardar en carpeta**:
   ```
   public/
     images/
       ayuda/
         screenshot-login.png
         screenshot-dashboard-costurera.png
         screenshot-solicitudes.png
         screenshot-productos.png
         screenshot-historial.png
   ```

3. **Integrar en manual**:
   ```html
   <div class="step-screenshot">
       <img src="images/ayuda/screenshot-login.png" alt="Pantalla de login">
   </div>
   ```

---

## 🎨 Paleta de Colores del Manual

| Elemento | Color |
|----------|-------|
| Fondo gradiente | `#667eea` → `#764ba2` |
| Header principal | Gradiente morado |
| Cards hover | Border `#667eea` |
| Botones | `#667eea` |
| Texto principal | `#2d3748` |
| Texto secundario | `#718096` |
| Pasos numerados | Fondo `#667eea` |
| Tooltips | `rgba(0,0,0,0.8)` |

---

## 📊 Estadísticas

- **Líneas de código totales**: ~1,100
- **Secciones de ayuda**: 8
- **Pasos detallados**: 40+ (5 por categoría promedio)
- **Videos planeados**: 3
- **Páginas modificadas**: 3
- **Tiempo estimado de implementación**: 2 horas

---

## ✅ Checklist de Implementación

- [x] Crear página `manual-ayuda.html` con diseño completo
- [x] Implementar 8 categorías de ayuda con pasos detallados
- [x] Agregar botón flotante en `costurera-dashboard.html`
- [x] Agregar botón flotante en `supervisor-dashboard.html`
- [x] Diseñar placeholders para videos
- [x] Crear sección de QR para acceso móvil
- [x] ~~Generar videos con Veo 3 (3 videos)~~ → Videos ya disponibles
- [x] **Integrar videos MP4 en placeholders** ✅ COMPLETADO
- [ ] Implementar generación de QR real
- [ ] Tomar screenshots de interfaces
- [ ] Agregar screenshots a las guías

### 🎬 Videos Integrados (Última actualización: 5/11/2025):

| Video | Ruta | Sección | Estado |
|-------|------|---------|--------|
| Video Explicativo | `founds/animations-info/video_explicativo.mp4` | Crear Solicitud | ✅ |
| Aplicación Rotulado | `founds/animations-info/aplicacionde_rotulado.mp4` | Proceso Impresión | ✅ |
| Advertencia Usos | `founds/animations-info/advertencia_usos.mp4` | Seguridad | ✅ |
| **Creador Producto** | `founds/animations-info/creador_producto.mp4` | Crear Producto | ✅ **NUEVO** |
| **Editar Producto** | `founds/animations-info/editar_producto.mp4` | Editar Producto | ✅ **NUEVO** |

---

## 🎥 Prompts Usados para Veo 3

### 1. Solicitud de Etiquetas (15s)
```
15-second flat design animation video: Modern factory workspace with pastel purple and blue colors. Female seamstress in work clothes stands at table with two label printers (Godex G530 black, Zebra ZD230 white). She picks up tablet, taps screen twice, digital connection line appears to Zebra printer. Printer activates, prints and auto-cuts 4 labels in sequence. She picks up labels with satisfied expression. Smooth minimal 2D animation style like COVID awareness videos, soft shadows, rounded shapes, professional atmosphere. 1920x1080, 24fps.
```

### 2. Costura de Etiquetas (12s)
```
12-second simple flat design animation: Mature female seamstress (45-60 years, short hair, work clothes) in garment factory. She picks up printed labels from work table, walks calmly to her industrial sewing machine. Places labels in holder, picks one label, positions it on white pillow, sews it with machine. Natural beige and soft gray colors, realistic calm movements, no sparkles or glowing effects, professional mature aesthetic, warm factory lighting. 1920x1080, 24fps.
```

### 3. Seguridad de Equipos (8s)
```
8-second flat design safety animation video: Side view of 3-tier work table with label printing equipment. Bottom tier: power strip and Zebra printer. Middle tier: Godex G530 printer with label roll and WiFi access point. Top tier: 5-port network switch with cables. Soft purple and blue pastel colors like COVID awareness style. Animation: Hand in yellow sleeve suddenly unplugs power strip while devices are running (green LEDs on). Red warning X appears, devices shut off incorrectly. Text overlay: "¡NO DESCONECTAR SIN APAGAR!". Educational safety video aesthetic, rounded shapes, minimal design. 1920x1080, 24fps.
```

---

## 💡 Consejos de Uso

1. **Mantén los videos cortos**: Veo 3 máximo 8 segundos, ideal para tutoriales rápidos
2. **Usa el estilo consistente**: Todos los videos con el mismo flat design
3. **Agregar subtítulos**: Para personas con discapacidad auditiva
4. **Actualizar periódicamente**: Cuando cambies funciones del sistema
5. **Recopilar feedback**: Pregunta a las costureras qué secciones necesitan más detalle

---

**Documento creado el**: 4 de noviembre de 2025  
**Versión**: 1.0  
**Autor**: Sistema de Etiquetas V2.5
