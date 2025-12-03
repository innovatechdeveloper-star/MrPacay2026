# 🔧 NUEVA FUNCIONALIDAD: AUTO_SERVICES

## 📋 RESUMEN

Se ha agregado una nueva columna `auto_services` a la tabla `usuarios` para controlar el acceso a servicios automáticos del sistema.

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. **Base de Datos**
- **Nueva columna:** `auto_services` (BOOLEAN)
- **Valor por defecto:** `false`
- **Tabla afectada:** `usuarios`
- **Archivo de migración:** `migrations/add_auto_services_column.sql`

### 2. **Backend (server.js)**

#### Endpoints actualizados:

##### ✅ `/api/login` (POST)
- Ahora incluye `auto_services` en la respuesta
- Devuelve el estado del usuario

##### ✅ `/api/login-simple` (POST)
- Incluye `auto_services` en la respuesta
- Para login_fixed.html

##### ✅ `/api/usuarios-lista` (GET)
- Lista usuarios con campo `auto_services`

##### ✅ `/api/admin/users` (POST)
- Permite crear usuarios con `auto_services`
- Valor por defecto: `false`

##### ✅ `/api/admin/users/:id` (PUT)
- Permite actualizar el campo `auto_services`

---

## 🚀 INSTALACIÓN

### Paso 1: Ejecutar migración SQL

**Opción A - Usando el script bat:**
```bash
ejecutar-migracion-auto-services.bat
```

**Opción B - Manualmente en pgAdmin/psql:**
```sql
-- Conectar a la base de datos mi_app_etiquetas
psql -U postgres -d mi_app_etiquetas

-- Ejecutar el archivo de migración
\i migrations/add_auto_services_column.sql
```

### Paso 2: Reiniciar el servidor
```bash
node server.js
```

---

## 📊 ESTRUCTURA DE DATOS

### Tabla `usuarios` - Nueva columna:

| Campo | Tipo | Default | Nullable | Descripción |
|-------|------|---------|----------|-------------|
| `auto_services` | BOOLEAN | false | NO | Acceso a servicios automáticos |

---

## 🔍 USO EN EL FRONTEND

### Ejemplo de respuesta de login:

```json
{
  "usuario": {
    "id_usuario": 1,
    "nombre": "Juan Pérez",
    "email": "juan@empresa.com",
    "rol": "administracion",
    "genero": "masculino",
    "auto_services": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mensaje": "Login exitoso"
}
```

### JavaScript - Verificar auto_services:

```javascript
// Después del login
const usuario = response.usuario;

if (usuario.auto_services) {
    console.log('✅ Usuario tiene acceso a servicios automáticos');
    // Mostrar opciones adicionales
    mostrarPanelAutoServices();
} else {
    console.log('❌ Usuario NO tiene acceso a servicios automáticos');
    // Ocultar opciones
    ocultarPanelAutoServices();
}
```

---

## 🎯 CASOS DE USO

### ¿Cuándo activar `auto_services`?

1. **Administradores:** Acceso completo (true)
2. **Supervisores:** Según necesidad
3. **Costureras:** Generalmente false
4. **Usuarios especiales:** true para funciones avanzadas

---

## 🔐 SEGURIDAD

- El campo se valida en el backend
- Solo administradores pueden modificarlo
- No se puede cambiar desde el frontend sin autorización

---

## 📝 PRÓXIMOS PASOS

1. ✅ Migración de base de datos ejecutada
2. ✅ Backend actualizado
3. ⏳ Actualizar panel de administración (HTML)
4. ⏳ Agregar toggle en gestión de usuarios
5. ⏳ Implementar lógica de servicios automáticos

---

## 🐛 TROUBLESHOOTING

### Error: "column auto_services does not exist"
**Solución:** Ejecutar la migración SQL

### Error al ejecutar migración
**Verificar:**
- PostgreSQL está corriendo
- Credenciales correctas en el script bat
- Base de datos `mi_app_etiquetas` existe

---

## 📅 CHANGELOG

**Versión 2.2.0 - 14/10/2025**
- ✅ Agregada columna `auto_services` a tabla usuarios
- ✅ Actualizado endpoint `/api/login`
- ✅ Actualizado endpoint `/api/login-simple`
- ✅ Actualizado endpoint `/api/usuarios-lista`
- ✅ Actualizado endpoint `/api/admin/users` (POST y PUT)
- ✅ Creado script de migración automático

---

**Desarrollado por:** Sistema de Etiquetas QR - ALSIMTEX
**Fecha:** 14 de octubre de 2025
