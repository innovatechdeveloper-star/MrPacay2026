# 🎨 SISTEMA DE ETIQUETAS ADAPTATIVAS - Ejemplos Visuales

## 📐 Lógica de Adaptación del Texto

El sistema ajusta automáticamente el **tamaño de las letras del NOMBRE** según cuántos campos adicionales están activos:

---

## 🎯 CASO 1: SOLO NOMBRE + EMPRESA (Letras Gigantes)

**Configuración:**
- ✅ NOMBRE
- ❌ QR
- ❌ ID
- ❌ UNIDAD
- ❌ MODELO
- ✅ EMPRESA

**Resultado en etiqueta:**
```
╔═══════════════════════════╗
║                           ║
║   ALMOHADA KING          ║  ← LETRA TAMAÑO 70
║   JUMBO                  ║  ← LETRA TAMAÑO 70
║                           ║
║                           ║
║                           ║
║                           ║
║   HECHO EN PERU          ║  ← LETRA TAMAÑO 22
║                           ║
╚═══════════════════════════╝
```

**Especificaciones:**
- Tamaño fuente nombre: **70 puntos** (203 DPI) / **100 puntos** (300 DPI)
- Máximo caracteres por línea: **12**
- Altura de línea: **80/110 puntos**
- Uso: Productos grandes con nombres cortos y descriptivos

---

## 🎯 CASO 2: NOMBRE + 1-2 CAMPOS (Letras Grandes)

**Configuración Ejemplo A:**
- ✅ NOMBRE
- ❌ QR
- ❌ ID
- ✅ UNIDAD
- ❌ MODELO
- ✅ EMPRESA

**Resultado en etiqueta:**
```
╔═══════════════════════════╗
║                           ║
║   ALMOHADA KING          ║  ← LETRA TAMAÑO 50
║   JUMBO                  ║  ← LETRA TAMAÑO 50
║                           ║
║   UM: UNIDAD             ║  ← LETRA TAMAÑO 24
║                           ║
║   HECHO EN PERU          ║  ← LETRA TAMAÑO 22
║                           ║
╚═══════════════════════════╝
```

**Especificaciones:**
- Tamaño fuente nombre: **50 puntos** (203 DPI) / **70 puntos** (300 DPI)
- Máximo caracteres por línea: **15**
- Altura de línea: **60/80 puntos**
- Uso: Balance entre legibilidad y espacio para datos adicionales

---

## 🎯 CASO 3: NOMBRE + 3+ CAMPOS (Letras Medianas)

**Configuración:**
- ✅ NOMBRE
- ❌ QR
- ✅ ID
- ✅ UNIDAD
- ✅ MODELO
- ✅ EMPRESA

**Resultado en etiqueta:**
```
╔═══════════════════════════╗
║                           ║
║ ALMOHADA KING JUMBO      ║  ← LETRA TAMAÑO 40
║                           ║
║ MODELO: KING             ║  ← LETRA TAMAÑO 32
║ UM: UNIDAD               ║  ← LETRA TAMAÑO 24
║ ID: 000193               ║  ← LETRA TAMAÑO 24
║                           ║
║ HECHO EN PERU            ║  ← LETRA TAMAÑO 22
║                           ║
╚═══════════════════════════╝
```

**Especificaciones:**
- Tamaño fuente nombre: **40 puntos** (203 DPI) / **60 puntos** (300 DPI)
- Máximo caracteres por línea: **20**
- Altura de línea: **45/65 puntos**
- Uso: Etiquetas completas con toda la información

---

## 🎯 CASO 4: CON QR (Plantilla DEFAULT)

**Configuración:**
- ✅ NOMBRE
- ✅ QR
- ✅ ID
- ✅ UNIDAD
- ✅ MODELO
- ✅ EMPRESA

**Resultado en etiqueta:**
```
╔═══════════════════════════╗
║ ████████          ALMO    ║  ← QR + NOMBRE
║ ████████          HADA    ║
║ ████████          KING    ║
║ ████████                  ║
║ ████████  MODELO: KING    ║  ← Datos adicionales
║ ████████  UM: UNIDAD      ║
║ ████████  ID: 000193      ║
║           HECHO EN PERU   ║
╚═══════════════════════════╝
```

**Nota:** El QR **siempre debe ir acompañado de texto**. No puede estar solo.

---

## 📊 Tabla Comparativa de Tamaños

| Modo | Campos Activos | Tamaño Nombre (203 DPI) | Tamaño Nombre (300 DPI) | Chars/Línea | Uso Ideal |
|------|----------------|-------------------------|-------------------------|-------------|-----------|
| **MINIMALISTA** | 0-1 (solo NOMBRE) | 70 pt | 100 pt | 12 | Productos grandes, nombres cortos |
| **REDUCIDO** | 2-3 campos | 50 pt | 70 pt | 15 | Balance visual |
| **COMPLETO** | 4+ campos | 40 pt | 60 pt | 20 | Máxima información |
| **CON QR** | Variable | 24 pt | 36 pt | Variable | Etiquetas con QR |

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Minimalista Extremo
```
Producto: ALMOHADA
Config: Solo NOMBRE + EMPRESA
Resultado esperado: Letras gigantes, 2 líneas máximo
```

### Prueba 2: Nombres Largos
```
Producto: ALMOHADA KING JUMBO SUPER SUAVE
Config: Solo NOMBRE + EMPRESA  
Resultado esperado: Se divide en 4 líneas con letras grandes
```

### Prueba 3: Gradual
```
Producto: CUELLERA
1. Solo NOMBRE → letras 70pt
2. + UNIDAD → letras 50pt  
3. + MODELO + ID → letras 40pt
```

---

## 🎯 Validaciones Implementadas

### ✅ Validación 1: QR no puede estar solo
```
❌ QR=ON, todos los demás=OFF
→ Alerta: "El código QR debe ir acompañado de al menos un campo de texto"
```

### ✅ Validación 2: Debe haber al menos un campo de texto
```
❌ Solo QR o solo EMPRESA activos
→ Alerta: "Debe haber al menos un campo de texto activo"
```

### ✅ Validación 3: Textos adaptativos
```
✅ Cuantos menos campos → letras más grandes
✅ Cuantos más campos → letras más pequeñas pero todo visible
```

---

## 📝 Logs de Debugging

Al imprimir, busca estas líneas en la terminal:

```
📊 [generateTextOnlyZPL] Campos activos (además de NOMBRE): 0
🎯 [generateTextOnlyZPL] MODO MINIMALISTA: Solo NOMBRE + EMPRESA (letras gigantes)
📝 [generateTextOnlyZPL] Nombre dividido en 2 líneas: ['ALMOHADA KING', 'JUMBO']
```

O:

```
📊 [generateTextOnlyZPL] Campos activos (además de NOMBRE): 2
🎯 [generateTextOnlyZPL] MODO REDUCIDO: NOMBRE + 2 campos
📝 [generateTextOnlyZPL] Nombre dividido en 2 líneas: ['ALMOHADA', 'KING JUMBO']
```

---

## 🚀 Comandos de Prueba

1. **Reinicia el servidor:**
   ```cmd
   taskkill /F /IM node.exe
   node server.js
   ```

2. **Edita un producto (ej: ALMOHADA ID=181):**
   - Desactiva QR ❌
   - Desactiva ID ❌
   - Desactiva UNIDAD ❌
   - Desactiva MODELO ❌
   - Deja solo NOMBRE ✅ y EMPRESA ✅

3. **Crea solicitud y aprueba**

4. **Verifica en terminal:**
   ```
   🎯 [generateTextOnlyZPL] MODO MINIMALISTA: Solo NOMBRE + EMPRESA (letras gigantes)
   ```

5. **Verifica etiqueta impresa:**
   - Letras MUY GRANDES
   - 2-3 líneas máximo
   - "HECHO EN PERU" al final

---

## 🎨 Tips de Diseño

**Para nombres cortos (1-2 palabras):**
- Usar MODO MINIMALISTA
- Letras gigantes muy legibles
- Perfecto para almacenes

**Para nombres largos (3-4 palabras):**
- Usar MODO REDUCIDO
- Agregar UNIDAD o MODELO
- Balance entre info y legibilidad

**Para productos con mucha info:**
- Usar MODO COMPLETO
- Todos los campos activos
- Máxima información en espacio limitado

---

**¿Todo claro? Ahora reinicia el servidor y comienza las pruebas! 🚀**
