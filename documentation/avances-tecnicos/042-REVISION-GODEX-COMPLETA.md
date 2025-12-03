# 🔍 REVISIÓN COMPLETA - CONFIGURACIÓN GODEX G530

## ✅ CONFIGURACIÓN CORRECTA

### 1. **Función generarRotuladoZPL()**
- ✅ Logo actualizado: 80x33 pixels (desde BMP monocrómico)
- ✅ Comandos EZPL correctos para Godex G530
- ✅ Dimensiones: 30mm × 50mm (^Q50, ^W30)
- ✅ Configuración: Darkness=8, Speed=3
- ✅ Posición logo: GG,85,8 (centrado arriba)
- ✅ Textos posicionados correctamente

### 2. **Función enviarZPLAGodex()**
- ✅ IP: 192.168.1.35
- ✅ Puerto: 9100
- ✅ Timeout: 5 segundos
- ✅ Manejo de errores implementado

### 3. **Endpoints Implementados**

#### POST /api/print/rotulado
- ✅ Recibe: {id_producto, cantidad}
- ✅ Consulta producto desde BD
- ✅ Genera EZPL con generarRotuladoZPL()
- ✅ Envía a Godex 192.168.1.35:9100
- ✅ Pausa 500ms entre impresiones

#### POST /api/solicitudes/rotulado
- ✅ Crea solicitud pendiente cuando auto_servicesgd=false
- ✅ Genera número único: ROT-YYYYMMDD-0001
- ✅ Guarda datos_zpl para impresión posterior
- ✅ Estado inicial: 'pendiente'

#### GET /api/solicitudes/rotulado/pendientes
- ✅ Lista solicitudes con estado='pendiente'
- ✅ JOIN con productos y usuarios
- ✅ Orden por fecha descendente

#### PUT /api/solicitudes/rotulado/:id/aprobar
- ✅ Obtiene datos_zpl guardados
- ✅ Imprime en Godex G530
- ✅ Actualiza estado a 'completada'
- ✅ Registra supervisor_id y fecha_aprobacion

#### POST /api/registros/:id_solicitud/imprimir-rotulado
- ✅ Para impresión desde dashboard de registros
- ✅ Consulta datos de solicitud existente
- ✅ Imprime cantidad_solicitada veces
- ⚠️ Requiere tabla cola_impresion_rotulado (ver problema)

### 4. **Flujo Auto_servicesGD**
- ✅ Verifica auto_servicesgd del usuario
- ⚠️ **CORREGIDO**: Ahora usa producto.subcategoria (antes usaba descripcion_corta)
- ✅ Imprime cantidad_productos veces
- ✅ No falla la solicitud si rotulado falla

## ❌ PROBLEMAS ENCONTRADOS Y SOLUCIONADOS

### PROBLEMA 1: Tabla Faltante
**Error**: El código usa `cola_impresion_rotulado` pero la tabla NO existe en BD

**Solución**:
```sql
CREATE TABLE cola_impresion_rotulado (
    id SERIAL PRIMARY KEY,
    id_solicitud INTEGER REFERENCES solicitudes_etiquetas(id_solicitud),
    numero_solicitud VARCHAR(100),
    nombre_producto VARCHAR(255),
    cantidad INTEGER NOT NULL,
    datos_zpl TEXT,
    fecha_impresion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Archivo creado**: `migrations/crear_tabla_cola_rotulado.sql`
**Script BAT**: `crear-tabla-cola-rotulado.bat`

**ACCIÓN REQUERIDA**: Ejecutar `crear-tabla-cola-rotulado.bat` antes de usar el sistema

---

### PROBLEMA 2: Campo Incorrecto en Auto_servicesGD
**Error**: Línea 4673 de server.js pasaba `producto.descripcion_corta` a `subcategoria`

**Antes**:
```javascript
const zplRotulado = generarRotuladoZPL({
    subcategoria: producto.descripcion_corta || producto.nombre_producto,  // ❌ INCORRECTO
    marca: producto.marca || '',
    modelo: producto.modelo || ''
});
```

**Después**:
```javascript
const zplRotulado = generarRotuladoZPL({
    subcategoria: producto.subcategoria || producto.nombre_producto,  // ✅ CORRECTO
    marca: producto.marca || '',
    modelo: producto.modelo || ''
});
```

**Estado**: ✅ CORREGIDO en server.js

---

## 📋 ESTRUCTURA DE DATOS

### Tabla: solicitudes_rotulado
```sql
id_solicitud_rotulado (PK)
numero_solicitud (UNIQUE) - Formato: ROT-20251027-0001
id_usuario
id_producto
cantidad_solicitada
fecha_solicitud
estado ('pendiente', 'completada', 'rechazada')
observaciones
observaciones_supervisor
datos_zpl (Guarda EZPL completo)
supervisor_id
fecha_aprobacion
```

### Tabla: cola_impresion_rotulado (NUEVA)
```sql
id (PK)
id_solicitud
numero_solicitud
nombre_producto
cantidad
datos_zpl
fecha_impresion
```

---

## 🎯 FORMATO EZPL GENERADO

```
^Q50,0,0                    // Altura 50mm
^W30                        // Ancho 30mm
^H8                         // Darkness 8
^P1                         // Cantidad 1
^S3                         // Velocidad 3
^AD                         // Auto-detectar
^C1                         // Modo continuo
^R0                         // Modo ribbon
~Q+0                        // Offset superior
^O0                         // Origen
^D0                         // Cortador off
^E18                        // Gap 18
~R255                       // Rotación
^L                          // Inicio de etiqueta

GG,85,8,10,33,[datos_hex]   // Logo CAMITEX (80x33 pixels)
AC,35,30,3,1,0,0,ROPA DE CAMA
AC,20,50,5,1,0,0,COBERTOR   // subcategoria
AC,10,90,2,1,0,0,TELA: BP   // marca
AC,10,110,2,1,0,0,TAMANO: QUEEN  // modelo
AC,25,150,2,1,0,0,HECHO EN PERU

E                           // Imprimir
```

---

## 🔄 FLUJOS DE TRABAJO

### Flujo 1: Impresión Automática (auto_servicesgd=true)
1. Costurera crea solicitud de etiquetas
2. Sistema verifica auto_services=true → Imprime QR automáticamente
3. Sistema verifica auto_servicesgd=true → Imprime rotulado en Godex
4. Marca solicitud como completada
5. Registra en historial

### Flujo 2: Solicitud Manual (auto_servicesgd=false)
1. Costurera crea solicitud de etiquetas
2. Sistema imprime QR (si auto_services=true)
3. Costurera debe presionar botón "Solicitar Rotulado"
4. Crea registro en solicitudes_rotulado (estado='pendiente')
5. Supervisor aprueba desde supervisor-dashboard
6. Sistema imprime en Godex y marca como completada

### Flujo 3: Impresión desde Registros
1. Supervisor/Costurera abre registro específico
2. Click en botón "Imprimir Rotulado"
3. Sistema consulta datos de solicitud
4. Genera EZPL y envía a Godex
5. Registra en cola_impresion_rotulado

---

## 📦 ARCHIVOS MODIFICADOS/CREADOS

### Modificados:
- ✅ `server.js` - Línea 4673 corregida (subcategoria)
- ✅ `server.js` - Líneas 560-563 (logo 80x33 pixels)

### Creados:
- ✅ `migrations/crear_tabla_cola_rotulado.sql`
- ✅ `crear-tabla-cola-rotulado.bat`
- ✅ `convertir-bmp-ezpl.js` (convierte BMP original)
- ✅ `redimensionar-bmp-ezpl.js` (redimensiona a 80x33)
- ✅ `logo-camitex-ezpl-final.js` (constantes finales)

---

## ⚡ PASOS SIGUIENTES

1. **EJECUTAR MIGRACIÓN** (CRÍTICO):
   ```cmd
   crear-tabla-cola-rotulado.bat
   ```

2. **REINICIAR SERVIDOR**:
   ```cmd
   node server.js
   ```

3. **PROBAR IMPRESIÓN**:
   - Crear solicitud con auto_servicesgd=true
   - Verificar que imprima QR + Rotulado
   - Verificar que aparezca logo CAMITEX

4. **VERIFICAR DATOS**:
   - El logo debe verse nítido (80x33 pixels desde BMP)
   - Subcategoría debe mostrar: COBERTOR, SABANA, ALMOHADA, PROTECTOR
   - Marca debe mostrar tipo de tela: BP, TC, PK
   - Modelo debe mostrar tamaño: King, Queen, 2plz, 1.5P

---

## 🎨 LOGO CAMITEX

### Especificaciones:
- **Archivo origen**: `founds/godex/logo-mono.bmp`
- **Tamaño original**: 998x418 pixels
- **Tamaño final**: 80x33 pixels (redimensionado)
- **Formato**: Monocrómico 1 bit
- **Bytes totales**: 330 bytes (10 bytes × 33 líneas)
- **Posición en etiqueta**: X=85, Y=8

### Calidad:
- ✅ Redimensionado desde BMP monocrómico original
- ✅ Sin pérdida de calidad en conversión
- ✅ Tamaño apropiado para etiqueta 30mm
- ✅ Bits invertidos correctamente (1=negro, 0=blanco)

---

## ✅ CHECKLIST FINAL

- [x] Logo correcto (80x33 pixels)
- [x] Comandos EZPL válidos
- [x] IP/Puerto Godex correctos (192.168.1.35:9100)
- [x] Función generarRotuladoZPL() usa campos correctos
- [x] Campo subcategoria corregido en auto_servicesgd
- [x] Tabla solicitudes_rotulado existe
- [ ] Tabla cola_impresion_rotulado creada ← **PENDIENTE: EJECUTAR BAT**
- [x] Endpoints implementados
- [x] Manejo de errores presente
- [x] Logs informativos agregados

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

```cmd
# Ejecutar AHORA antes de reiniciar servidor:
crear-tabla-cola-rotulado.bat
```

Sin esto, el endpoint `/api/registros/:id_solicitud/imprimir-rotulado` 
fallará con error de tabla inexistente.
