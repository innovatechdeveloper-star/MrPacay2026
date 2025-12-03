# 🗂️ Reorganización de Archivos - Sistema Etiquetas v2.5

**Fecha:** 5 de noviembre de 2025  
**Motivo:** Limpieza y organización de archivos sueltos en raíz del proyecto

---

## 📋 Resumen de Cambios

### ✅ Archivos Organizados

**Total:** 34 archivos movidos de la raíz a carpetas organizadas

| Categoría | Cantidad | Destino |
|-----------|----------|---------|
| Logos ZPL (.js) | 11 | `logos_dinamicos/` |
| Scripts SQL | 4 | `base_data/` |
| Scripts BAT | 8 | `documentation/iniciadores/` |
| Documentación MD | 10 | `documentation/` |
| Archivos de prueba | 7 | `documentation/pruebas/` |

---

## 📂 Nueva Estructura

### 1. logos_dinamicos/ (NUEVA CARPETA)

**Archivos movidos:**
- ✅ `icono-lavado-30-zpl.js`
- ✅ `icono-no-lejia-zpl.js`
- ✅ `icono-planchar-baja-zpl.js`
- ✅ `icono-secadora-baja-zpl.js`
- ✅ `logo-algodon-100-zpl.js`
- ✅ `logo-lavar-max-zpl.js`
- ✅ `logo-maxima-suavidad-v2-zpl.js`
- ✅ `logo-misti-zpl-generado.js`
- ✅ `logo-no-planchar-v5-zpl.js`
- ✅ `logo-producto-arequipeno-zpl.js`
- ✅ `logo-producto-peruano-zpl.js`

**Cambios en código:**
- ✅ `server.js` líneas 695-711: Rutas actualizadas a `./logos_dinamicos/...`

---

### 2. base_data/ (actualizada)

**Archivos movidos:**
- ✅ `crear_base_datos.sql` (duplicado en raíz)
- ✅ `EJECUTAR-MIGRACION.sql` (duplicado en raíz)
- ✅ `MIGRACION-LOGO-PRINCIPAL.sql` (duplicado en raíz)
- ✅ `cambiar-logo-camitex.sql`

**Resultado:** Todos los scripts SQL centralizados en un solo lugar

---

### 3. documentation/iniciadores/ (actualizada)

**Archivos movidos:**
- ✅ `AGREGAR-A-INICIO-WINDOWS.bat`
- ✅ `EJECUTAR-SISTEMA-ETIQUETAS.bat`
- ✅ `iniciar_servidor.bat`
- ✅ `INSTALAR-BANDEJA.bat`
- ✅ `INSTALAR-EN-STARTUP.bat`
- ✅ `INSTALAR-EN-STARTUP.ps1`
- ✅ `INSTALAR-SISTEMA-BANDEJA.bat`
- ✅ `INSTALAR-SISTEMA-GRAFICO.bat`

**Nota:** Archivos históricos o duplicados de instaladores antiguos

---

### 4. documentation/ (actualizada)

**Archivos movidos:**
- ✅ `COMO-EJECUTAR-AHORA.md`
- ✅ `CORRECCION-ERRORES-500-EXPORT.md`
- ✅ `GUIA-RAPIDA-BANDEJA.md`
- ✅ `INSTRUCCIONES-SHELL-STARTUP.md`
- ✅ `MEJORAS-ADMIN-IMPLEMENTADAS.md`
- ✅ `MEJORAS-DINAMICAS-SUGERIDAS.md`
- ✅ `ORGANIZACION-BOTONES-FLOTANTES.md`
- ✅ `README-BANDEJA.md`
- ✅ `RESUMEN-IMPLEMENTACION-BANDEJA.md`
- ✅ `RESUMEN-STARTUP.md`

**Resultado:** Documentación técnica e histórica consolidada

---

### 5. documentation/pruebas/ (actualizada)

**Archivos movidos:**
- ✅ `test-godex-simple.js`
- ✅ `calibrar.zpl`
- ✅ `convertir-maxima-suavidad-v2.js`
- ✅ `convertir-no-planchar-v5.js`
- ✅ `convertir-producto-arequipeno.js`
- ✅ `captura-golabel-1.bin`
- ✅ `captura-golabel-1.hex`

**Resultado:** Scripts de prueba y conversión organizados

**⚠️ Nota:** `logger.js` se mantuvo en raíz porque es requerido por `server.js` (línea 15)

---

## 📄 Archivos que permanecen en raíz

Estos archivos **deben** estar en la raíz para funcionamiento correcto:

### Archivos esenciales:
- ✅ `server.js` - Servidor principal
- ✅ `package.json` - Dependencias Node.js
- ✅ `package-lock.json` - Lock de versiones
- ✅ `config.json` - Configuración del servidor
- ✅ `logger.js` - Sistema de logging (requerido por server.js)

### Documentación principal:
- ✅ `README.md` - Documentación principal
- ✅ `INICIO-RAPIDO.md` - Guía de instalación rápida
- ✅ `GUIA-USO-SISTEMA-ETIQUETAS.md` - Manual de usuario
- ✅ `SISTEMA-AYUDA-IMPLEMENTADO.md` - Sistema de ayuda

### Carpetas:
- ✅ `bandeja/` - Aplicación de bandeja
- ✅ `base_data/` - Scripts de base de datos
- ✅ `config/` - Configuraciones
- ✅ `daemon/` - Servicio Windows
- ✅ `documentation/` - Documentación técnica
- ✅ `founds/` - Recursos multimedia
- ✅ `godex_code/` - Códigos de prueba Godex
- ✅ `historial_logs/` - Logs históricos
- ✅ `logos_dinamicos/` - Logos ZPL
- ✅ `logs/` - Logs actuales
- ✅ `migrations/` - Migraciones de BD
- ✅ `node_modules/` - Dependencias npm
- ✅ `public/` - Frontend
- ✅ `scripts/` - Scripts auxiliares
- ✅ `ssl/` - Certificados SSL

### Archivos de configuración:
- ✅ `system.config` - Configuración del sistema

---

## 🔧 Cambios en Código

### server.js

**Antes:**
```javascript
const { LOGO_MISTI_ZPL } = require('./logo-misti-zpl-generado.js');
const { ICONO_LAVADO_30_ZPL } = require('./icono-lavado-30-zpl.js');
// ... etc
```

**Después:**
```javascript
const { LOGO_MISTI_ZPL } = require('./logos_dinamicos/logo-misti-zpl-generado.js');
const { ICONO_LAVADO_30_ZPL } = require('./logos_dinamicos/icono-lavado-30-zpl.js');
// ... etc
```

**Líneas modificadas:** 695-711

---

## ✅ Verificación

### ¿Servidor funciona después de cambios?

```cmd
node server.js
```

**Resultado esperado:** 
```
🚀 Servidor HTTP ejecutándose en http://localhost:3012
```

### ¿Logos se cargan correctamente?

```javascript
// Verificar imports en Node console
require('./logos_dinamicos/logo-misti-zpl-generado.js')
// Debe devolver: { LOGO_MISTI_ZPL: '^GFA,...^FS' }
```

---

## 📊 Estadísticas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Archivos en raíz | ~60 | ~25 | -58% |
| Carpetas organizadas | 14 | 15 | +1 nueva |
| Documentación MD | Dispersa | Centralizada | 100% |
| Scripts BAT | Dispersos | Centralizados | 100% |
| Logos ZPL | Raíz | Carpeta dedicada | 100% |

---

## 🎯 Beneficios

1. **Claridad:** Raíz del proyecto más limpia y profesional
2. **Mantenibilidad:** Fácil encontrar archivos por categoría
3. **Onboarding:** Nuevos desarrolladores entienden estructura rápidamente
4. **Backups:** Más fácil identificar qué respaldar
5. **Deployments:** Estructura clara para producción

---

## ⚠️ Notas Importantes

### Si algo no funciona:

1. **Verificar rutas en server.js:**
   - Líneas 695-711 deben apuntar a `./logos_dinamicos/`

2. **Verificar archivos movidos:**
   ```cmd
   dir logos_dinamicos\*.js
   dir base_data\*.sql
   dir documentation\iniciadores\*.bat
   ```

3. **Revertir cambios si es necesario:**
   ```cmd
   git checkout HEAD -- server.js
   ```

### Archivos NO movidos (intencional):

- `convertir-*.js` en raíz → **MOVIDOS** a `documentation/pruebas/`
- `test-*.js` en raíz → **MOVIDOS** a `documentation/pruebas/`
- `*.bat` en raíz → **MOVIDOS** a `documentation/iniciadores/`

---

## 📝 Próximos Pasos

1. ✅ Verificar servidor funciona: `node server.js`
2. ✅ Verificar bandeja funciona: `cd bandeja && npm start`
3. ✅ Probar impresión de etiquetas
4. ✅ Actualizar documentation/README.md si es necesario
5. ✅ Commit de cambios con mensaje descriptivo

---

## 🔗 Referencias

- `README.md` - Documentación principal actualizada
- `logos_dinamicos/README.md` - Guía de logos ZPL
- `documentation/README.md` - Índice de documentación técnica

---

**Fin del reporte de reorganización**
