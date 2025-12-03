# 🏷️ Sistema de Etiquetas v2.5

Sistema completo de gestión de etiquetas con impresión automatizada para Zebra ZD230 y Godex G530.

---

## 📚 DOCUMENTACIÓN PRINCIPAL

| Documento | Propósito | Cuándo usar |
|-----------|-----------|-------------|
| **INICIO-RAPIDO.md** | Instalación rápida en 5 pasos | Primera instalación |
| **bandeja/CONFIGURACION-RUTAS.md** | Guía completa de configuración | Problemas o instalación avanzada |
| **GUIA-USO-SISTEMA-ETIQUETAS.md** | Manual de usuario | Aprender a usar el sistema |
| **SISTEMA-AYUDA-IMPLEMENTADO.md** | Sistema de ayuda integrado | Referencia técnica |

---

## 🚀 INICIO RÁPIDO

### Para nueva instalación:

1. **Lee primero:** `INICIO-RAPIDO.md`
2. **Configura:** Cambiar 3 archivos (rutas, IPs, contraseñas)
3. **Instala:** `npm install` en 2 carpetas
4. **Crea BD:** Ejecutar `crear_base_datos.sql`
5. **Inicia:** Copiar `.bat` a `shell:startup`

**Tiempo estimado:** 15-20 minutos

---

## 📂 ESTRUCTURA DEL PROYECTO

```
mi-app-etiquetas/
│
├── 📄 INICIO-RAPIDO.md              ← Empieza aquí
├── 📄 config.json                   ← Configuración del servidor
├── 📄 server.js                     ← Servidor Node.js (puerto 3012)
├── 📄 package.json                  ← Dependencias del servidor
│
├── 📁 bandeja/                      ← Aplicación de bandeja del sistema
│   ├── 📄 main.js                   ← Aplicación Electron
│   ├── 📄 config.json               ← Configuración de bandeja
│   ├── 📄 bandeja.bat               ← ⚠️ CAMBIAR RUTA AQUÍ
│   ├── 📄 CONFIGURACION-RUTAS.md   ← Guía completa de configuración
│   └── 📄 INSTALAR-EN-STARTUP.bat  ← Instalador automático
│
├── 📁 base_data/                    ← Scripts de base de datos
│   ├── 📄 crear_base_datos.sql     ← ⚠️ EJECUTAR PRIMERO
│   ├── 📄 EJECUTAR-MIGRACION.sql   ← Migraciones de BD
│   └── 📄 cambiar-logo-camitex.sql ← Scripts de cambios
│
├── 📁 logos_dinamicos/              ← Logos ZPL para etiquetas
│   ├── 📄 logo-misti-zpl-generado.js
│   ├── 📄 icono-lavado-30-zpl.js
│   └── 📄 ... (11 archivos de logos)
│
├── 📁 public/                       ← Frontend (HTML/CSS/JS)
│   ├── 📄 index.html                ← Login
│   ├── 📄 dashboard-costurera.html  ← Panel costurera
│   ├── 📄 dashboard-supervisor.html ← Panel supervisor
│   └── 📄 manual-ayuda.html         ← Sistema de ayuda
│
├── 📁 founds/                       ← Recursos multimedia
│   ├── 📁 animations-info/          ← Videos tutoriales (5 videos)
│   └── 📁 work-founds/              ← Logos e iconos
│
├── 📁 migrations/                   ← Migraciones de BD (histórico)
│
└── 📁 documentation/                ← Documentación técnica
    ├── 📁 iniciadores/              ← Scripts .bat de instalación
    ├── 📁 pruebas/                  ← Tests y conversores
    └── 📄 README.md                 ← Índice de documentación
```

---

## ⚙️ REQUISITOS DEL SISTEMA

### Software:
- **Node.js** v16 o superior
- **PostgreSQL** v12 o superior
- **npm** (incluido con Node.js)
- **Windows** 10/11

### Hardware:
- **CPU:** Dual-core o superior
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Disco:** 500 MB libres
- **Red:** Ethernet o WiFi para impresoras

### Impresoras soportadas:
- **Zebra ZD230-203dpi** (Puerto: 9100)
- **Godex G530** (Puerto: 9100)

---

## 🔧 CONFIGURACIÓN INICIAL

### 1. Rutas del Proyecto

**Archivo:** `bandeja/bandeja.bat` (línea 17)

```bat
set PROJECT_DIR=D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
```

**Cambiar a tu ubicación:**
- `C:\SistemaEtiquetas\mi-app-etiquetas\bandeja`
- `C:\Program Files\Etiquetas\mi-app-etiquetas\bandeja`

### 2. Base de Datos

**Archivo:** `config.json` (raíz)

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "TU_PASSWORD",
    "database": "postgres"
  }
}
```

### 3. Impresoras

**Archivo:** `bandeja/config.json`

```json
{
  "printers": {
    "zebra": { "ip": "192.168.1.34", "port": 9100 },
    "godex": { "ip": "192.168.1.35", "port": 9100 }
  }
}
```

**¿Cómo obtener la IP?**
- Imprimir reporte de configuración (botón FEED al encender)
- Ver en el router → Dispositivos conectados
- Panel de la impresora → Network → TCP/IP

---

## 📦 INSTALACIÓN

### Paso 1: Instalar dependencias del servidor

```cmd
cd mi-app-etiquetas
npm install
```

### Paso 2: Instalar dependencias de bandeja

```cmd
cd bandeja
npm install
```

### Paso 3: Crear base de datos

```cmd
psql -U postgres -f base_data/crear_base_datos.sql
```

O desde pgAdmin: Abrir y ejecutar `base_data/crear_base_datos.sql`

### Paso 4: Configurar inicio automático

```cmd
cd bandeja
.\INSTALAR-EN-STARTUP.bat
```

---

## 🎮 USO DEL SISTEMA

### Iniciar manualmente:

**Servidor:**
```cmd
node server.js
```

**Bandeja:**
```cmd
cd bandeja
npm start
```

### Acceder al sistema:

1. Abrir navegador: `http://localhost:3012`
2. Iniciar sesión con tu usuario
3. Usar el dashboard según tu rol

### Menú de bandeja:

- **Iniciar Servidor** - Lanza el servidor Node.js
- **Detener Servidor** - Detiene el servidor
- **Reiniciar Servidor** - Reinicia el servidor
- **Abrir Sistema** - Abre navegador en localhost:3012
- **Ver Logs** - Ventana de logs en tiempo real
- **Configuración** - Opciones de auto-inicio

---

## 🎥 VIDEOS TUTORIALES

El sistema incluye 5 videos tutoriales integrados:

| Video | Duración | Ubicación |
|-------|----------|-----------|
| Video Explicativo | ~15s | Crear Solicitud |
| Aplicación Rotulado | ~15s | Proceso Impresión |
| Advertencia Usos | ~15s | Seguridad |
| Creador Producto | ~15s | Crear Producto |
| Editar Producto | ~15s | Editar Producto |

**Acceso:** Panel de ayuda → `manual-ayuda.html`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "No se encuentra el proyecto"
→ Verificar ruta en `bandeja.bat` línea 17

### "Puerto ocupado"
→ Cambiar puerto en ambos `config.json` (3012 → otro)

### "No conecta con PostgreSQL"
→ Verificar usuario/contraseña en `config.json`

### "No imprime"
→ Verificar IP de impresora con `ping 192.168.1.34`

### Ver logs:
- **Aplicación:** `bandeja/logs/app.log`
- **Servidor:** `bandeja/logs/servidor.log`
- **Errores:** `bandeja/logs/servidor-error.log`

---

## 📱 ACCESO DESDE OTROS DISPOSITIVOS

### 1. Obtener IP de tu PC:

```cmd
ipconfig
```

Buscar "Dirección IPv4" (ej: `192.168.1.100`)

### 2. Configurar firewall:

**PowerShell (como Administrador):**
```powershell
New-NetFirewallRule -DisplayName "Sistema Etiquetas" -Direction Inbound -LocalPort 3012 -Protocol TCP -Action Allow
```

### 3. Acceder desde otro dispositivo:

```
http://192.168.1.100:3012
```

---

## 🔒 SEGURIDAD

- **Puerto local:** 3012 (solo red local)
- **Base de datos:** PostgreSQL con autenticación
- **Logs:** Registro completo de todas las acciones
- **Validaciones:** SQL injection protection
- **Sesiones:** Token-based authentication

---

## 📊 ESTADÍSTICAS DEL SISTEMA

- **Líneas de código:** ~15,000
- **Archivos:** ~100
- **Dependencias:** Node.js + 50 paquetes npm
- **Base de datos:** 24 tablas, 89 índices
- **Videos:** 5 tutoriales integrados
- **Documentación:** 8 archivos MD

---

## 🆘 SOPORTE

### Documentación:
- `INICIO-RAPIDO.md` - Instalación rápida
- `bandeja/CONFIGURACION-RUTAS.md` - Configuración completa
- `GUIA-USO-SISTEMA-ETIQUETAS.md` - Manual de usuario

### Logs:
- `bandeja/logs/app.log` - Log de aplicación
- `bandeja/logs/servidor.log` - Log del servidor
- `bandeja/logs/servidor-error.log` - Errores del servidor

### Checklist:
1. ¿Node.js instalado? → `node --version`
2. ¿PostgreSQL corriendo? → `pg_isready`
3. ¿Rutas correctas? → Ver `bandeja.bat` línea 17
4. ¿IPs correctas? → Ver `config.json`
5. ¿BD creada? → `psql -U postgres -l`

---

## 🎯 FLUJO DE TRABAJO

```
1. Costurera inicia sesión
2. Busca producto por código/nombre/barras
3. Selecciona producto y cantidad
4. Solicita etiquetas
5. Si tiene auto-aprobación → Imprime directamente
6. Si no → Supervisor aprueba → Imprime
7. Etiquetas salen de impresora Zebra (QR) y Godex (rotulado)
8. Sistema registra todo en BD
```

---

## 📅 VERSIÓN

**Sistema Etiquetas v2.5**  
**Fecha:** 5 de noviembre de 2025  
**Estado:** Producción ✅

---

## 🎉 CARACTERÍSTICAS PRINCIPALES

- ✅ Impresión dual (Zebra + Godex)
- ✅ Auto-aprobación configurable
- ✅ Sistema de bandeja con inicio automático
- ✅ Watchdog para mantener servidor activo
- ✅ Logs en tiempo real
- ✅ Reconocimiento de voz (experimental)
- ✅ Chat interno entre usuarios
- ✅ Gestión de productos especiales (combos)
- ✅ Editor visual de etiquetas
- ✅ Múltiples logos y configuraciones
- ✅ Historial completo de solicitudes
- ✅ Estadísticas y reportes

---

**¿Primera vez?** → Lee `INICIO-RAPIDO.md`  
**¿Problemas?** → Lee `bandeja/CONFIGURACION-RUTAS.md`  
**¿Dudas de uso?** → Lee `GUIA-USO-SISTEMA-ETIQUETAS.md`
