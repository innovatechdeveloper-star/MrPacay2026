# 📋 CONFIGURACIÓN FINAL - ROTULADO GODEX G530

**Fecha:** 3 de diciembre de 2025  
**Impresora:** Godex G530 (300 DPI)  
**Dimensiones:** 30mm × 70mm (3.0cm × 7.0cm)  
**Archivo:** `server.js` - Función `generarRotuladoZPL()`

---

## 🎯 OBJETIVO

Configurar etiquetas de rotulado con:
- Márgenes de 1cm arriba y abajo para zona de costura
- Distribución equilibrada: 2.5cm para datos superiores y 2.5cm para iconos/barcode inferiores
- Soporte para modo con guillotina (^MMC) y sin guillotina (^MNN)
- Altura constante de 7.0cm (826 dots) en ambos modos

---

## 📐 ESPECIFICACIONES TÉCNICAS

### Dimensiones de Etiqueta
```
Ancho:  30mm = 3.0cm = 354 dots
Alto:   70mm = 7.0cm = 826 dots
DPI:    300 (11.811 dots/mm o 118.11 dots/cm)
```

### Conversión dots ↔ cm
```
1cm = 10mm = 118.11 dots
1mm = 11.811 dots
```

---

## 🗺️ DISTRIBUCIÓN DE ZONAS

```
┌────────────────────────────────┐
│  COSTURA SUPERIOR (1cm)        │ 118 dots
│  Espacio en blanco             │
├────────────────────────────────┤
│  🔷 LOGO (1.2cm alto)          │ Y=130
│  📝 PRODUCTO (línea 1)         │ Y=270
│  📝 PRODUCTO (línea 2)*        │ Y=310
│  🧵 TELA: TIPO                 │ Y=325/350
│  📏 MODELO: TAMAÑO             │ Y=360/385
│  🏢 EMPRESA                    │ Y=395/420
│                                │
│  ÁREA SUPERIOR (2.5cm)         │ 295 dots
├────────────────────────────────┤
│                                │
│  ⚠️  ICONOS ADVERTENCIA        │ Y=418
│  🏔️  LOGO MISTI (opcional)     │ Y=433
│  📊 CÓDIGO DE BARRAS           │ Y=653
│                                │
│  ÁREA INFERIOR (2.5cm)         │ 295 dots
├────────────────────────────────┤
│  COSTURA INFERIOR (1cm)        │ 118 dots
│  Espacio en blanco             │
└────────────────────────────────┘
      TOTAL: 7.0cm (826 dots)
```

*Producto línea 2 solo si el texto excede 18 caracteres

---

## 🔧 CONFIGURACIÓN DE MÁRGENES

```javascript
const ALTURA_LABEL = 826;          // 7.0cm (70mm) SIEMPRE
const MARGEN_SUPERIOR = 118;       // 1.0cm (10mm) - zona de costura superior
const MARGEN_INFERIOR = 118;       // 1.0cm (10mm) - zona de costura inferior
const AREA_SUPERIOR = 295;         // 2.5cm (25mm) - datos del producto
const AREA_INFERIOR = 295;         // 2.5cm (25mm) - iconos y barcode
```

---

## 📍 POSICIONES Y (en dots)

### Sección Superior - Datos del Producto
```javascript
Y_LOGO         = 130    // 1.10cm - Logo principal (ajustado +12 dots)
Y_PRODUCTO_1   = 270    // 2.29cm - Nombre producto línea 1
Y_PRODUCTO_2   = 310    // 2.62cm - Nombre producto línea 2 (opcional)
Y_TELA         = 325/350 // 2.75cm/2.96cm - Tipo de tela (BP, TC, etc)
Y_MODELO       = 360/385 // 3.05cm/3.26cm - Tamaño (King, Queen, etc)
Y_HECHO_PERU   = 395/420 // 3.34cm/3.56cm - Empresa/País fabricación
```

### Sección Inferior - Iconos y Barcode
```javascript
Y_ICONOS_1     = 418    // 3.54cm - Primera fila iconos advertencia
Y_ICONOS_2     = 518    // 4.38cm - Segunda fila iconos advertencia
Y_MISTI        = 433    // 3.67cm - Logo MISTI (cuando está activado)
Y_BARCODE      = 653    // 5.53cm - Código de barras (posición fija)
```

---

## 🔪 MODOS DE CORTE

### Sin Guillotina (Modo Tear-off)
```zpl
^MNN          // Media Mode No-cut
^LL826        // Label Length 826 dots (7.0cm)
```

### Con Guillotina (Modo Cutter)
```zpl
^MMC          // Media Mode Cutter
^LL826        // Label Length 826 dots (7.0cm - MISMO TAMAÑO)
```

**IMPORTANTE:** La altura es **siempre 826 dots** independientemente del modo de corte. El comando `^MMC` solo activa la guillotina, no cambia las dimensiones.

---

## 🎨 OPCIONES DINÁMICAS

### Logos Principales Disponibles
```javascript
logoPrincipal: 'camitex'           // Logo Camitex (319×123 dots)
logoPrincipal: 'algodon_100'       // 100% Algodón (319×120 dots)
logoPrincipal: 'maxima_suavidad'   // Máxima Suavidad V2 (319×122 dots)
logoPrincipal: 'producto_peruano'  // Producto Peruano (319×122 dots)
logoPrincipal: 'arequipeno'        // Producto Arequipeño (319×122 dots)
logoPrincipal: 'sin_logo'          // Sin logo principal
```

### Opciones de Visualización
```javascript
conIconos: true/false       // Mostrar iconos advertencia (4 iconos pequeños)
conLogoMisti: true/false    // Mostrar logo MISTI (15mm × 15mm)
conCorte: true/false        // Activar guillotina automática
```

### Lógica Condicional de Logos
```
SI conLogoMisti = false:
  → Mostrar 2 logos grandes de advertencia (14.5mm × 14.5mm)
    • LAVAR_MAX (176×172 dots)
    • NO_PLANCHAR_V5 (168×172 dots)

SI conLogoMisti = true:
  → Configuración estándar
    • 4 iconos pequeños (opcional con conIconos)
    • Logo MISTI (177×177 dots)
```

---

## 📊 ESTRUCTURA DEL CÓDIGO DE BARRAS

### Formato
```
codigo_producto-id_solicitud
```

### Procesamiento
1. Se elimina el primer "0" del código de producto si existe
2. Se concatena con el ID de solicitud
3. Ejemplo: `010011` + `332` → `10011-332`

### Especificaciones ZPL
```zpl
^BY1.5                    // Módulo width 1.5
^BCN,55,N,N              // Code 128, altura 55 dots, sin interpretación
^FD10011-332^FS          // Field Data con el código
```

---

## 🖨️ EJEMPLO DE ZPL GENERADO

```zpl
^XA
^MMC                      // Modo con corte (o ^MNN sin corte)
^PW354                    // Page Width 354 dots (30mm)
^LL826                    // Label Length 826 dots (70mm)
^LH0,0                    // Label Home posición 0,0
^LS0                      // Label Shift 0

^FO20,130                 // Field Origin - Logo en X=20, Y=130
^GFA,4880,4880,40,...     // Graphics Field - Logo MAXIMA SUAVIDAD

^CF0,35                   // Change Font - tamaño 35
^FO0,270^FB320,1,0,C      // Field Origin + Field Block (centrado)
^FDSABANA^FS              // Field Data - Nombre producto

^CF0,25                   // Change Font - tamaño 25
^FO0,325^FB320,1,0,C
^FDTELA: BP^FS

^FO0,360^FB320,1,0,C
^FDMODELO: QUEEN^FS

^CF0,22                   // Change Font - tamaño 22
^FO0,395^FB320,1,0,C
^FDHECHO EN PERU^FS

^FO2,418                  // Logos grandes de advertencia
^GFA,3784,3784,22,...     // LAVAR_MAX

^FO184,418
^GFA,3612,3612,21,...     // NO_PLANCHAR_V5

^FO40,653                 // Código de barras (Y ajustado sin logo Misti)
^BY1.5^BCN,55,N,N
^FD10011-332^FS

^XZ                       // End Format
```

---

## 📝 DATOS DE ENTRADA

### Campos Requeridos
```javascript
{
  subcategoria: 'SABANA',           // Tipo de producto
  marca: 'BP',                      // Tipo de tela
  modelo: 'QUEEN',                  // Tamaño/modelo
  codigo_producto: '010011',        // Código para barcode
  unidad_medida: 'UNIDAD',          // Unidad de medida
  id_solicitud: 332,                // ID de solicitud
  empresa: 'HECHO EN PERU'          // Empresa/país
}
```

### Opciones de Impresión
```javascript
{
  logoPrincipal: 'maxima_suavidad',  // Logo a usar
  conIconos: true,                    // Mostrar iconos
  conLogoMisti: false,                // Sin logo MISTI
  conCorte: true                      // Con guillotina
}
```

---

## 🔍 LOGS DE DEBUG

El sistema genera logs detallados con cada impresión:

```
╔═══════════════════════════════════════════════════════════════╗
║  🖨️  GODEX G530 - CONFIGURACIÓN DE IMPRESIÓN ROTULADO         ║
╠═══════════════════════════════════════════════════════════════╣
║  📏 DIMENSIONES ETIQUETA:                                      ║
║     • Ancho: 354 dots (30mm / 3.0cm)                          ║
║     • Alto: 826 dots (69.9mm / 7.0cm)                         ║
║  🔪 MODO DE CORTE:                                             ║
║     • Guillotina: ✅ ACTIVADA (^MMC)                           ║
║  📐 MÁRGENES:                                                  ║
║     • Superior: 118 dots (10.0mm / 1.0cm)                     ║
║     • Inferior: 118 dots (10.0mm / 1.0cm)                     ║
║     • Área superior: 295 dots (2.5cm) - Datos arriba          ║
║     • Área inferior: 295 dots (2.5cm) - Iconos/Barcode        ║
║     • 🔄 DOBLEZ: 413 dots (3.5cm) - Mitad exacta              ║
║  📍 POSICIONES Y (en dots y cm):                               ║
║     • Logo:        Y=130 (1.10cm)                             ║
║     • Producto 1:  Y=270 (2.29cm)                             ║
║     • Tela:        Y=325 (2.75cm)                             ║
║     • Modelo:      Y=360 (3.05cm)                             ║
║     • Empresa:     Y=395 (3.34cm)                             ║
║     • Iconos 1:    Y=418 (3.54cm)                             ║
║     • Barcode:     Y=653 (5.53cm)                             ║
║  📦 DATOS:                                                     ║
║     • Producto: SABANA                                         ║
║     • Tela: BP                                                 ║
║     • Modelo: QUEEN                                            ║
║     • Barcode: 10011-332                                       ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🚀 ENDPOINTS DE IMPRESIÓN

### 1. Impresión Directa
```http
POST /api/print/rotulado
Content-Type: application/json

{
  "codigo_producto": "010011",
  "cantidad": 1,
  "conCorte": true,
  "logoPrincipal": "maxima_suavidad",
  "conLogoMisti": false,
  "conIconos": true
}
```

### 2. Crear Solicitud (con auto-impresión)
```http
POST /api/solicitudes/rotulado
Content-Type: application/json

{
  "id_producto": 19,
  "cantidad": 1,
  "observaciones": "",
  "id_usuario": 1,
  "conCorte": true
}
```

### 3. Reimprimir desde Registro
```http
POST /api/registros/:id/imprimir-rotulado
Content-Type: application/json

{
  "conCorte": true
}
```

---

## ⚙️ CONFIGURACIÓN DE CONEXIÓN

```javascript
const GODEX_CONFIG = {
    IP: '192.168.1.35',
    PORT: 9100,
    MODEL: 'Godex G530',
    TIMEOUT: 15000  // 15 segundos para gráficos pesados
};
```

### Función de Envío
```javascript
function enviarZPLAGodex(zplData, ip, port) {
    // Conexión TCP directa
    // Timeout: 15s para procesamiento de gráficos
    // Espera 500ms antes de cerrar socket
}
```

---

## 📌 NOTAS IMPORTANTES

### Cambios Principales Implementados
1. ✅ **Altura constante:** 826 dots en ambos modos (con/sin corte)
2. ✅ **Márgenes reducidos:** De 1.5cm a 1.0cm (177→118 dots)
3. ✅ **Distribución equilibrada:** 2.5cm arriba + 2.5cm abajo
4. ✅ **Ajuste de posiciones:** +12 dots en sección superior
5. ✅ **Logs detallados:** Debug completo con todas las posiciones

### Problemas Resueltos
- ❌ **ANTES:** 7.5cm con offset de 60 dots causaba 2cm de margen superior
- ❌ **ANTES:** Altura variable (826 vs 886) según modo de corte
- ❌ **ANTES:** Código de barras solapado con iconos
- ✅ **AHORA:** 7.0cm constante, márgenes 1cm, posiciones balanceadas

### Consideraciones Técnicas
- La etiqueta NO se dobla (confirmado por usuario)
- Logos dinámicos cargados desde `/logos_dinamicos/*.js`
- Compatibilidad con emulación ZPL en Godex G530
- Auto-print cuando `auto_servicesgd = true`

---

## 📂 ARCHIVOS RELACIONADOS

```
mi-app-etiquetas/
├── server.js                          # Función generarRotuladoZPL()
├── logos_dinamicos/
│   ├── logo-misti-zpl-generado.js     # Logo MISTI
│   ├── logo-maxima-suavidad-v2-zpl.js # Logo Máxima Suavidad
│   ├── logo-algodon-100-zpl.js        # Logo 100% Algodón
│   ├── logo-producto-peruano-zpl.js   # Logo Producto Peruano
│   ├── logo-producto-arequipeno-zpl.js # Logo Arequipeño
│   ├── icono-lavado-30-zpl.js         # Icono lavado 30°
│   ├── icono-no-lejia-zpl.js          # Icono no lejía
│   ├── icono-planchar-baja-zpl.js     # Icono planchar baja
│   ├── icono-secadora-baja-zpl.js     # Icono secadora baja
│   ├── logo-lavar-max-zpl.js          # Logo grande lavar máx
│   └── logo-no-planchar-v5-zpl.js     # Logo grande no planchar
└── CONFIGURACION-ROTULADO-GODEX-FINAL.md  # Este archivo
```

---

## 🔄 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Valor Anterior | Valor Nuevo |
|-------|--------|----------------|-------------|
| 03/12/2025 | Altura etiqueta | 886 dots (variable) | 826 dots (constante) |
| 03/12/2025 | Margen superior | 177 dots (1.5cm) | 118 dots (1.0cm) |
| 03/12/2025 | Margen inferior | 177 dots (1.5cm) | 118 dots (1.0cm) |
| 03/12/2025 | Offset corte | 60 dots | 0 dots (eliminado) |
| 03/12/2025 | Y_LOGO | 177 | 130 (+12 ajuste) |
| 03/12/2025 | Y_BARCODE | 594 | 653 |
| 03/12/2025 | Distribución | Comprimida 4cm | Balanceada 2.5+2.5cm |

---

## ✅ VERIFICACIÓN FINAL

### Checklist de Validación
- [x] Altura 7.0cm (826 dots) en ambos modos
- [x] Márgenes 1cm arriba y abajo
- [x] Logo inicia en Y=130
- [x] Código de barras en Y=653 sin solapamiento
- [x] Logs detallados funcionando
- [x] Prueba física realizada
- [x] Documentación completa

### Mediciones Físicas Esperadas
```
┌─────────────┐
│ 1.0cm       │ Blanco superior (costura)
├─────────────┤
│ 2.5cm       │ Logo + Datos producto
├─────────────┤
│ 2.5cm       │ Iconos + Barcode
├─────────────┤
│ 1.0cm       │ Blanco inferior (costura)
└─────────────┘
  7.0cm TOTAL
```

---

**Documentación generada:** 3 de diciembre de 2025  
**Versión del sistema:** 2.5  
**Estado:** ✅ VALIDADO Y EN PRODUCCIÓN
