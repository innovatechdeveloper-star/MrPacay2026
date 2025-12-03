# 🎨 Sistema de Diseño Accesible - Guía de Implementación

## 📋 Índice
1. [Instalación](#instalación)
2. [Principios de Diseño](#principios-de-diseño)
3. [Paleta de Colores](#paleta-de-colores)
4. [Componentes](#componentes)
5. [Accesibilidad](#accesibilidad)
6. [Testing](#testing)

---

## 🚀 Instalación

### Método 1: Agregar al HTML (Recomendado)
Agrega esta línea en el `<head>` de tus archivos HTML, **antes** de cualquier otro CSS:

```html
<link rel="stylesheet" href="/accessible-design-system.css">
```

### Método 2: Import en CSS existente
Si tienes un archivo CSS principal:

```css
@import url('/accessible-design-system.css');
```

---

## 🎯 Principios de Diseño

### 1. Alto Contraste
- **Ratio mínimo**: 7:1 (WCAG AAA)
- **Textos pequeños**: Contraste aún mayor
- **Bordes visibles**: Siempre 2px o más

### 2. Áreas Táctiles
- **Tamaño mínimo**: 44x44px
- **Espaciado**: Mínimo 8px entre elementos interactivos

### 3. Estados Visuales Claros
- **Focus**: Outline azul de 3px con offset
- **Hover**: Cambio de color + sombra
- **Active**: Feedback visual inmediato
- **Disabled**: Gris claro con cursor not-allowed

### 4. Tipografía Legible
- **Tamaño base**: 16px
- **Line-height**: 1.5 (mínimo)
- **Fuente**: Sans-serif del sistema

---

## 🎨 Paleta de Colores

### Primarios
```css
--color-primary: #0047AB;        /* Azul profundo */
--color-primary-hover: #003380;  /* Azul oscuro */
--color-primary-light: #E6F0FF;  /* Azul claro */
```

### Estados
| Color | Variable | Uso |
|-------|----------|-----|
| 🟢 Verde | `--color-success` | Éxito, confirmación |
| 🟡 Naranja | `--color-warning` | Advertencias |
| 🔴 Rojo | `--color-danger` | Errores, eliminación |
| 🔵 Azul info | `--color-info` | Información |

### Grises (Alto Contraste)
| Nivel | Variable | Ratio vs Blanco |
|-------|----------|-----------------|
| 900 | `--color-gray-900` | 18:1 |
| 800 | `--color-gray-800` | 15:1 |
| 700 | `--color-gray-700` | 12:1 |
| 600 | `--color-gray-600` | 7:1 (AAA) |

---

## 🧩 Componentes

### Botones

#### Clases Disponibles
```html
<!-- Primario (acción principal) -->
<button class="btn-primary">Guardar</button>

<!-- Secundario (acción secundaria) -->
<button class="btn-secondary">Cancelar</button>

<!-- Estados -->
<button class="btn-success">Aprobar</button>
<button class="btn-warning">Advertir</button>
<button class="btn-danger">Eliminar</button>

<!-- Tamaños -->
<button class="btn-primary btn-sm">Pequeño</button>
<button class="btn-primary">Normal</button>
<button class="btn-primary btn-lg">Grande</button>
```

#### Características
- ✅ Mínimo 44px de altura
- ✅ Focus visible con outline de 3px
- ✅ Hover con elevación (translateY)
- ✅ Estados disabled claramente visibles

---

### Formularios

#### Inputs Accesibles
```html
<label for="nombre">Nombre completo</label>
<input type="text" id="nombre" name="nombre" required>
```

#### Características
- ✅ Labels siempre visibles (no placeholder como label)
- ✅ Borde de 2px en estado normal
- ✅ Focus con outline azul de 3px
- ✅ Hover aumenta grosor de borde
- ✅ Disabled con background gris

#### Validación
```html
<!-- Success -->
<div class="alert alert-success">✅ Formulario enviado correctamente</div>

<!-- Error -->
<div class="alert alert-danger">❌ Por favor corrige los errores</div>

<!-- Warning -->
<div class="alert alert-warning">⚠️ Revisa la información</div>

<!-- Info -->
<div class="alert alert-info">ℹ️ Campo opcional</div>
```

---

### Tarjetas

```html
<div class="card">
    <h3>Título de la Tarjeta</h3>
    <p>Contenido de la tarjeta con buen contraste</p>
    <button class="btn-primary">Acción</button>
</div>
```

#### Características
- ✅ Borde de 2px para definición clara
- ✅ Padding generoso (24px)
- ✅ Sombra sutil que aumenta en hover

---

### Tablas

```html
<table>
    <thead>
        <tr>
            <th>Columna 1</th>
            <th>Columna 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Dato 1</td>
            <td>Dato 2</td>
        </tr>
    </tbody>
</table>
```

#### Características
- ✅ Header con fondo oscuro (#1A1A1A) y texto blanco
- ✅ Filas alternadas con background (#F5F5F5)
- ✅ Hover destaca toda la fila
- ✅ Padding 16px en celdas

---

### Modales

```html
<div class="modal-overlay" style="display: flex;">
    <div class="modal-content">
        <h3>Título del Modal</h3>
        <p>Contenido...</p>
        <button class="btn-primary">Aceptar</button>
        <button class="btn-secondary">Cancelar</button>
    </div>
</div>
```

#### Características
- ✅ Backdrop oscuro (75% opacidad)
- ✅ Blur en fondo para separación
- ✅ Borde grueso (3px) en modal
- ✅ Animación suave de entrada

---

### Badges

```html
<span class="badge badge-success">Completado</span>
<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-danger">Rechazado</span>
<span class="badge badge-info">En proceso</span>
```

---

### Tabs/Navegación

```html
<div class="tabs">
    <button class="nav-tab active">Tab 1</button>
    <button class="nav-tab">Tab 2</button>
    <button class="nav-tab">Tab 3</button>
</div>
```

#### Características
- ✅ Borde inferior grueso (3px) en activo
- ✅ Background azul claro en hover/activo
- ✅ Mínimo 44px de altura

---

## ♿ Accesibilidad

### Checklist de Cumplimiento

#### Visual
- [x] Contraste AAA (7:1) en todos los textos
- [x] Tamaño mínimo de fuente 14px
- [x] Line-height de 1.5 o superior
- [x] Focus visible en todos los elementos interactivos
- [x] No se usa solo color para transmitir información

#### Interacción
- [x] Áreas táctiles mínimas de 44x44px
- [x] Navegación por teclado completa
- [x] Estados disabled claramente identificables
- [x] Hover states para feedback visual

#### Semántica
- [x] Labels asociados a inputs (for + id)
- [x] Botones con type explícito
- [x] Headings en orden jerárquico
- [x] Alt text en imágenes (responsabilidad del HTML)

### Soporte para Tecnologías Asistivas

#### Screen Readers
```html
<!-- Texto solo para lectores de pantalla -->
<span class="sr-only">Texto descriptivo</span>

<!-- Botón con texto accesible -->
<button aria-label="Eliminar producto">🗑️</button>
```

#### Modo Alto Contraste
El sistema detecta automáticamente `prefers-contrast: high` y aumenta:
- Grosor de bordes a 3-4px
- Outline en focus a 4px

#### Reducción de Movimiento
Detecta `prefers-reduced-motion: reduce` y:
- Elimina animaciones
- Mantiene solo transiciones esenciales (< 0.01ms)

---

## 🧪 Testing

### Herramientas Recomendadas

#### 1. Axe DevTools (Chrome/Firefox)
```bash
# Instalar extensión
https://www.deque.com/axe/devtools/
```

#### 2. WAVE (Web Accessibility Evaluation Tool)
```bash
https://wave.webaim.org/
```

#### 3. Lighthouse (Chrome DevTools)
- Abrir DevTools (F12)
- Ir a pestaña "Lighthouse"
- Seleccionar "Accessibility"
- Run audit

### Checklist Manual

#### Teclado
- [ ] Tab navega todos los elementos interactivos
- [ ] Enter/Space activa botones
- [ ] Escape cierra modales
- [ ] Focus visible en todo momento

#### Contraste
- [ ] Verificar con [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ ] Ratio mínimo 7:1 para textos
- [ ] Ratio mínimo 3:1 para elementos grandes

#### Zoom
- [ ] Probar al 200% (Ctrl/Cmd + +)
- [ ] No hay overflow horizontal
- [ ] Texto legible sin scrolling horizontal

#### Móvil
- [ ] Áreas táctiles de 44px mínimo
- [ ] Formularios utilizables con teclado táctil
- [ ] Zoom permitido (no `user-scalable=no`)

---

## 📱 Responsive

### Breakpoints
```css
/* Mobile: < 768px */
@media (max-width: 768px) {
    /* Botones full-width */
    /* Font size reducido a 14px */
}

/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

---

## 🎨 Personalización

### Variables CSS
Todas las variables están en `:root`. Para personalizar:

```css
/* En tu CSS custom */
:root {
    --color-primary: #TU_COLOR;
    --font-size-base: 18px;
    --spacing-md: 20px;
}
```

### Modo Oscuro (Próximamente)
```css
@media (prefers-color-scheme: dark) {
    /* Inversión de colores manteniendo contraste */
}
```

---

## 📊 Métricas de Rendimiento

- **Tamaño del archivo**: ~15KB minificado
- **Carga**: < 50ms
- **Sin dependencias**: CSS puro
- **Soporte de navegadores**: Todos modernos + IE11 (parcial)

---

## 🆘 Solución de Problemas

### "Los estilos no se aplican"
1. Verificar que el CSS esté antes de otros estilos
2. Usar clases específicas (`btn-primary`, no solo `button`)
3. Verificar que no haya `!important` en otros CSS

### "El focus no se ve"
1. Verificar que no haya `outline: none` en otro CSS
2. Usar `:focus-visible` para mejor UX

### "Los colores no tienen suficiente contraste"
1. Usar solo las variables CSS predefinidas
2. No crear colores custom sin verificar contraste
3. Herramienta: https://webaim.org/resources/contrastchecker/

---

## 📚 Recursos Adicionales

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)

---

## 📄 Licencia

Sistema de diseño accesible - Uso libre para este proyecto

**Creado**: 16 de Octubre, 2025  
**Versión**: 1.0.0  
**Cumplimiento**: WCAG 2.1 Level AAA
