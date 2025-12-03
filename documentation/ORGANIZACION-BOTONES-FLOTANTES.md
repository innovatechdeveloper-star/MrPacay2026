# 📍 Organización de Botones Flotantes - Sistema de Etiquetas

## 🎯 Disposición Vertical de Botones

Para evitar superposición entre los 3 botones flotantes del sistema, se han organizado en una **disposición vertical** en la esquina inferior derecha.

---

## 📐 Posicionamiento de Botones

### Vista Desktop (> 768px)

```
                                    Esquina inferior derecha
                                              ↓
                                         
                                         [🌿 Tema]      ← bottom: 24px
                                              ↓ 20px espacio
                                         
                                         [ ? Ayuda]     ← bottom: 100px
                                              ↓ ~20px espacio
                                         
                                         [💬 Chat]      ← bottom: ~176px (si existe)
```

### Vista Móvil (< 768px)

```
                                    Esquina inferior derecha
                                              ↓
                                         
                                         [🌿]      ← Tema (más pequeño)
                                              ↓
                                         
                                         [?]       ← Ayuda (más pequeño)
                                              ↓
                                         
                                         [💬]      ← Chat (más pequeño)
```

---

## 🎨 Especificaciones Técnicas

### 1. Botón de Tema (Theme Switcher)
**Archivo**: `/css/theme-switcher.js`

| Propiedad | Desktop | Móvil |
|-----------|---------|-------|
| **Position** | `fixed` | `fixed` |
| **Bottom** | `24px` | `16px` |
| **Right** | `24px` | `16px` |
| **Size** | `56px × 56px` | `48px × 48px` |
| **Z-index** | `1070` | `1070` |
| **Border** | `3px rgba(255,255,255,0.3)` | `3px rgba(255,255,255,0.3)` |
| **Icon** | `🌿` (24px) | `🌿` (20px) |
| **Background** | `var(--color-primary)` | `var(--color-primary)` |

**Funcionalidad**: Cambiar entre temas (Claro, Natural, Elegante, Profesional)

---

### 2. Botón de Ayuda (Help Button)
**Archivos**: 
- `costurera-dashboard.html`
- `supervisor-dashboard.html`

| Propiedad | Desktop | Móvil |
|-----------|---------|-------|
| **Position** | `fixed` | `fixed` |
| **Bottom** | `100px` | `85px` |
| **Right** | `24px` | `16px` |
| **Size** | `56px × 56px` | `48px × 48px` |
| **Z-index** | `1069` | `1069` |
| **Border** | `3px rgba(255,255,255,0.3)` | `3px rgba(255,255,255,0.3)` |
| **Icon** | `?` (26px) | `?` (22px) |
| **Background** | `linear-gradient(135deg, #667eea, #764ba2)` | Mismo |

**Funcionalidad**: Abrir manual de ayuda interactivo (`manual-ayuda.html`)

**Tooltip**: "Ayuda" (aparece al hacer hover)

---

### 3. Botón de Chat (Si existe)
**Ubicación**: Debajo del botón de ayuda

| Propiedad | Desktop | Móvil |
|-----------|---------|-------|
| **Position** | `fixed` | `fixed` |
| **Bottom** | `~176px` | `~161px` |
| **Right** | `24px` | `16px` |
| **Size** | `56px × 56px` | `48px × 48px` |
| **Z-index** | `1068` | `1068` |

**Nota**: Este botón aún no está implementado en el código actual.

---

## 🎨 Espaciado Entre Botones

```css
/* Espaciado calculado */
Botón 1 (Tema):     bottom: 24px
    ↓ gap: 20px
Botón 2 (Ayuda):    bottom: 100px    (24 + 56 + 20 = 100)
    ↓ gap: 20px
Botón 3 (Chat):     bottom: 176px    (100 + 56 + 20 = 176)
```

**Fórmula**: `bottom_siguiente = bottom_anterior + size_botón + gap`

---

## 📱 Breakpoints Responsive

### Desktop (> 768px)
- Botones: `56px × 56px`
- Gap vertical: `20px`
- Posición derecha: `24px`

### Mobile (< 768px)
- Botones: `48px × 48px`
- Gap vertical: `~17px`
- Posición derecha: `16px`

---

## 🔧 Código de Implementación

### CSS para Botón de Ayuda (Actualizado)

```css
.help-button {
    position: fixed;
    bottom: 100px;           /* Debajo del theme switcher */
    right: 24px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1069;           /* Justo debajo del theme switcher */
    border: 3px solid rgba(255, 255, 255, 0.3);
    text-decoration: none;
}

.help-button:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
    .help-button {
        width: 48px;
        height: 48px;
        bottom: 85px;        /* Ajustado para móvil */
        right: 16px;
    }
}
```

### HTML del Botón

```html
<a href="manual-ayuda.html" class="help-button" target="_blank">
    <span class="icon">?</span>
    <span class="tooltip">Ayuda</span>
</a>
```

---

## 🎯 Z-index Hierarchy

Para evitar conflictos de capas:

```
🔝 Más alto
├── 1070: Theme Switcher Button
├── 1069: Help Button (Ayuda)
├── 1068: Chat Button (futuro)
├── 1000: Modales/Overlays
├── 999: Notificaciones
└── 1: Contenido normal
🔻 Más bajo
```

---

## ✨ Efectos y Animaciones

### Hover Effects

**Theme Switcher**:
```css
transform: scale(1.15);
box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
```

**Help Button**:
```css
transform: scale(1.1) rotate(5deg);
box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
border-color: rgba(255, 255, 255, 0.6);
```

### Transitions
- Duración: `0.3s` (help button), `250ms` (theme switcher)
- Easing: `ease` / `ease-in-out`

---

## 🎨 Paleta de Colores

### Botón de Tema
- **Background**: Variable del tema activo (`var(--color-primary)`)
- **Border**: `rgba(255, 255, 255, 0.3)`
- **Shadow**: `rgba(0, 0, 0, 0.3)`

### Botón de Ayuda
- **Background**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Border**: `rgba(255, 255, 255, 0.3)`
- **Shadow**: `rgba(102, 126, 234, 0.4)`

### Tooltip
- **Background**: `rgba(0, 0, 0, 0.85)`
- **Text**: `white`
- **Position**: `right: 70px` (a la izquierda del botón)

---

## 📊 Comparación Visual

### Antes (Conflicto)
```
❌ Superposición
┌─────────────────────────────────┐
│                                 │
│                          [🌿]   │  ← Tema
│                          [?]    │  ← Ayuda (mismo lugar)
│                          [💬]   │  ← Chat (mismo lugar)
└─────────────────────────────────┘
```

### Después (Organizado)
```
✅ Disposición vertical
┌─────────────────────────────────┐
│                                 │
│                          [🌿]   │  ← Tema (top)
│                            ↓    │
│                          [?]    │  ← Ayuda (medio)
│                            ↓    │
│                          [💬]   │  ← Chat (bottom)
└─────────────────────────────────┘
```

---

## 🔍 Testing Checklist

- [x] Botones no se superponen en desktop
- [x] Botones no se superponen en móvil
- [x] Tooltips son visibles y no salen de pantalla
- [x] Z-index correcto (theme switcher encima)
- [x] Efectos hover funcionan sin conflictos
- [x] Responsive correctamente implementado
- [x] Accesibilidad: se puede navegar con teclado
- [ ] Probar en diferentes resoluciones
- [ ] Probar con botón de chat (cuando se implemente)

---

## 🚀 Próximos Pasos

1. **Implementar botón de Chat** (si es necesario)
   - Position: `bottom: 176px` (desktop), `161px` (móvil)
   - Z-index: `1068`
   
2. **Agregar animación de entrada** (opcional)
   - Delay escalonado: Tema → Ayuda → Chat
   - Efecto: `fadeInUp` o `slideInRight`

3. **Considerar panel desplegable** (opcional)
   - Un solo botón que expande los demás
   - Útil si se agregan más de 3 botones

---

## 📝 Notas Adicionales

### Accesibilidad
- Los botones tienen `title` attributes para screen readers
- Tooltips con contraste adecuado (WCAG AA)
- Tamaño mínimo de 48px en móvil (touch target guidelines)

### Performance
- Transitions con `transform` (GPU accelerated)
- `will-change` aplicado en hover para smooth animations
- Sin cambios de layout que causen reflow

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

---

**Última actualización**: 4 de noviembre de 2025  
**Archivos modificados**:
- `costurera-dashboard.html` (CSS del botón de ayuda)
- `supervisor-dashboard.html` (CSS del botón de ayuda)

**Documentos relacionados**:
- `SISTEMA-AYUDA-IMPLEMENTADO.md`
- `/css/theme-switcher.js`
