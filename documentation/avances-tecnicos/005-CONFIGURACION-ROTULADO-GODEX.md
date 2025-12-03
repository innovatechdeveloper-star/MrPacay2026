# 🎀 Configuración del Rotulado - Godex G530

## 📐 Especificaciones Técnicas

### Dimensiones
- **Ancho:** 3cm = 236 dots (a 203 DPI)
- **Altura (Fase 1):** 5cm = 394 dots (a 203 DPI)
- **Altura (Fase 2 - Futuro):** 10cm = 787 dots (doblado: 5cm delante + 5cm atrás)

### Canvas en Vista Previa
```javascript
Canvas ID: preview-canvas-rotulado
Dimensiones: 200×400 píxeles (aproximado a 236×394 dots)
```

### Límites de Texto
- **Etiqueta QR:** 28 caracteres máximos por línea × 2 líneas = 56 caracteres totales
- **Rotulado:** 18 caracteres máximos por línea × 3-4 líneas

## 🎨 Diseño del Rotulado (Fase 1 - Encabezado)

```
┌─────────────────────┐
│                     │
│     CAMITEX         │  ← Logo/Texto (azul #2563eb)
│   Ropa de Cama      │  ← Subtítulo (gris)
│ ─────────────────── │
│                     │
│  COBERTOR BP 1.5    │  ← Nombre producto
│  P AVALON DOBLE     │     (bold, negro, centrado)
│                     │
│   ROPA DE CAMA      │  ← Categoría (gris oscuro)
│                     │
│      2 PLZ          │  ← Talla (bold, grande)
│                     │
│  PRODUCTO PERUANO   │  ← Origen (verde #16a34a)
│                     │
└─────────────────────┘
```

## 🖼️ Conversión del Logo CAMITEX

### Logo Ubicado en:
```
founds/godex/LOGO.png
```

### Opciones para Usar el Logo:

#### **Opción 1: Convertir PNG a ZPL Hexadecimal** (Recomendada)
1. Ir a: https://labelary.com/viewer.html
2. O usar: http://www.zplprinter.co.uk/image-to-zpl-converter/
3. Subir `LOGO.png`
4. Configurar:
   - Ancho: ~180 dots (para que quepa en 3cm de ancho)
   - Formato: ZPL GRF (Graphic Field)
5. Copiar código ZPL generado
6. Ejemplo de código resultante:
```zpl
^GFA,length,bytes_per_row,total_rows,data_in_hex
```

#### **Opción 2: Servir logo desde servidor y usar ^IL (Image Load)**
```javascript
// En server.js - agregar endpoint para servir logo
app.get('/logo/godex', (req, res) => {
    res.sendFile(path.join(__dirname, 'founds/godex/LOGO.png'));
});
```

#### **Opción 3: Texto Estilizado (Temporal)**
Actualmente implementado en `renderPreviewRotulado()`:
```javascript
ctx.fillStyle = '#2563eb'; // Azul Camitex
ctx.font = 'bold 24px Arial';
ctx.fillText('CAMITEX', canvas.width / 2, 20);
ctx.font = '12px Arial';
ctx.fillText('Ropa de Cama', canvas.width / 2, 38);
```

## 🔧 Implementación en Código

### 1. Vista Previa (Listo ✅)
Archivo: `public/costurera-dashboard.html`
Función: `renderPreviewRotulado(isEspecial)`

### 2. Generación ZPL para Godex (Pendiente)
Archivo: `server.js`
Función a crear: `generarRotuladoZPL(data)`

```javascript
function generarRotuladoZPL(data) {
    const { nombre_producto, modelo, unidad_medida, empresa } = data;
    
    let zpl = `^XA
^PW236
^LL394
^LH0,0

// === LOGO CAMITEX ===
// Aquí irá el logo convertido ^GFA o texto temporal

// === NOMBRE PRODUCTO ===
^CF0,28
^FO118,70^FB200,3,0,C^FD${nombre_producto}^FS

// === MODELO ===
^CF0,20
^FO118,150^FB200,1,0,C^FD${modelo}^FS

// === TALLA/MEDIDA ===
^CF0,32
^FO118,200^FB200,1,0,C^FD${unidad_medida}^FS

// === ORIGEN ===
^CF0,22
^FO118,260^FB200,1,0,C^FD${empresa}^FS

^XZ`;
    
    return zpl;
}
```

### 3. Integración con Cola de Impresión
```javascript
// En la creación de solicitud, agregar rotulado a cola_impresion
if (usar_godex) {
    const zplRotulado = generarRotuladoZPL({
        nombre_producto,
        modelo,
        unidad_medida,
        empresa
    });
    
    await insertarEnColaImpresion({
        tipo: 'rotulado',
        zpl: zplRotulado,
        impresora: 'GODEX_G530',
        prioridad: prioridad
    });
}
```

## 📋 Configuración en system.config (Listo ✅)

```ini
[GODEX_CONFIG]
MODEL=G530
PRINTER_IP=192.168.1.35
PORT_NUMBER=9100
DPI=203
WIDTH_MM=30
HEIGHT_MM=50
```

## 🚀 Plan de Implementación

### Fase 1: Encabezado Básico (Actual)
- ✅ Dimensiones definidas (3cm × 5cm)
- ✅ Vista previa implementada
- ✅ Límite de caracteres actualizado (28 por línea)
- ⏳ Logo en formato ZPL
- ⏳ Generación ZPL para Godex
- ⏳ Integración con cola de impresión

### Fase 2: Rotulado Completo (Futuro)
- 📅 Altura 10cm (doblado)
- 📅 Cara delantera: Encabezado producto
- 📅 Cara trasera: Instrucciones lavado + composición
- 📅 Iconos de cuidado textil
- 📅 Información de composición de tela

## 🎯 Próximos Pasos

1. **Convertir logo CAMITEX a ZPL:**
   - Usar herramienta online
   - Guardar código hexadecimal
   - Probar en impresora Godex

2. **Crear función `generarRotuladoZPL()`:**
   - En `server.js`
   - Usar logo convertido
   - Adaptar posiciones según pruebas

3. **Probar impresión:**
   - Imprimir rotulado de prueba
   - Ajustar posiciones y tamaños
   - Validar legibilidad

4. **Integrar con sistema:**
   - Agregar opción para imprimir rotulado
   - Agregar a cola de impresión automática
   - Configurar cuándo usar Zebra vs Godex

## 📝 Notas Importantes

- **Orientación:** Portrait (vertical)
- **Color:** Monocromo (negro sobre blanco)
- **Fuente recomendada ZPL:** Font 0 (Zebra default)
- **Alineación:** Centrada para mejor legibilidad
- **Márgenes:** 5-10 dots de cada lado

