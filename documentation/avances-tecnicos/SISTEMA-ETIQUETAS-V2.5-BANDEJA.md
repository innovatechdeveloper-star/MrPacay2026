# Sistema Etiquetas v2.5 - Aplicación de Bandeja con Configuración Dinámica

**Fecha:** 3 de Noviembre de 2025  
**Versión:** 2.5.0  
**Tipo:** Sistema de escritorio con servicio de Windows

---

## 🎯 Objetivo

Convertir el Sistema de Etiquetas en una aplicación profesional de escritorio que:
- Corre como servicio de Windows (sin CMD visible)
- Se controla desde la bandeja del sistema
- Permite configuración dinámica sin tocar código
- Guarda logs históricos automáticamente
- Inicia automáticamente con Windows

## ✨ Características Principales

### 1. **Instalación Inteligente**
- Pregunta la ubicación de tu carpeta actual
- No mueve archivos, solo instala el servicio
- Crea `config.json` con valores por defecto
- Configura inicio automático con Windows

### 2. **Ícono en Bandeja del Sistema**
Menú completo con acceso a:
- **🌐 Abrir:** Acceso rápido a todos los dashboards
- **🔌 Servidor:** Iniciar/Detener/Reiniciar
- **🔍 Diagnóstico:** Logs en tiempo real + historial
- **⚙️ Configuración:** Panel de configuración dinámica
- **ℹ️ Acerca de:** Información del sistema

### 3. **Configuración Dinámica** ⭐
Modifica desde la bandeja (sin tocar código):

**Base de Datos:**
- Host (localhost)
- Puerto (5432)
- Database (postgres)
- Usuario (postgres)
- Contraseña (alsimtex)

**Impresoras:**
- Zebra IP/Puerto (192.168.1.34:9100)
- Godex IP/Puerto (192.168.1.33:9100)

**Servidor:**
- Puerto HTTP (3011)

Al guardar, **reinicia automáticamente** el servidor con la nueva configuración.

### 4. **Sistema de Logs Avanzado**
- **Ver en tiempo real:** Abre CMD con logs live
- **Guardar automático:** Al cerrar, pregunta si guardar
- **Formato:** `DDMMYY_HH-MMam.log` (ej: `031125_10-55am.log`)
- **Limpieza:** Elimina logs > 30 días
- **Ubicación:** `historial_logs/`

## 📁 Estructura del Proyecto

```
mi-app-etiquetas/
├── server.js                    ← Servidor principal (sin cambios)
├── config.json                  ← Configuración dinámica (nuevo)
├── historial_logs/              ← Logs guardados (nuevo)
│   ├── 031125_10-55am.log
│   ├── 031125_02-30pm.log
│   └── ...
└── sistema-bandeja/             ← Sistema de bandeja (nuevo)
    ├── README.md
    ├── package.json
    ├── instalador/
    │   ├── install.js           ← Instalador del servicio
    │   └── uninstall.js         ← Desinstalador
    ├── tray-app/
    │   ├── main.js              ← Aplicación Electron
    │   ├── config-window.html   ← Ventana de configuración
    │   └── icon.png             ← Ícono de la bandeja
    └── install-path.txt         ← Ruta del proyecto (generado)
```

## 🚀 Instalación

### Paso 1: Instalar dependencias
```bash
cd sistema-bandeja
npm install
```

### Paso 2: Ejecutar instalador
```bash
cd instalador
node install.js
```

El instalador te preguntará:
```
📁 Ingresa la ruta completa de tu carpeta del proyecto
(Ejemplo: D:\mi-app-etiquetas\mi-app-etiquetas)

Ruta: _
```

Ingresas: `D:\mi-app-etiquetas\mi-app-etiquetas` (o la ruta donde tengas el proyecto)

### Paso 3: Iniciar aplicación de bandeja
```bash
cd sistema-bandeja
npm start
```

¡Listo! Verás el ícono 🏷️ en la bandeja del sistema.

## ⚙️ Uso

### Abrir dashboards:
1. Click derecho en 🏷️
2. Hover sobre "🌐 Abrir"
3. Click en el dashboard deseado
4. Se abre en tu navegador

### Configurar sistema:
1. Click derecho en 🏷️
2. Click en "⚙️ Configuración"
3. Modifica los valores
4. Click en "💾 Guardar y Reiniciar"
5. El servidor se reinicia automáticamente

### Ver logs:
1. Click derecho en 🏷️
2. "🔍 Diagnóstico" → "📊 Ver logs en tiempo real"
3. Se abre CMD con logs
4. Al cerrar CMD: "¿Guardar log? Sí/No"
5. Si guardas: se guarda en `historial_logs/`

### Control del servidor:
- **Iniciar:** "🔌 Servidor" → "▶️ Iniciar"
- **Detener:** "🔌 Servidor" → "⏸️ Detener"
- **Reiniciar:** "🔌 Servidor" → "🔄 Reiniciar"

## 🔧 Modificar configuración manualmente

Si prefieres editar `config.json` directamente:

```json
{
    "database": {
        "host": "localhost",
        "port": 5432,
        "database": "postgres",
        "user": "postgres",
        "password": "alsimtex"
    },
    "printers": {
        "zebra": {
            "ip": "192.168.1.34",
            "port": 9100
        },
        "godex": {
            "ip": "192.168.1.33",
            "port": 9100
        }
    },
    "server": {
        "port": 3011
    }
}
```

Después reinicia el servidor desde la bandeja.

## 🗑️ Desinstalación

```bash
cd sistema-bandeja/instalador
node uninstall.js
```

Esto:
- ❌ Detiene el servicio
- ❌ Elimina el servicio de Windows
- ⚠️ NO elimina archivos del proyecto

## 📝 Notas Técnicas

### Servicio de Windows
- **Nombre:** "Sistema Etiquetas v2.5"
- **Tipo:** Servicio de aplicación
- **Inicio:** Automático
- **Ejecuta:** `server.js` con Node.js

### Configuración dinámica
- **Archivo:** `config.json` en raíz del proyecto
- **Lectura:** Al iniciar el servidor
- **Aplicación:** Requiere reinicio del servidor

### Formato de logs
- **Patrón:** `DDMMYY_HH-MMam.log`
- **Ejemplo:** `031125_10-55am.log` = 3 nov 2025, 10:55 AM
- **Retención:** Limpieza automática > 30 días

## 🔄 Actualizar el sistema

1. Actualiza los archivos del proyecto (git pull, etc.)
2. Desde la bandeja: "🔄 Reiniciar"
3. Los cambios se aplican automáticamente

**No es necesario reinstalar el servicio** a menos que cambies la ubicación de la carpeta.

## 🎨 Personalización

### Cambiar ícono de bandeja:
1. Reemplaza `sistema-bandeja/tray-app/icon.png`
2. Reinicia la aplicación de bandeja

### Cambiar puerto por defecto:
1. Edita `config.json`
2. Cambia `server.port`
3. Reinicia desde la bandeja

### Agregar nuevos dashboards al menú:
1. Edita `sistema-bandeja/tray-app/main.js`
2. En `createContextMenu()`, agrega item en submenu "Abrir"
3. Reinicia la aplicación de bandeja

## ❓ Troubleshooting

**Problema:** "No se encontró la ruta de instalación"  
**Solución:** Ejecuta nuevamente el instalador

**Problema:** "Error al iniciar servicio"  
**Solución:** Verifica que `server.js` existe en la ruta especificada

**Problema:** "No puedo acceder a los dashboards"  
**Solución:** Verifica que el servicio esté iniciado ("🔌 Servidor" → "▶️ Iniciar")

**Problema:** "Config.json no se actualiza"  
**Solución:** Usa "🔄 Reiniciar" después de guardar cambios

## 📊 Comparación: Antes vs Después

| Aspecto | Antes (v2.0) | Después (v2.5) |
|---------|--------------|----------------|
| Inicio | Abrir VSCode + Terminal | Automático con Windows |
| Control | Comandos en terminal | Menú de bandeja |
| Config | Editar código fuente | Panel gráfico |
| Logs | Ver en terminal | Guardado automático |
| Profesionalismo | Modo desarrollo | Aplicación de producción |

## 🎯 Próximas mejoras (v3.0)

- [ ] Instalador EXE con NSIS
- [ ] Notificaciones del sistema
- [ ] Actualización automática
- [ ] Dashboard de estadísticas en la bandeja
- [ ] Backup automático de configuración

---

**Versión:** 2.5.0  
**Última actualización:** 3 de Noviembre de 2025  
**Desarrollado para:** Alsimtex - Sistema de Etiquetas
