# 🗄️ Base de Datos - Sistema de Etiquetas

Scripts SQL para configurar la base de datos en cualquier PC.

## 📋 Archivos principales

### `crear_base_datos.sql` ⭐
**Script completo y actualizado** con todas las 24 tablas del sistema.

**Contenido:**
- Eliminación segura de tablas existentes
- Creación de todas las tablas con estructura actual
- Primary Keys
- Foreign Keys
- Índices
- Valores por defecto

**Uso:**
```bash
psql -U postgres -d postgres -f crear_base_datos.sql
```

## 📊 Tablas incluidas (25)

### Core del Sistema
- `usuarios` - Gestión de usuarios y permisos
- `departamentos` - Departamentos de la empresa
- `productos` - Catálogo de productos
- `solicitudes_etiquetas` - Solicitudes principales con config de logos
- `bitacora_produccion` - Registro de producción con mensajes de costureras

### Productos Especiales
- `productos_especiales` - Productos personalizados
- `solicitudes_especiales` - Solicitudes de productos especiales
- `registros_productos_especiales` - Historial de especiales
- `config_impresion_especiales` - Configuraciones de impresión

### Impresión
- `cola_impresion` - Cola de etiquetas QR
- `cola_impresion_rotulado` - Cola de rotulados Godex
- `etiquetas_generadas` - Registro de etiquetas generadas
- `gestion_impresora` - Estado y gestión de impresoras

### Entidades y Control
- `entidades` - Empresas/entidades (HECHO EN PERU, etc.)
- `contadores_lotes` - Contadores de números de solicitud
- `plantillas_etiquetas` - Editor visual de etiquetas

### Historial y Auditoría
- `historial_solicitudes` - Historial de cambios en solicitudes
- `historial_supervisor` - Acciones de supervisores
- `sesiones_usuarios` - Sesiones activas de usuarios
- `sesiones_supervisor` - Sesiones de supervisores

### Sistema de Chat
- `chat_canales` - Canales de comunicación
- `chat_mensajes` - Mensajes del chat
- `chat_participantes` - Usuarios en canales
- `chat_mensajes_no_leidos` - Control de mensajes no leídos
- `chat_usuarios_en_linea` - Estado en línea de usuarios

## 🔄 Migraciones

### `MIGRACION-LOGO-PRINCIPAL.sql`
Migración para agregar soporte de logos dinámicos:
- Agrega columna `logo_principal` (VARCHAR)
- Migra datos de `config_logo_camitex` (boolean) → `logo_principal` (string)
- Elimina columna obsoleta `config_logo_camitex`

**Logos soportados:**
- `camitex` - Logo Camitex (default)
- `algodon_100` - 100% Algodón
- `maxima_suavidad` - Máxima Suavidad
- `producto_peruano` - Producto Peruano
- `sin_logo` - Sin logo

### `EJECUTAR-MIGRACION.sql`
Migración para agregar columnas de control de impresión:
- `rotulado_impreso` (BOOLEAN)
- `qr_impreso` (BOOLEAN)

## 🚀 Instalación en PC nueva

1. **Instalar PostgreSQL 16**
   ```
   Usuario: postgres
   Contraseña: alsimtex
   Puerto: 5432
   ```

2. **Crear base de datos** (si no existe)
   ```sql
   CREATE DATABASE postgres;
   ```

3. **Ejecutar script principal**
   ```bash
   psql -U postgres -d postgres -f crear_base_datos.sql
   ```

4. **Ejecutar migraciones** (si actualizas una BD existente)
   ```bash
   psql -U postgres -d postgres -f EJECUTAR-MIGRACION.sql
   psql -U postgres -d postgres -f MIGRACION-LOGO-PRINCIPAL.sql
   ```

## ⚙️ Configuración en VS Code

1. **Instalar extensión PostgreSQL** (Chris Kolkman)

2. **Crear conexión:**
   - Host: localhost
   - Port: 5432
   - Database: postgres
   - User: postgres
   - Password: alsimtex

3. **Verificar tablas:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

## 📝 Notas importantes

- **Base de datos:** `postgres` (no `etiquetas_db`)
- **Usuario:** `postgres`
- **Contraseña:** `alsimtex`
- **Puerto:** `5432`

## 🌐 Configuración de Red

**Red actual:** `192.168.15.0/24`

**Dispositivos configurados:**
- **Servidor:** `192.168.15.21` (actualmente 192.168.15.9 en DHCP)
- **Impresora Zebra ZD230:** `192.168.15.34` (Puerto TCP/IP: 9100)
- **Impresora Godex G530:** `192.168.15.35` (Puerto TCP/IP: 9100)
- **Gateway:** `192.168.15.1`

> **⚠️ Importante:** Si replicas este sistema en otra red, actualiza las IPs en:
> - `config.json` (impresoras)
> - `system.config` (PRINTER_IP)
> - `server.js` (PRINTER_IP, GODEX_IP, ipsPermitidas)
> - Tabla `gestion_impresora` (ip_impresora DEFAULT)

---
*Última actualización: 5 de noviembre de 2025*
*Esquema exportado automáticamente desde base de datos en producción*
