# 🎨 PLAN: EDITOR VISUAL DE ETIQUETAS (OPCIÓN A - MVP)

**Fecha Inicio**: 24 de octubre de 2025  
**Objetivo**: Editor visual básico para diseñar etiquetas sin tocar código  
**Estrategia**: Implementación por FASES, sin modificar sistema actual

---

## 📋 FASES DE IMPLEMENTACIÓN

### ✅ **FASE 1: FUNDAMENTOS (HOY - 2-3 horas)**
**Objetivo**: Sistema básico funcional para visualizar y arrastrar campos

#### 1.1 Base de Datos
- [x] Crear tabla `plantillas_etiquetas`
- [x] Migración SQL
- [x] Script de ejecución

#### 1.2 Backend (server.js)
- [ ] Función `generarZPLDesdeConfig(config, data)` ⭐ NUEVA (no modifica actual)
- [ ] Endpoint `POST /api/preview-etiqueta`
- [ ] Endpoint `POST /api/test-print-visual`
- [ ] Endpoint `GET /api/plantillas-etiquetas`
- [ ] Endpoint `POST /api/plantillas-etiquetas`

#### 1.3 Frontend
- [ ] Crear `public/editor-visual.html`
- [ ] Agregar Fabric.js (librería canvas)
- [ ] Canvas 400x200 dots (simulando etiqueta)
- [ ] Panel de herramientas con 6 campos básicos:
  - QR Code
  - Nombre Producto
  - Modelo
  - Unidad Medida
  - ID Producto
  - Empresa

#### 1.4 Funcionalidad Básica
- [ ] Arrastrar campos desde panel a canvas
- [ ] Mover campos en canvas
- [ ] Ver posiciones X,Y en tiempo real
- [ ] Botón "Guardar Configuración"
- [ ] Botón "Preview ZPL" (ver código)
- [ ] Botón "Imprimir Test"

**Resultado**: Editor funcional donde puedes arrastrar campos y ver dónde quedarán

---

### 🔄 **FASE 2: PERSONALIZACIÓN (Después de probar FASE 1)**
**Objetivo**: Ajustar tamaños, fuentes, word wrap

#### 2.1 Propiedades de Campos
- [ ] Panel lateral para editar campo seleccionado
- [ ] Cambiar tamaño de fuente
- [ ] Activar/desactivar word wrap
- [ ] Configurar max líneas
- [ ] Configurar ancho del bloque

#### 2.2 Word Wrap Visual
- [ ] Mostrar cómo se divide el texto largo
- [ ] Indicador visual de límite de líneas
- [ ] Preview con datos de prueba reales

#### 2.3 Múltiples Plantillas
- [ ] Crear nueva plantilla
- [ ] Duplicar plantilla existente
- [ ] Activar/desactivar plantilla
- [ ] Marcar como default

**Resultado**: Configuración detallada de cada campo con preview en tiempo real

---

### 🚀 **FASE 3: INTEGRACIÓN (Cuando esté perfecto)**
**Objetivo**: Usar plantillas del editor en impresión real

#### 3.1 Relación con Productos
- [ ] Campo `id_plantilla` en tabla `productos`
- [ ] Asignar plantilla por producto
- [ ] Usar plantilla asignada al imprimir

#### 3.2 Migración
- [ ] Modificar `selectZPLTemplate()` para usar plantillas visuales
- [ ] Fallback a plantillas antiguas si no hay visual
- [ ] Modo de compatibilidad

#### 3.3 Testing
- [ ] Probar con todos los productos
- [ ] Verificar word wrap funciona igual
- [ ] Comparar etiquetas antiguas vs nuevas

**Resultado**: Sistema 100% funcional con editor visual integrado

---

## 🎯 **COMENZAMOS POR**: FASE 1.1 + 1.2

### **¿Por dónde empiezo?**

1. ✅ **Crear tabla en BD** (1 min)
2. ⭐ **Crear función `generarZPLDesdeConfig()`** (clave del sistema)
3. **Crear endpoints API** (para comunicar frontend-backend)
4. **Crear interfaz HTML** (lo visual)

---

## 📊 **ESTRUCTURA DE CONFIGURACIÓN JSON**

```javascript
{
  "id_plantilla": 1,
  "nombre": "Plantilla Estándar",
  "ancho_dots": 812,  // ZD230: 812 dots (203 DPI)
  "alto_dots": 406,   // 406 dots
  "elementos": [
    {
      "id": "qr_1",
      "tipo": "qr",
      "campo_bd": "qr_code",
      "x": 15,
      "y": 40,
      "size": 6,
      "activo": true
    },
    {
      "id": "nombre_1",
      "tipo": "texto",
      "campo_bd": "nombre_producto",
      "x": 200,
      "y": 30,
      "fuente": 36,
      "ancho": 180,
      "max_lineas": 2,
      "word_wrap": true,
      "alineacion": "L",
      "activo": true
    },
    {
      "id": "modelo_1",
      "tipo": "texto",
      "campo_bd": "modelo",
      "x": 200,
      "y": 112,
      "fuente": 28,
      "ancho": 180,
      "max_lineas": 2,
      "word_wrap": true,
      "activo": true
    }
  ]
}
```

---

## 🔧 **FUNCIÓN CLAVE: `generarZPLDesdeConfig()`**

```javascript
/**
 * 🆕 FUNCIÓN PARA EDITOR VISUAL
 * Genera ZPL desde configuración JSON (NO modifica funciones actuales)
 */
function generarZPLDesdeConfig(config, data) {
    let zpl = `^XA
^PW${config.ancho_dots}
^LL${config.alto_dots}
^LH0,0
^LS0
^LT-10
^MTT
^MMT\n`;

    // Recorrer elementos de la configuración
    config.elementos.forEach(elem => {
        if (!elem.activo) return; // Saltar si está desactivado
        
        switch(elem.tipo) {
            case 'qr':
                zpl += generarQRCode(elem, data);
                break;
            case 'texto':
                zpl += generarTexto(elem, data);
                break;
        }
    });
    
    zpl += '^XZ';
    return zpl;
}
```

---

## 📁 **ARCHIVOS A CREAR**

### FASE 1:
```
migrations/
  └── create_plantillas_etiquetas.sql  ⭐ NUEVO

server.js
  └── [Agregar al final]
      ├── generarZPLDesdeConfig()      ⭐ NUEVA FUNCIÓN
      ├── POST /api/preview-etiqueta
      ├── POST /api/test-print-visual
      └── GET/POST /api/plantillas-etiquetas

public/
  ├── editor-visual.html               ⭐ NUEVO
  ├── css/
  │   └── editor-visual.css            ⭐ NUEVO
  └── js/
      ├── fabric.min.js                (descargado)
      └── editor-canvas.js             ⭐ NUEVO
```

---

## 🎨 **MOCKUP FASE 1 (Interfaz Básica)**

```
┌──────────────────────────────────────────────────────────┐
│  🎨 Editor Visual de Etiquetas v1.0          [Guardar]  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────┐  ┌────────────────────────────────────┐ │
│  │ CAMPOS     │  │  CANVAS (812x406 dots)             │ │
│  │            │  │                                     │ │
│  │ [Arrastrar]│  │  ┌──────────────────────────────┐  │ │
│  │            │  │  │                               │  │ │
│  │ 📱 QR      │  │  │  [QR]  Nombre del Producto   │  │ │
│  │ 📝 Nombre  │  │  │        Modelo: QUEEN         │  │ │
│  │ 🏷️ Modelo  │  │  │        UM: UNIDAD            │  │ │
│  │ 📦 Unidad  │  │  │        ID: 000123            │  │ │
│  │ 🔢 ID      │  │  │        HECHO EN PERU         │  │ │
│  │ 🏢 Empresa │  │  │                               │  │ │
│  │            │  │  └──────────────────────────────┘  │ │
│  │            │  │                                     │ │
│  │ [Preview]  │  │  Seleccionado: Nombre              │ │
│  │ [Test]     │  │  X: 200  Y: 30                     │ │
│  └────────────┘  └────────────────────────────────────┘ │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## ⏱️ **TIEMPO ESTIMADO FASE 1**

- ✅ BD + Migración: **10 min**
- ⭐ Función generarZPLDesdeConfig(): **30 min**
- Endpoints API: **20 min**
- HTML + Canvas básico: **40 min**
- Drag & Drop: **30 min**
- Testing inicial: **20 min**

**TOTAL: ~2.5 horas**

---

## 🚀 **EMPEZAMOS POR**:

1. ✅ Crear migración SQL (tabla plantillas)
2. ⭐ Crear función `generarZPLDesdeConfig()` en server.js
3. Crear endpoints básicos
4. HTML mínimo con canvas

**¿Listo para comenzar?** 🎯
