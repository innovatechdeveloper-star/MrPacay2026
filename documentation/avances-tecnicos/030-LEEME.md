# 📋 MANUAL DE INSTALACIÓN - MI-APP-ETIQUETAS

## 🎯 INSTALACIÓN AUTOMÁTICA (RECOMENDADO)

### Paso 1: Ejecutar instalador
1. **Doble clic** en `INSTALAR.bat`
2. El script verificará e instalará todo automáticamente
3. Seguir las instrucciones en pantalla

### Paso 2: Configurar base de datos
1. Abrir PostgreSQL (pgAdmin o línea de comandos)
2. Crear base de datos: `CREATE DATABASE mi_app_etiquetas;`
3. Ejecutar el script: `crear_base_datos.sql`

#### Detalles para crear la base de datos:
- **Paso 2.1**: Abre pgAdmin (viene con PostgreSQL).
- **Paso 2.2**: Conecta con tu usuario (por defecto "postgres").
- **Paso 2.3**: Ejecuta en la consola SQL: `CREATE DATABASE mi_app_etiquetas;`
- **Paso 2.4**: Conecta a la nueva BD "mi_app_etiquetas".
- **Paso 2.5**: Abre el archivo `crear_base_datos.sql` incluido en el proyecto.
- **Paso 2.6**: Ejecuta todo el script (botón "Run" o F5). Esto crea:
  - Tablas: usuarios, departamentos, productos, solicitudes_etiquetas, etc.
  - Datos iniciales: usuario admin@empresa.com con contraseña admin123.
- **Nota**: Si usas línea de comandos, ejecuta: `psql -U postgres -d mi_app_etiquetas -f crear_base_datos.sql`

### Paso 3: Configurar conexión
1. Editar `server.js` líneas 15-20
2. Cambiar datos de conexión PostgreSQL:
   ```javascript
   const pool = new Pool({
       user: 'tu_usuario',
       host: 'localhost',
       database: 'mi_app_etiquetas',
       password: 'tu_contraseña',
       port: 5432,
   });
   ```

### Paso 4: Iniciar aplicación
- **Opción A**: Doble clic en `iniciar_servidor.bat`
- **Opción B**: Doble clic en `iniciar_con_pm2.bat` (auto-reinicio)

---

## 🔧 INSTALACIÓN MANUAL

### Requisitos previos:
- Windows 10/11
- Node.js 16+ (https://nodejs.org/)
- PostgreSQL 12+ (https://www.postgresql.org/)

### Pasos:
1. Instalar Node.js desde https://nodejs.org/
2. Instalar PostgreSQL desde https://www.postgresql.org/
3. Abrir terminal en la carpeta de la aplicación
4. Ejecutar: `npm install`
5. Configurar base de datos (ver Paso 2 arriba)
6. Configurar conexión (ver Paso 3 arriba)
7. Ejecutar: `npm start`

---

## 🌐 ACCESO AL SISTEMA

### URLs:
- **Local**: http://localhost:3010
- **Red local**: http://[IP-DEL-PC]:3010
- **Tablet**: http://192.168.1.33:3010

### IPs autorizadas por defecto:
- 127.0.0.1 (localhost)
- 192.168.1.35 (PC principal)
- 192.168.1.33 (tablet)

### Usuario por defecto:
- **Email**: admin@empresa.com
- **Contraseña**: admin123
- **Rol**: Administración

---

## 🚀 INICIO AUTOMÁTICO CON WINDOWS

### Con PM2 (Recomendado):
1. Ejecutar `iniciar_con_pm2.bat`
2. El servidor se reiniciará automáticamente si falla

### Como servicio de Windows:
1. Instalar NSSM: https://nssm.cc/
2. Ejecutar: `nssm install MiAppEtiquetas`
3. Configurar path: `C:\ruta\a\tu\aplicacion\iniciar_servidor.bat`

### En inicio de Windows:
1. Copiar `iniciar_con_pm2.bat` a:
   `C:\Users\[usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

---

## 📊 LOGS Y MONITOREO

### Ubicaciones de logs:
- **Instalación**: `logs/instalacion_*.log`
- **Servidor**: `logs/servidor_*.log`
- **PM2**: `pm2 logs mi-app-etiquetas`
- **Aplicación**: Consola del servidor

### Comandos útiles:
```bash
# Ver estado PM2
pm2 list

# Ver logs en tiempo real
pm2 logs mi-app-etiquetas

# Reiniciar aplicación
pm2 restart mi-app-etiquetas

# Detener aplicación
pm2 stop mi-app-etiquetas

# Verificar sistema
VERIFICAR_SISTEMA.bat
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Variables de entorno (config.env):
```env
PORT=3010
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_app_etiquetas
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

### Cambiar puerto:
1. Editar `server.js` línea 12: `const PORT = 3010;`
2. O usar variable de entorno: `PORT=3011`

### Añadir IPs autorizadas:
1. Editar `server.js` líneas 25-30
2. Agregar IP a la lista `ipsPermitidas`

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: Puerto 3010 en uso
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3010
# Terminar proceso por PID
taskkill /F /PID [numero_pid]
```

### Error: Base de datos no conecta
1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `server.js`
3. Verificar que la base de datos existe

### Error: Node.js no encontrado
1. Reinstalar Node.js desde https://nodejs.org/
2. Reiniciar terminal/computador
3. Verificar con: `node --version`

### Error: Dependencias no instaladas
```bash
# Reinstalar dependencias
npm install --force
# O limpiar cache
npm cache clean --force
npm install
```

---

## 📞 SOPORTE

### Archivos importantes:
- `server.js` - Servidor principal
- `package.json` - Dependencias
- `ecosystem.config.js` - Configuración PM2
- `crear_base_datos.sql` - Script de BD

### Para reportar problemas:
1. Ejecutar `VERIFICAR_SISTEMA.bat`
2. Enviar archivo de reporte generado
3. Incluir logs de la carpeta `logs/`

---

## 📦 ARCHIVOS INCLUIDOS

```
mi-app-etiquetas/
├── INSTALAR.bat              # 🚀 Instalador automático
├── iniciar_servidor.bat      # ▶️  Inicio normal
├── iniciar_con_pm2.bat      # 🔄 Inicio con PM2
├── detener_servidor.bat     # ⏹️  Detener PM2
├── VERIFICAR_SISTEMA.bat    # 🔍 Diagnóstico
├── crear_base_datos.sql     # 🐘 Script PostgreSQL
├── LEEME.md                 # 📋 Manual (este archivo)
├── server.js                # ⚙️  Servidor principal
├── package.json             # 📦 Dependencias
├── ecosystem.config.js      # 🔧 Config PM2
└── public/                  # 🌐 Archivos web
    ├── index.html
    ├── supervisor-dashboard.html
    ├── costurera-dashboard.html
    └── ...
```

---

**¡Listo para usar!** 🎉