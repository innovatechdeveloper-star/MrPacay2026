# 🖼️ Logos Dinámicos ZPL

Esta carpeta contiene todos los logos e iconos en formato ZPL para impresión de etiquetas.

## 📦 Contenido

### Logo Principal
- **logo-misti-zpl-generado.js** - Logo MISTI (15mm × 15mm)

### Iconos de Advertencia Pequeños
Tamaño: 87×96 dots (7.4mm × 8.1mm)

- **icono-lavado-30-zpl.js** - Lavado a 30°C
- **icono-no-lejia-zpl.js** - No usar lejía
- **icono-planchar-baja-zpl.js** - Planchar a baja temperatura
- **icono-secadora-baja-zpl.js** - Secadora a baja temperatura

### Logos de Advertencia Grandes
Tamaño: 14.5mm × 14.5mm (172×172 dots)

- **logo-lavar-max-zpl.js** - Lavar máximo
- **logo-no-planchar-v5-zpl.js** - No planchar (versión 5)

### Logos Dinámicos Proporcionales
Ancho: 27mm, alto variable

- **logo-algodon-100-zpl.js** - 100% Algodón
- **logo-maxima-suavidad-v2-zpl.js** - Máxima Suavidad (27.0×10.3mm, 319×122 dots)
- **logo-producto-peruano-zpl.js** - Producto Peruano
- **logo-producto-arequipeno-zpl.js** - Producto Arequipeño (27.0×10.3mm, 319×122 dots)

## 🔧 Uso

Estos archivos son importados por `server.js`:

```javascript
const { LOGO_MISTI_ZPL } = require('./logos_dinamicos/logo-misti-zpl-generado.js');
const { ICONO_LAVADO_30_ZPL } = require('./logos_dinamicos/icono-lavado-30-zpl.js');
const { MAXIMA_SUAVIDAD_V2_ZPL } = require('./logos_dinamicos/logo-maxima-suavidad-v2-zpl.js');
// ... etc
```

## 📐 Especificaciones

- **Formato:** ZPL (Zebra Programming Language)
- **Resolución:** 300 DPI (12 dots/mm)
- **Comando:** `^GFA` (Graphic Field, ASCII)
- **Color:** Monocromático (blanco y negro)

## 🎨 Cómo Convertir Nuevos Logos

1. Imagen original en PNG/JPG (fondo transparente recomendado)
2. Usar herramienta de conversión a ZPL (Labelary, ZebraDesigner, etc.)
3. Ajustar tamaño a 300 DPI
4. Copiar código ZPL al archivo .js:

```javascript
const NOMBRE_LOGO_ZPL = `^GFA,bytes,bytes,rowbytes,...datos hexadecimales...^FS`;
module.exports = { NOMBRE_LOGO_ZPL };
```

## 🔗 Referencias

- [Labelary Online ZPL Viewer](http://labelary.com/viewer.html)
- [ZPL Programming Guide](https://www.zebra.com/us/en/support-downloads/knowledge-articles/ait/zpl-programming-guide.html)
- `documentation/pruebas/` - Scripts de conversión y pruebas

## ⚠️ Importante

**NO elimines ni modifiques estos archivos** sin antes actualizar `server.js` líneas ~695-711.

Si agregas un nuevo logo:
1. Crear archivo aquí: `nuevo-logo-zpl.js`
2. Exportar constante: `module.exports = { NUEVO_LOGO_ZPL };`
3. Importar en `server.js`: `const { NUEVO_LOGO_ZPL } = require('./logos_dinamicos/nuevo-logo-zpl.js');`
4. Usar en `generarRotuladoZPL()` función
