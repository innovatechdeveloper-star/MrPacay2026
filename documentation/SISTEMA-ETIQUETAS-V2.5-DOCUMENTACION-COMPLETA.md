# 📚 SISTEMA DE ETIQUETAS V2.5 - DOCUMENTACIÓN COMPLETA

**Fecha:** 5 de noviembre de 2025  
**Versión:** 2.5.0  
**Autor:** Sistema de Etiquetas QR con Impresión Automática

---

## 📋 ÍNDICE

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Base de Datos](#base-de-datos)
5. [API REST Endpoints](#api-rest-endpoints)
6. [Módulos del Sistema](#módulos-del-sistema)
7. [Roles y Permisos](#roles-y-permisos)
8. [Flujos de Trabajo](#flujos-de-trabajo)
9. [Configuración](#configuración)
10. [Instalación y Despliegue](#instalación-y-despliegue)

---

## 📖 DESCRIPCIÓN GENERAL

El **Sistema de Etiquetas v2.5** es una aplicación web empresarial desarrollada para gestionar la solicitud, aprobación e impresión automática de etiquetas QR para productos en un entorno de manufactura textil.

### Características Principales

- ✅ **Gestión de Solicitudes**: Las costureras solicitan etiquetas para productos terminados
- ✅ **Aprobación por Supervisor**: Sistema de aprobación con auto-services opcional
- ✅ **Impresión Automática**: Integración directa con impresoras Zebra (ZD230) y Godex
- ✅ **Códigos QR Únicos**: Generación automática de QR para trazabilidad
- ✅ **Productos Especiales**: Gestión de juegos/combos con múltiples componentes
- ✅ **Panel Administrativo**: Dashboard completo con estadísticas y reportes
- ✅ **Sistema de Chat**: Comunicación interna entre usuarios
- ✅ **Exportación a Excel**: Reportes de solicitudes, productos y usuarios
- ✅ **Sistema de Logging**: Monitoreo completo de operaciones del sistema
- ✅ **Autenticación JWT**: Sistema seguro de login con tokens

### Tipos de Usuarios

1. **Costurera** (`costurera`): Solicita etiquetas para productos terminados
2. **Supervisor** (`encargada_embalaje`): Aprueba/rechaza solicitudes y gestiona cola
3. **Administrador** (`administracion`): Control total del sistema

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Costurera │  │Supervisor│  │  Admin   │  │  Monitor │   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │ Sistema  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼ HTTPS (JWT)
┌─────────────────────────────────────────────────────────────┐
│              SERVIDOR EXPRESS.JS (Puerto 3012)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API REST (161 Endpoints)                            │   │
│  │  • Autenticación (JWT)                               │   │
│  │  • CRUD Productos/Usuarios/Solicitudes               │   │
│  │  • Sistema de Chat                                   │   │
│  │  • Exportación Excel                                 │   │
│  │  • Logging Profesional                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware                                           │   │
│  │  • verificarToken (JWT)                              │   │
│  │  • verificarRol (RBAC)                               │   │
│  │  • Cookie Parser                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS PostgreSQL 12+                    │
│  • usuarios                    • solicitudes_etiquetas       │
│  • productos                   • cola_impresion             │
│  • productos_especiales        • solicitudes_rotulado       │
│  • departamentos               • historial_solicitudes      │
│  • sesiones_usuarios           • chat_canales               │
│  • chat_mensajes               • chat_participantes         │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 IMPRESORAS (TCP/IP)                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Zebra ZD230      │         │ Godex G500       │         │
│  │ IP: 192.168.1.34 │         │ IP: 192.168.1.35 │         │
│  │ Puerto: 9100     │         │ Puerto: 9100     │         │
│  │ Lenguaje: ZPL    │         │ Lenguaje: ZPL    │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 TECNOLOGÍAS UTILIZADAS

### Backend
- **Node.js** v18+
- **Express.js** v5.1.0
- **PostgreSQL** v12+
- **JWT** (jsonwebtoken v9.0.2)
- **bcrypt** v6.0.0 (hash de contraseñas)
- **ExcelJS** v4.4.0 (generación de reportes)
- **cookie-parser** v1.4.7

### Frontend
- **HTML5/CSS3/JavaScript** (Vanilla)
- **Bootstrap** 5.3.0 (responsive design)
- **Font Awesome** 6.4.0 (iconos)
- **Chart.js** (gráficos y estadísticas)

### Base de Datos
- **PostgreSQL** 12+
- **pg** v8.16.3 (driver Node.js)

### Impresión
- **TCP/IP Sockets** (comunicación directa con impresoras)
- **ZPL** (Zebra Programming Language)

### Logging
- **Sistema propio** con rotación automática y niveles (DEBUG, INFO, WARN, ERROR)

---

## 🗄️ BASE DE DATOS

### Esquema Completo

#### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    codigo_empleado VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    puesto VARCHAR(100),
    nivel_acceso VARCHAR(50) NOT NULL, -- 'costurera', 'encargada_embalaje', 'administracion'
    id_departamento INTEGER,
    password_hash VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    auto_services BOOLEAN DEFAULT false,  -- Auto-impresión Zebra
    auto_servicesgd BOOLEAN DEFAULT false, -- Auto-impresión Godex
    ultimo_login TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `productos`
```sql
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_corta TEXT,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    sku VARCHAR(100),
    codigo_producto VARCHAR(100) UNIQUE,
    codigo_barras VARCHAR(100),
    unidad_medida VARCHAR(50) DEFAULT 'UNIDAD',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `solicitudes_etiquetas`
```sql
CREATE TABLE solicitudes_etiquetas (
    id_solicitud SERIAL PRIMARY KEY,
    numero_solicitud VARCHAR(100) UNIQUE NOT NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_producto INTEGER REFERENCES productos(id_producto),
    id_producto_especial INTEGER,
    lote_produccion VARCHAR(100),
    cantidad_solicitada INTEGER NOT NULL,
    fecha_produccion DATE,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridad VARCHAR(20) DEFAULT 'normal',
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aprobada', 'rechazada', 'impresa'
    observaciones TEXT,
    observaciones_supervisor TEXT,
    qr_code VARCHAR(255),
    supervisor_id INTEGER REFERENCES usuarios(id_usuario),
    empresa VARCHAR(255) DEFAULT 'HECHO EN PERU'
);
```

#### Tabla: `productos_especiales`
```sql
CREATE TABLE productos_especiales (
    id_producto_especial SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_corta TEXT,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    codigo_producto VARCHAR(100) UNIQUE,
    id_producto_1 INTEGER REFERENCES productos(id_producto),
    cantidad_producto_1 INTEGER DEFAULT 1,
    id_producto_2 INTEGER REFERENCES productos(id_producto),
    cantidad_producto_2 INTEGER DEFAULT 1,
    id_producto_3 INTEGER REFERENCES productos(id_producto),
    cantidad_producto_3 INTEGER DEFAULT 1,
    id_producto_4 INTEGER REFERENCES productos(id_producto),
    cantidad_producto_4 INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    mostrar_id BOOLEAN DEFAULT false,
    mostrar_nombre BOOLEAN DEFAULT true,
    mostrar_codigo BOOLEAN DEFAULT true,
    mostrar_qr BOOLEAN DEFAULT true,
    mostrar_empresa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `cola_impresion`
```sql
CREATE TABLE cola_impresion (
    id SERIAL PRIMARY KEY,
    id_solicitud INTEGER REFERENCES solicitudes_etiquetas(id_solicitud),
    numero_solicitud VARCHAR(100),
    qr_code VARCHAR(255),
    nombre_producto VARCHAR(255),
    cantidad_a_imprimir INTEGER,
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'imprimiendo', 'completada', 'error'
    tipo VARCHAR(50) DEFAULT 'etiqueta', -- 'etiqueta', 'rotulado'
    impresora VARCHAR(50) DEFAULT 'ZEBRA', -- 'ZEBRA', 'GODEX'
    datos_zpl TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_impresion TIMESTAMP
);
```

#### Tabla: `solicitudes_rotulado`
```sql
CREATE TABLE solicitudes_rotulado (
    id_solicitud_rotulado SERIAL PRIMARY KEY,
    numero_solicitud VARCHAR(100) UNIQUE NOT NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_producto INTEGER REFERENCES productos(id_producto),
    cantidad_solicitada INTEGER NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    datos_zpl TEXT,
    supervisor_id INTEGER REFERENCES usuarios(id_usuario),
    fecha_aprobacion TIMESTAMP
);
```

#### Tablas de Chat
```sql
CREATE TABLE chat_canales (
    id_canal SERIAL PRIMARY KEY,
    nombre_canal VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'grupo', -- 'privado', 'grupo'
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_mensajes (
    id_mensaje SERIAL PRIMARY KEY,
    id_canal INTEGER REFERENCES chat_canales(id_canal),
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_participantes (
    id_participante SERIAL PRIMARY KEY,
    id_canal INTEGER REFERENCES chat_canales(id_canal),
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    ultima_lectura TIMESTAMP,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API REST ENDPOINTS

### Total: 161 Endpoints

### 1️⃣ AUTENTICACIÓN (4 endpoints)

#### POST `/api/auth/login`
**Descripción:** Login con email/código y contraseña  
**Auth:** No requiere  
**Body:**
```json
{
  "email": "costurera@empresa.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 1,
    "nombre_completo": "María González",
    "nivel_acceso": "costurera",
    "auto_services": true
  }
}
```

#### POST `/api/auth/logout`
**Descripción:** Cerrar sesión  
**Auth:** JWT requerido  
**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### GET `/api/auth/me`
**Descripción:** Obtener datos del usuario actual  
**Auth:** JWT requerido  
**Response:**
```json
{
  "id_usuario": 1,
  "nombre_completo": "María González",
  "nivel_acceso": "costurera",
  "auto_services": true,
  "email": "costurera@empresa.com"
}
```

#### GET `/api/usuarios-lista`
**Descripción:** Lista de usuarios para el dropdown de login  
**Auth:** No requiere  
**Response:**
```json
[
  {
    "id_usuario": 1,
    "codigo_empleado": "COS001",
    "nombre_completo": "María González",
    "nivel_acceso": "costurera"
  }
]
```

---

### 2️⃣ PRODUCTOS (26 endpoints)

#### GET `/api/productos`
**Descripción:** Lista todos los productos activos  
**Auth:** JWT requerido  
**Query params:** `?categoria=`, `?activo=true`  
**Response:**
```json
[
  {
    "id_producto": 1,
    "nombre_producto": "Pantalón Jean Classic",
    "descripcion_corta": "Jean azul talla 30",
    "categoria": "Pantalones",
    "subcategoria": "Jeans",
    "codigo_producto": "PAN-001",
    "unidad_medida": "UNIDAD",
    "activo": true
  }
]
```

#### GET `/api/productos/:id`
**Descripción:** Detalle de un producto específico  
**Auth:** JWT requerido

#### PUT `/api/productos/:id`
**Descripción:** Actualizar producto  
**Auth:** JWT + rol admin  
**Body:**
```json
{
  "nombre_producto": "Nuevo nombre",
  "descripcion_corta": "Nueva descripción",
  "categoria": "Categoría"
}
```

#### PUT `/api/productos/:id/configuracion-etiqueta`
**Descripción:** Configurar campos visibles en etiqueta  
**Auth:** JWT + rol admin  
**Body:**
```json
{
  "mostrar_codigo": true,
  "mostrar_nombre": true,
  "mostrar_qr": true
}
```

#### GET `/api/productos/categorias`
**Descripción:** Lista de categorías únicas

#### GET `/api/productos/subcategorias/:categoria`
**Descripción:** Subcategorías de una categoría

#### GET `/api/productos-especiales`
**Descripción:** Lista de productos especiales (combos/juegos)  
**Response:**
```json
[
  {
    "id_producto_especial": 1,
    "nombre_producto": "Juego Completo Niño",
    "componentes": [
      {"id_producto": 1, "nombre": "Pantalón", "cantidad": 1},
      {"id_producto": 2, "nombre": "Camisa", "cantidad": 1}
    ]
  }
]
```

#### GET `/api/productos-especiales/:id/componentes`
**Descripción:** Componentes de un producto especial

#### POST `/api/productos-especiales`
**Descripción:** Crear producto especial  
**Body:**
```json
{
  "nombre_producto": "Juego Completo",
  "id_producto_1": 1,
  "cantidad_producto_1": 1,
  "id_producto_2": 2,
  "cantidad_producto_2": 1
}
```

#### Otros endpoints de productos:
- `GET /api/productos/lista/marcas`
- `GET /api/productos/lista/modelos`
- `GET /api/admin/productos/next-code`
- `POST /api/admin/productos/create`
- `PUT /api/admin/productos/deactivate`
- `PUT /api/admin/productos/reactivate`
- `GET /api/subcategorias-terminados`
- `GET /api/entidades` (marcas/modelos)
- `POST /api/entidades`
- `PUT /api/entidades/:id`
- `DELETE /api/entidades/:id`

---

### 3️⃣ SOLICITUDES DE ETIQUETAS (20 endpoints)

#### POST `/api/crear-solicitud`
**Descripción:** Crear solicitud de etiquetas (costurera)  
**Auth:** JWT requerido  
**Body:**
```json
{
  "id_producto": 1,
  "cantidad_solicitada": 50,
  "lote_produccion": "LOTE-2025-001",
  "fecha_produccion": "2025-11-05",
  "observaciones": "Producción urgente"
}
```
**Response:**
```json
{
  "success": true,
  "id_solicitud": 123,
  "numero_solicitud": "SOL-20251105-001",
  "estado": "pendiente",
  "qr_code": "QR-SOL-20251105-001"
}
```

#### POST `/api/crear-solicitud-especial`
**Descripción:** Crear solicitud para producto especial  
**Body:**
```json
{
  "id_producto_especial": 1,
  "cantidad_solicitada": 10,
  "componentes": [
    {"id_producto": 1, "cantidad": 10},
    {"id_producto": 2, "cantidad": 10}
  ]
}
```

#### GET `/api/solicitudes`
**Descripción:** Lista todas las solicitudes (admin/supervisor)  
**Query:** `?estado=pendiente&fecha_desde=2025-11-01`  
**Response:**
```json
[
  {
    "id_solicitud": 123,
    "numero_solicitud": "SOL-20251105-001",
    "nombre_usuario": "María González",
    "nombre_producto": "Pantalón Jean",
    "cantidad_solicitada": 50,
    "estado": "pendiente",
    "fecha_solicitud": "2025-11-05T10:30:00"
  }
]
```

#### GET `/api/solicitudes/historial`
**Descripción:** Historial de solicitudes del usuario actual

#### PUT `/api/solicitudes/:id/estado`
**Descripción:** Cambiar estado de solicitud  
**Auth:** JWT + rol supervisor/admin  
**Body:**
```json
{
  "estado": "aprobada",
  "observaciones_supervisor": "Aprobado por producción urgente"
}
```

#### DELETE `/api/solicitudes-etiquetas/:id`
**Descripción:** Eliminar solicitud  
**Auth:** JWT + permisos

#### Otros endpoints de solicitudes:
- `GET /api/supervisor/solicitudes-proceso`
- `GET /api/supervisor/solicitudes-completadas`
- `POST /api/supervisor/cambiar-estado/:id`
- `GET /api/solicitudes-especiales`
- `GET /api/solicitudes-etiquetas-especiales`
- `GET /api/solicitudes-pendientes`
- `POST /api/cambiar-estado-solicitud`
- `GET /api/admin/solicitudes/stats`
- `POST /api/admin/solicitudes/cleanup`
- `POST /api/admin/solicitudes/cleanup/preview`
- `DELETE /api/admin/solicitudes/:id`
- `DELETE /api/admin/solicitudes/clear-all`

---

### 4️⃣ SUPERVISOR (8 endpoints)

#### GET `/api/supervisor/pendientes`
**Descripción:** Solicitudes pendientes de aprobación  
**Auth:** JWT + rol supervisor  
**Response:**
```json
[
  {
    "id_solicitud": 123,
    "numero_solicitud": "SOL-20251105-001",
    "costurera": "María González",
    "producto": "Pantalón Jean",
    "cantidad": 50,
    "fecha_solicitud": "2025-11-05T10:30:00",
    "auto_services": false
  }
]
```

#### POST `/api/supervisor/aprobar/:id`
**Descripción:** Aprobar solicitud manualmente

#### POST `/api/supervisor/rechazar/:id`
**Descripción:** Rechazar solicitud  
**Body:**
```json
{
  "observaciones_supervisor": "Producto no disponible"
}
```

#### GET `/api/supervisor/solicitudes-recientes`
**Descripción:** Solicitudes de últimas 24 horas (todos los estados)  
**Response:**
```json
[
  {
    "id_solicitud": 123,
    "estado": "aprobada",
    "costurera": "María González",
    "producto": "Pantalón Jean",
    "cantidad": 50,
    "fecha_solicitud": "2025-11-05T10:30:00",
    "fecha_aprobacion": "2025-11-05T10:35:00"
  }
]
```

#### GET `/api/supervisor/costureras`
**Descripción:** Lista de costureras

#### POST `/api/supervisor/actuar-como/:id_costurera`
**Descripción:** Supervisor actúa como costurera (delegación)

#### Otros:
- `GET /api/supervisor/solicitudes-proceso`
- `GET /api/supervisor/solicitudes-completadas`

---

### 5️⃣ IMPRESIÓN Y COLA (14 endpoints)

#### GET `/api/admin/print-queue`
**Descripción:** Cola de impresión completa  
**Response:**
```json
[
  {
    "id": 1,
    "numero_solicitud": "SOL-20251105-001",
    "producto": "Pantalón Jean",
    "cantidad_a_imprimir": 50,
    "estado": "pendiente",
    "impresora": "ZEBRA",
    "fecha_creacion": "2025-11-05T10:35:00"
  }
]
```

#### GET `/api/admin/printer-status`
**Descripción:** Estado de impresoras (Zebra y Godex)  
**Response:**
```json
{
  "zebra": {
    "conectada": true,
    "ip": "192.168.1.34",
    "puerto": 9100,
    "trabajos_pendientes": 3
  },
  "godex": {
    "conectada": true,
    "ip": "192.168.1.35",
    "puerto": 9100,
    "trabajos_pendientes": 0
  }
}
```

#### POST `/api/admin/reset-printer`
**Descripción:** Reiniciar impresora  
**Body:**
```json
{
  "impresora": "ZEBRA"
}
```

#### POST `/api/admin/resume-printing`
**Descripción:** Reanudar impresión pausada

#### POST `/api/admin/clear-error-jobs`
**Descripción:** Limpiar trabajos con error

#### POST `/api/admin/retry-print-job/:id`
**Descripción:** Reintentar trabajo fallido

#### POST `/api/admin/force-start-queue`
**Descripción:** Forzar inicio de cola

#### POST `/api/reintentar-impresiones-pendientes`
**Descripción:** Reintentar todas las impresiones pendientes

#### Otros endpoints de impresión:
- `GET /api/printer-status-all`
- `GET /api/test-zebra`
- `GET /api/impresora/stats`
- `POST /api/impresora/evento`
- `GET /api/impresora/cola`
- `GET /api/impresora/diagnostico`

---

### 6️⃣ ROTULADO GODEX (5 endpoints)

#### POST `/api/print/rotulado`
**Descripción:** Imprimir rotulado directo en Godex

#### POST `/api/solicitudes/rotulado`
**Descripción:** Crear solicitud de rotulado

#### GET `/api/solicitudes/rotulado/pendientes`
**Descripción:** Solicitudes de rotulado pendientes

#### PUT `/api/solicitudes/rotulado/:id/aprobar`
**Descripción:** Aprobar rotulado

#### POST `/api/registros/:id_solicitud/imprimir-rotulado`
**Descripción:** Imprimir rotulado desde registro

---

### 7️⃣ USUARIOS Y ADMINISTRACIÓN (15 endpoints)

#### GET `/api/usuarios`
**Descripción:** Lista todos los usuarios  
**Response:**
```json
[
  {
    "id_usuario": 1,
    "codigo_empleado": "COS001",
    "nombre_completo": "María González",
    "email": "maria@empresa.com",
    "nivel_acceso": "costurera",
    "auto_services": true,
    "activo": true
  }
]
```

#### GET `/api/usuarios/me`
**Descripción:** Usuario actual (JWT)

#### GET `/api/usuarios/:id`
**Descripción:** Detalle de usuario

#### PUT `/api/usuarios/:id/auto-services`
**Descripción:** Activar/desactivar auto-impresión Zebra  
**Body:**
```json
{
  "auto_services": true
}
```

#### PUT `/api/usuarios/:id/auto-servicesgd`
**Descripción:** Activar/desactivar auto-impresión Godex  
**Body:**
```json
{
  "auto_servicesgd": true
}
```

#### GET `/api/admin/users`
**Descripción:** Lista usuarios (admin panel)

#### POST `/api/admin/users`
**Descripción:** Crear usuario  
**Body:**
```json
{
  "codigo_empleado": "COS005",
  "nombre_completo": "Ana López",
  "email": "ana@empresa.com",
  "password": "password123",
  "nivel_acceso": "costurera",
  "id_departamento": 2
}
```

#### PUT `/api/admin/users/:id`
**Descripción:** Actualizar usuario

#### PUT `/api/admin/users/:id/toggle-status`
**Descripción:** Activar/desactivar usuario

#### POST `/api/admin/users/:id/reset-password`
**Descripción:** Resetear contraseña

#### DELETE `/api/admin/users/:id`
**Descripción:** Eliminar usuario

#### Otros:
- `GET /api/admin/costureras-lista`
- `GET /api/usuarios-login`
- `POST /api/login`
- `POST /api/login-simple`

---

### 8️⃣ ESTADÍSTICAS Y REPORTES (18 endpoints)

#### GET `/api/admin/dashboard-stats`
**Descripción:** Estadísticas principales del dashboard  
**Response:**
```json
{
  "solicitudes_hoy": 45,
  "solicitudes_pendientes": 8,
  "solicitudes_aprobadas": 30,
  "solicitudes_rechazadas": 2,
  "etiquetas_impresas_hoy": 1250,
  "costureras_activas": 12,
  "productos_activos": 156
}
```

#### GET `/api/admin/stock-etiquetas`
**Descripción:** Stock y estadísticas de etiquetas  
**Response:**
```json
{
  "total_etiquetas": 15000,
  "etiquetas_usadas": 8500,
  "etiquetas_disponibles": 6500,
  "solicitudes_pendientes": 8,
  "etiquetas_pendientes_imprimir": 400
}
```

#### GET `/api/admin/estadisticas-avanzadas`
**Descripción:** Estadísticas avanzadas con gráficos

#### GET `/api/admin/productivity-stats`
**Descripción:** Estadísticas de productividad

#### GET `/api/admin/department-stats`
**Descripción:** Estadísticas por departamento

#### GET `/api/admin/trends`
**Descripción:** Tendencias de uso

#### POST `/api/admin/stats/kpis`
**Descripción:** KPIs del sistema  
**Body:**
```json
{
  "fecha_inicio": "2025-11-01",
  "fecha_fin": "2025-11-05"
}
```

#### POST `/api/admin/stats/charts`
**Descripción:** Datos para gráficos  
**Response:**
```json
{
  "solicitudes_por_dia": [12, 15, 20, 18, 25],
  "productos_mas_solicitados": [
    {"producto": "Pantalón", "cantidad": 150},
    {"producto": "Camisa", "cantidad": 120}
  ]
}
```

#### POST `/api/admin/stats/analysis-costureras`
**Descripción:** Análisis de productividad por costurera

#### POST `/api/admin/stats/analysis-productos`
**Descripción:** Análisis de productos más solicitados

#### Otros:
- `GET /api/estadisticas`
- `GET /api/stats-rapidas`
- `GET /api/admin/stats`
- `GET /api/admin/diagnostico-datos`
- `GET /api/admin/data-hashes`
- `GET /api/registros/:id_usuario`
- `GET /api/admin/departments`
- `GET /api/admin/system-status`

---

### 9️⃣ EXPORTACIÓN E IMPORTACIÓN (10 endpoints)

#### GET `/api/admin/exportar/solicitudes-excel`
**Descripción:** Exportar solicitudes a Excel  
**Query:** `?fecha_inicio=2025-11-01&fecha_fin=2025-11-05&estado=aprobada`  
**Response:** Archivo Excel descargable  
**Columnas:**
- ID Solicitud
- Número Solicitud
- Producto
- Usuario
- Cantidad
- Estado
- Fecha Solicitud
- Fecha Aprobación
- Supervisor
- Observaciones
- QR Code

#### GET `/api/admin/exportar/productos-excel`
**Descripción:** Exportar productos a Excel  
**Columnas:**
- ID Producto
- Nombre
- Descripción
- Categoría
- Subcategoría
- Marca
- Modelo
- Código
- Unidad Medida
- Estado

#### GET `/api/admin/exportar/usuarios-excel`
**Descripción:** Exportar usuarios a Excel  
**Columnas:**
- ID Usuario
- Código Empleado
- Nombre Completo
- Email
- Nivel Acceso
- Departamento
- Auto Services
- Solicitudes Totales
- Estado

#### GET `/api/admin/export/users`
**Descripción:** Exportar usuarios (formato alternativo)

#### GET `/api/admin/export/products`
**Descripción:** Exportar productos (formato alternativo)

#### GET `/api/admin/export/solicitudes`
**Descripción:** Exportar solicitudes (formato alternativo)

#### POST `/api/admin/export-database`
**Descripción:** Exportar base de datos completa (backup SQL)

#### POST `/api/admin/export-excel`
**Descripción:** Exportar datos personalizados a Excel  
**Body:**
```json
{
  "tabla": "solicitudes_etiquetas",
  "campos": ["numero_solicitud", "estado", "cantidad"],
  "filtros": {"estado": "aprobada"}
}
```

#### POST `/api/admin/export-report`
**Descripción:** Generar reporte personalizado

#### POST `/api/admin/import-database`
**Descripción:** Importar base de datos desde backup

---

### 🔟 CHAT INTERNO (8 endpoints)

#### GET `/api/chat/canales`
**Descripción:** Lista de canales de chat  
**Response:**
```json
[
  {
    "id_canal": 1,
    "nombre_canal": "General",
    "descripcion": "Canal general del sistema",
    "tipo": "grupo",
    "mensajes_no_leidos": 3
  }
]
```

#### GET `/api/chat/canales/:canalId/mensajes`
**Descripción:** Mensajes de un canal  
**Response:**
```json
[
  {
    "id_mensaje": 1,
    "usuario": "María González",
    "mensaje": "Hola equipo",
    "fecha_envio": "2025-11-05T10:30:00",
    "leido": false
  }
]
```

#### POST `/api/chat/canales/:canalId/mensajes`
**Descripción:** Enviar mensaje  
**Body:**
```json
{
  "mensaje": "Hola, necesito ayuda con una solicitud"
}
```

#### GET `/api/chat/usuarios-en-linea`
**Descripción:** Usuarios conectados actualmente  
**Response:**
```json
[
  {
    "id_usuario": 1,
    "nombre_completo": "María González",
    "ultimo_ping": "2025-11-05T10:30:00"
  }
]
```

#### POST `/api/chat/estado`
**Descripción:** Actualizar estado online del usuario

#### GET `/api/chat/no-leidos`
**Descripción:** Cantidad de mensajes no leídos  
**Response:**
```json
{
  "total_no_leidos": 5,
  "por_canal": [
    {"id_canal": 1, "nombre_canal": "General", "no_leidos": 3},
    {"id_canal": 2, "nombre_canal": "Supervisores", "no_leidos": 2}
  ]
}
```

#### POST `/api/chat/canales/:canalId/marcar-leido`
**Descripción:** Marcar mensajes como leídos

#### POST `/api/setup-chat-db`
**Descripción:** Crear tablas de chat (setup inicial)

---

### 1️⃣1️⃣ MANTENIMIENTO Y SISTEMA (14 endpoints)

#### GET `/api/mantenimiento/status`
**Descripción:** Estado del sistema  
**Response:**
```json
{
  "servidor": {
    "uptime": 3600,
    "memoria_usada": "45 MB",
    "cpu": "12%"
  },
  "base_datos": {
    "conexiones_activas": 5,
    "tamaño_db": "250 MB"
  },
  "logs": {
    "tamaño_actual": "15 MB",
    "lineas_totales": 50000
  }
}
```

#### POST `/api/mantenimiento/cleanup`
**Descripción:** Limpiar datos antiguos  
**Body:**
```json
{
  "dias_antiguedad": 90,
  "incluir_logs": true,
  "incluir_solicitudes": false
}
```

#### POST `/api/mantenimiento/optimize`
**Descripción:** Optimizar base de datos (VACUUM, ANALYZE)

#### GET `/api/mantenimiento/analyze`
**Descripción:** Análisis de tablas y uso de espacio

#### POST `/api/mantenimiento/backup`
**Descripción:** Crear backup de base de datos  
**Response:**
```json
{
  "archivo": "backup_20251105_103000.sql",
  "tamaño": "25 MB",
  "ruta": "D:/backups/"
}
```

#### POST `/api/mantenimiento/export`
**Descripción:** Exportar datos para mantenimiento

#### POST `/api/admin/refresh-data`
**Descripción:** Refrescar caché de datos

#### POST `/api/admin/deshabilitar-auto-restauracion`
**Descripción:** Deshabilitar restauración automática

#### Otros:
- `GET /api/health` - Health check
- `GET /api/system/health` - Estado del sistema
- `GET /api/server/session` - ID de sesión del servidor
- `GET /api/test-db` - Test conexión a base de datos
- `GET /api/verificar-ip` - Verificar IP del cliente
- `GET /api/admin/tables` - Lista de tablas de BD

---

### 1️⃣2️⃣ LOGGING Y MONITOREO (5 endpoints)

#### GET `/api/logs/:tipo`
**Descripción:** Ver logs por tipo  
**Params:** `tipo` = `error`, `info`, `debug`, `http`, `database`  
**Query:** `?lineas=100`  
**Response:**
```json
{
  "tipo": "error",
  "lineas": [
    "[2025-11-05 10:30:00] [ERROR] [DATABASE] Connection timeout",
    "[2025-11-05 10:25:00] [ERROR] [HTTP] 500 - Internal Server Error"
  ],
  "total_lineas": 150
}
```

#### GET `/api/logs/stats/all`
**Descripción:** Estadísticas de todos los logs  
**Response:**
```json
{
  "error": {"total": 45, "hoy": 3},
  "info": {"total": 5000, "hoy": 120},
  "http": {"total": 15000, "hoy": 450},
  "database": {"total": 8000, "hoy": 200}
}
```

#### POST `/api/logs/rotate`
**Descripción:** Rotar logs manualmente (archivar logs actuales)

#### POST `/api/logs/clean`
**Descripción:** Limpiar logs antiguos  
**Body:**
```json
{
  "dias_antiguedad": 30
}
```

#### GET `/api/system/health`
**Descripción:** Estado de salud del sistema completo

---

### 1️⃣3️⃣ PLANTILLAS Y EDITOR (5 endpoints)

#### GET `/api/plantillas-etiquetas`
**Descripción:** Lista de plantillas de etiquetas

#### POST `/api/plantillas-etiquetas`
**Descripción:** Crear plantilla de etiqueta

#### POST `/api/preview-etiqueta`
**Descripción:** Previsualizar etiqueta antes de imprimir

#### POST `/api/test-print-visual`
**Descripción:** Impresión de prueba visual

#### GET `/api/datos-ejemplo`
**Descripción:** Datos de ejemplo para editor visual

---

### 1️⃣4️⃣ TESTING Y DEBUG (8 endpoints)

#### GET `/api/test-db`
**Descripción:** Test conexión a PostgreSQL

#### GET `/api/test-solicitudes`
**Descripción:** Test query de solicitudes

#### GET `/api/count-solicitudes`
**Descripción:** Contar solicitudes

#### GET `/api/test-zebra`
**Descripción:** Test impresora Zebra

#### GET `/api/debug-users`
**Descripción:** Debug lista de usuarios

#### POST `/api/setup-test-users`
**Descripción:** Crear usuarios de prueba

#### GET `/api/create-chat-tables`
**Descripción:** Crear tablas de chat

#### GET `/api/verificar-ip`
**Descripción:** Verificar IP del cliente

---

## 🎭 ROLES Y PERMISOS

### Costurera (`costurera`)
**Permisos:**
- ✅ Crear solicitudes de etiquetas
- ✅ Ver sus propias solicitudes
- ✅ Ver productos disponibles
- ✅ Chat interno
- ❌ Aprobar/rechazar solicitudes
- ❌ Ver solicitudes de otras costureras
- ❌ Administrar usuarios o productos

**Dashboards:**
- `costurera-dashboard.html`

### Supervisor (`encargada_embalaje`)
**Permisos:**
- ✅ Ver todas las solicitudes
- ✅ Aprobar/rechazar solicitudes
- ✅ Gestionar cola de impresión
- ✅ Ver estadísticas generales
- ✅ Activar/desactivar auto-services
- ✅ Actuar como costurera (delegación)
- ✅ Chat interno
- ❌ Administrar usuarios
- ❌ Configurar sistema

**Dashboards:**
- `supervisor-dashboard.html`

### Administrador (`administracion`)
**Permisos:**
- ✅ **TODOS** los permisos
- ✅ CRUD completo de usuarios
- ✅ CRUD completo de productos
- ✅ Configuración de sistema
- ✅ Exportación de reportes
- ✅ Mantenimiento de BD
- ✅ Ver logs del sistema
- ✅ Gestionar impresoras
- ✅ Chat interno

**Dashboards:**
- `administracion-mejorado.html`
- `monitor-sistema.html`

---

## 🔄 FLUJOS DE TRABAJO

### Flujo 1: Solicitud de Etiquetas (Normal)

```
┌─────────────┐
│  COSTURERA  │
└──────┬──────┘
       │
       │ 1. POST /api/crear-solicitud
       │    {id_producto: 1, cantidad: 50}
       ▼
┌─────────────────────────────────┐
│  SISTEMA                         │
│  • Genera número único           │
│  • Crea QR code                  │
│  • Guarda en BD                  │
│  • Estado: "pendiente"           │
└─────────┬───────────────────────┘
          │
          │ ¿Auto-services = true?
          │
    ┌─────┴─────┐
    │           │
   SÍ          NO
    │           │
    │           ▼
    │     ┌─────────────┐
    │     │ SUPERVISOR  │
    │     │ Revisa      │
    │     │ solicitud   │
    │     └──────┬──────┘
    │            │
    │            │ PUT /api/supervisor/aprobar/:id
    │            │ o rechazar
    ▼            ▼
┌─────────────────────────────────┐
│  COLA DE IMPRESIÓN              │
│  • Estado: "aprobada"            │
│  • Genera código ZPL             │
│  • Agrega a cola_impresion      │
└─────────┬───────────────────────┘
          │
          │ 2. Proceso automático
          ▼
┌─────────────────────────────────┐
│  IMPRESORA ZEBRA                │
│  • Recibe ZPL via TCP/IP        │
│  • Imprime 50 etiquetas         │
│  • IP: 192.168.1.34:9100        │
└─────────┬───────────────────────┘
          │
          │ 3. Actualiza estado
          ▼
┌─────────────────────────────────┐
│  SISTEMA                         │
│  • Estado: "impresa"             │
│  • Fecha impresión registrada   │
│  • Notifica a costurera         │
└─────────────────────────────────┘
```

### Flujo 2: Producto Especial (Combo)

```
┌─────────────┐
│  COSTURERA  │
└──────┬──────┘
       │
       │ POST /api/crear-solicitud-especial
       │ {id_producto_especial: 1, cantidad: 10}
       ▼
┌─────────────────────────────────┐
│  SISTEMA                         │
│  • Carga producto especial       │
│  • Busca componentes:            │
│    - Pantalón (id=1) x1          │
│    - Camisa (id=2) x1            │
│    - Gorra (id=3) x1             │
└─────────┬───────────────────────┘
          │
          │ Genera solicitud por cada componente
          ▼
┌─────────────────────────────────┐
│  SOLICITUDES INDIVIDUALES       │
│  • SOL-001: 10 Pantalones       │
│  • SOL-002: 10 Camisas          │
│  • SOL-003: 10 Gorras           │
└─────────┬───────────────────────┘
          │
          │ Proceso de aprobación normal
          ▼
┌─────────────────────────────────┐
│  COLA DE IMPRESIÓN              │
│  • 30 etiquetas total            │
│  • Agrupadas por solicitud       │
└─────────────────────────────────┘
```

### Flujo 3: Rotulado Godex

```
┌─────────────┐
│  USUARIO    │
└──────┬──────┘
       │
       │ POST /api/solicitudes/rotulado
       ▼
┌─────────────────────────────────┐
│  SISTEMA                         │
│  • Genera código ZPL rotulado    │
│  • Estado: "pendiente"           │
└─────────┬───────────────────────┘
          │
          │ Aprobación supervisor
          ▼
┌─────────────────────────────────┐
│  COLA ROTULADO                  │
│  • Tipo: "rotulado"              │
│  • Impresora: "GODEX"            │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  IMPRESORA GODEX G500           │
│  • IP: 192.168.1.35:9100        │
│  • Imprime rotulado             │
└─────────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN

### Archivo: `config/system.config`

```ini
[SERVER_CONFIG]
PORT=3012
JWT_SECRET=tu_clave_secreta_super_segura_2025

[DATABASE_CONFIG]
HOST=localhost
PORT=5432
DATABASE=postgres
USER=postgres
PASSWORD=alsimtex

[ZEBRA_CONFIG]
MODEL=ZD230
PRINTER_IP=192.168.1.34
PORT_NUMBER=9100
DPI=203
WIDTH_MM=100
HEIGHT_MM=150

[GODEX_CONFIG]
MODEL=G500
PRINTER_IP=192.168.1.35
PORT_NUMBER=9100
DPI=203

[COMPANY_CONFIG]
NAME=PRODUCTO PERUANO
WEBSITE=www.alsimtex.com
PHONE=Tel: 958003536
ADDRESS=HECHO EN PERU
```

### Variables de Entorno

```bash
# Puerto del servidor
PORT=3012

# JWT Secret
JWT_SECRET=clave_secreta_jwt

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=alsimtex

# Impresoras
ZEBRA_IP=192.168.1.34
GODEX_IP=192.168.1.35
```

---

## 📦 INSTALACIÓN Y DESPLIEGUE

### Requisitos Previos

- Node.js v18+ instalado
- PostgreSQL 12+ instalado y corriendo
- Impresoras Zebra/Godex en red local
- Windows 10/11 o Windows Server

### Paso 1: Clonar/Descargar Proyecto

```bash
cd D:\Informacion\DESARROLLO\
git clone [repositorio]
cd Sistema-EtiquetasV2.5\mi-app-etiquetas
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Crear Base de Datos

```bash
# Conectar a PostgreSQL con pgAdmin o psql
psql -U postgres

# Ejecutar script de creación
\i crear_base_datos.sql
```

### Paso 4: Configurar Sistema

Editar `config/system.config` con tus datos:
- IP de impresoras
- Credenciales de BD
- Puerto del servidor

### Paso 5: Iniciar Servidor

```bash
# Modo desarrollo
node server.js

# Modo producción (Windows Service)
# Ejecutar: INSTALAR-SISTEMA-GRAFICO.bat
```

### Paso 6: Acceder al Sistema

```
http://localhost:3012
```

**Usuario por defecto:**
- Email: `admin@empresa.com`
- Contraseña: `admin123`

---

## 🔐 SEGURIDAD

### Autenticación JWT

- Tokens con expiración de 24 horas
- Almacenamiento en cookies httpOnly
- Renovación automática de tokens

### Hash de Contraseñas

- bcrypt con 10 rondas de salt
- Contraseñas nunca almacenadas en texto plano

### Control de Acceso (RBAC)

- Middleware `verificarToken` valida JWT
- Middleware `verificarRol` valida permisos
- Rutas protegidas por nivel de acceso

### Validación de Datos

- Sanitización de inputs
- Validación de tipos de datos
- Protección contra SQL Injection (prepared statements)

---

## 📊 LOGGING

### Sistema de Logs Profesional

**Ubicación:** `logs/` y `historial_logs/`

**Tipos de logs:**
- `error.log` - Errores del sistema
- `info.log` - Información general
- `http.log` - Peticiones HTTP
- `database.log` - Queries de BD
- `printer.log` - Impresiones

**Rotación automática:**
- Cada 5MB o cada día
- Archivado en `historial_logs/`
- Formato: `YYYY-MM-DD_tipo.log`

**Niveles de log:**
```javascript
logger.error('Mensaje de error');
logger.warn('Advertencia');
logger.info('Información');
logger.debug('Debug detallado');
logger.httpRequest('POST', '/api/login', '192.168.1.100');
logger.httpResponse('POST', '/api/login', 200, 150);
```

---

## 🖨️ IMPRESIÓN

### Zebra ZD230 (Etiquetas)

**Especificaciones:**
- Resolución: 203 DPI
- Tamaño etiqueta: 100mm x 150mm
- Lenguaje: ZPL II
- Conexión: TCP/IP (puerto 9100)

**Ejemplo ZPL:**
```zpl
^XA
^FO50,50^A0N,50,50^FDPantalon Jean^FS
^FO50,150^BQN,2,6^FDQR-SOL-20251105-001^FS
^XZ
```

### Godex G500 (Rotulado)

**Especificaciones:**
- Resolución: 203 DPI
- Tamaño: Variable
- Lenguaje: ZPL compatible
- Conexión: TCP/IP (puerto 9100)

---

## 📱 INTERFACES DE USUARIO

### Dashboards Disponibles

1. **Login** (`login_fixed.html`)
   - Autenticación con email/código
   - Selección de usuario desde dropdown
   - Validación de credenciales

2. **Costurera Dashboard** (`costurera-dashboard.html`)
   - Solicitar etiquetas
   - Ver historial personal
   - Chat interno
   - Estadísticas personales

3. **Supervisor Dashboard** (`supervisor-dashboard.html`)
   - Aprobar/rechazar solicitudes
   - Ver cola de impresión
   - Gestionar costureras
   - Estadísticas generales

4. **Admin Dashboard** (`administracion-mejorado.html`)
   - CRUD usuarios
   - CRUD productos
   - Exportar reportes
   - Configuración sistema
   - Ver logs

5. **Monitor Sistema** (`monitor-sistema.html`)
   - Estado de impresoras
   - Cola de impresión en tiempo real
   - Logs del sistema
   - Estadísticas de rendimiento

6. **Editor Visual** (`editor-visual.html`)
   - Diseño de plantillas
   - Preview de etiquetas
   - Configuración de campos

---

## 🎨 TEMAS Y PERSONALIZACIÓN

### Sistema de Temas

**Archivo:** `gender-themes.css`

**Temas disponibles:**
- Masculino (azul)
- Femenino (rosa)
- Unisex (morado)
- Infantil (amarillo)

**Activación:**
```javascript
// Cambiar tema según producto
document.body.dataset.genero = 'masculino';
```

---

## 🔧 MANTENIMIENTO

### Tareas Programadas

1. **Limpieza de logs antiguos** (cada día)
2. **Rotación de logs** (cada 5MB)
3. **Vacuum de BD** (cada semana)
4. **Backup automático** (cada día)

### Comandos de Mantenimiento

```bash
# Limpiar logs
POST /api/logs/clean
Body: {"dias_antiguedad": 30}

# Optimizar BD
POST /api/mantenimiento/optimize

# Crear backup
POST /api/mantenimiento/backup

# Ver estado del sistema
GET /api/system/health
```

---

## 📞 SOPORTE Y CONTACTO

**Empresa:** Alsimtex  
**Teléfono:** 958003536  
**Web:** www.alsimtex.com

---

## 📝 CHANGELOG

### v2.5.0 (5 Nov 2025)
- ✅ Sistema completo de chat interno
- ✅ Exportación a Excel mejorada
- ✅ Dashboard administrativo renovado
- ✅ Sistema de logging profesional
- ✅ Auto-services para Zebra y Godex
- ✅ Gestión de productos especiales

### v2.1.0
- ✅ Integración con impresora Godex
- ✅ Sistema de rotulado
- ✅ Editor visual de etiquetas

### v2.0.0
- ✅ Autenticación JWT
- ✅ Sistema de roles
- ✅ Impresión automática Zebra

---

## 📄 LICENCIA

Propiedad de Alsimtex - Todos los derechos reservados

---

**Fin de la documentación**

*Última actualización: 5 de noviembre de 2025*
