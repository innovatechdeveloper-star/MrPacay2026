# 🔴 SOLUCIÓN: IMPRESORA GODEX EN ROJO

## ⚠️ Problema Común: Luz Roja en Impresora Godex G530

---

## 🔧 SOLUCIÓN RÁPIDA (90% de los casos):

### **Método 1: Calibración Automática**
```bash
# Ejecuta este archivo:
CALIBRAR-GODEX.bat
```

### **Método 2: Calibración Manual (Si falla el automático)**

1. **Apaga la impresora** (botón de encendido)
2. **Espera 10 segundos**
3. **Enciende la impresora**
4. **Presiona el botón FEED 3 veces seguidas**
   - El botón FEED está en el panel frontal
   - La impresora debe avanzar las etiquetas
5. **Espera a que la luz verde se encienda**

---

## 📋 Checklist de Verificación:

### ✅ **1. Etiquetas Correctamente Colocadas**
```
[Rollo de etiquetas]
     ↓
 [Guías laterales] ← AJUSTADAS (sin estar muy apretadas)
     ↓
 [Sensor] ← Debe pasar por encima del GAP (espacio entre etiquetas)
     ↓
 [Salida]
```

**Importante**: 
- Las etiquetas deben estar **RECTAS**
- El espacio entre etiquetas (GAP) debe ser **VISIBLE**
- Las guías laterales deben tocar los bordes sin apretar

### ✅ **2. Tapa Bien Cerrada**
- Escucha un "CLICK" al cerrar la tapa
- No debe tener espacio entre la tapa y el cuerpo

### ✅ **3. Nada Atascado**
- Abre la tapa y verifica que no haya papel atorado
- Limpia residuos de adhesivo si los hay

### ✅ **4. Ribbon (si aplica)**
- Si la impresora usa cinta (ribbon), verifica que no esté agotada
- El ribbon debe estar correctamente enrollado

---

## 🚨 Códigos de Error Godex:

| Luz       | Significado                    | Solución                          |
|-----------|--------------------------------|-----------------------------------|
| 🔴 Roja   | Sensor no detecta etiquetas    | Calibrar (FEED 3 veces)          |
| 🟠 Naranja| Papel agotado                  | Colocar nuevo rollo              |
| 🟡 Amarilla| Ribbon agotado (si aplica)    | Cambiar cinta                    |
| 🟢 Verde  | ✅ Lista para imprimir         | Todo OK                          |

---

## 🛠️ PASOS DETALLADOS DE CALIBRACIÓN:

### **Opción A: Desde el Sistema (Recomendado)**
```bash
# Ejecuta:
CALIBRAR-GODEX.bat

# O directamente:
node calibrar-godex.js
```

### **Opción B: Manualmente en la Impresora**

1. **Método FEED**:
   - Presiona FEED 3 veces (botón físico)
   - La impresora avanzará etiquetas automáticamente
   - Detectará el espacio entre etiquetas

2. **Método Power + FEED**:
   - Apaga la impresora
   - Mantén presionado FEED
   - Enciende la impresora (sin soltar FEED)
   - Suelta FEED cuando empiece a parpadear
   - Calibración automática iniciará

---

## 📐 CONFIGURACIÓN DE ETIQUETAS 3cm × 5cm:

```
Tamaño: 30mm × 50mm (3cm × 5cm)
Gap (espacio): 2-3mm
Orientación: Vertical
Tipo de sensor: GAP (transmisivo)
DPI: 203
```

---

## 🆘 Si NADA Funciona:

### **Problema Persistente**:
1. Verifica la IP: `192.168.1.35`
   ```bash
   ping 192.168.1.35
   ```

2. Verifica el puerto: `9100`
   ```bash
   telnet 192.168.1.35 9100
   ```

3. **Reset de Fábrica**:
   - Apaga la impresora
   - Mantén presionados FEED + PAUSE
   - Enciende la impresora
   - Suelta cuando veas parpadear
   - La impresora volverá a configuración de fábrica

---

## 💡 PREVENCIÓN:

### **Antes de Imprimir**:
- ✅ Verifica que las etiquetas estén rectas
- ✅ Ajusta las guías laterales
- ✅ Presiona FEED una vez para verificar avance
- ✅ Luz verde = Lista para imprimir

### **Después de Imprimir**:
- No dejes el rollo flojo
- Cierra la tapa siempre

---

## 📞 CONTACTO TÉCNICO:

**Godex Soporte Técnico**:
- Web: www.godexprinters.com
- Email: support@godex.com

**Distribuidor Local**:
- Busca distribuidor autorizado en Perú

---

## 🎯 RESUMEN RÁPIDO:

```
🔴 Luz Roja → Presiona FEED 3 veces → 🟢 Luz Verde
```

**Si no funciona**:
```
Apagar → Esperar 10s → Encender → FEED 3 veces
```

---

¡Listo! Con esto deberías solucionar el 95% de problemas de luz roja en Godex G530.
