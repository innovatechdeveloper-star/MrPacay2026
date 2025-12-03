# 🔧 GUÍA DE CONFIGURACIÓN - Sistema Etiquetas v2.5

**Fecha:** 5 de noviembre de 2025  
**Propósito:** Configurar el sistema en diferentes computadoras con rutas, IPs y puertos personalizados

---

## 📋 TABLA DE CONTENIDOS

1. [Rutas del Sistema](#-rutas-del-sistema)
2. [Configuración de Red](#-configuración-de-red)
3. [Configuración de Base de Datos](#-configuración-de-base-de-datos)
4. [Configuración de Impresoras](#-configuración-de-impresoras)
5. [Inicio Automático](#-inicio-automático)
6. [Checklist de Instalación](#-checklist-de-instalación)

---

## 📂 RUTAS DEL SISTEMA

### 🔴 IMPORTANTE: Cambiar PRIMERO antes de instalar

El sistema tiene rutas hardcodeadas que **DEBES** cambiar según tu instalación:

### 1. Ruta Base del Proyecto

**Ubicación original (Computadora de desarrollo):**
```
D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
```

**¿Dónde cambiarla?**

#### A. En `bandeja/bandeja.bat` (línea 13):
```bat
set PROJECT_DIR=D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
```

**Cambiar a TU ruta**, por ejemplo:
- Si instalaste en `C:\Sistemas\Etiquetas\`: 
  ```bat
  set PROJECT_DIR=C:\Sistemas\Etiquetas\mi-app-etiquetas\bandeja
  ```
- Si instalaste en `C:\Program Files\SistemaEtiquetas\`:
  ```bat
  set PROJECT_DIR=C:\Program Files\SistemaEtiquetas\mi-app-etiquetas\bandeja
  ```

#### B. En `INSTALAR-EN-STARTUP.ps1` (línea ~20):
```powershell
$projectPath = "D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja"
```

**Cambiar a la misma ruta que usaste arriba.**

#### C. En `bandeja/main.js` (línea 6-8):
```javascript
const BASE_DIR = path.join(__dirname, '..');
const LOGS_DIR = path.join(__dirname, 'logs');
const CONFIG_FILE = path.join(__dirname, 'config.json');
```

**Estas rutas son RELATIVAS**, no necesitas cambiarlas ✅

---

## 🌐 CONFIGURACIÓN DE RED

### 1. Puerto del Servidor

**Archivo:** `config.json` (en la raíz del proyecto)

**Ubicación:**
```
mi-app-etiquetas/config.json
```

**Línea a modificar:**
```json
{
  "servidor": {
    "PORT": 3012  // ← CAMBIAR AQUÍ
  }
}
```

**Puerto por defecto:** `3012`

**¿Cuándo cambiar?**
- Si el puerto 3012 ya está ocupado en tu computadora
- Si tu red tiene restricciones de firewall
- Si quieres usar otro puerto (ej: 8080, 5000, etc.)

**Después de cambiar:**
1. Editar también `bandeja/config.json`:
   ```json
   {
     "server_port": 3012  // ← Debe coincidir con config.json
   }
   ```

### 2. IP de Acceso

**Archivo:** `config.json`

**Línea a modificar:**
```json
{
  "servidor": {
    "IP_SERVIDOR": "192.168.1.22"  // ← CAMBIAR A TU IP
  }
}
```

**¿Cómo obtener tu IP?**
```cmd
ipconfig
```
Busca "IPv4" en tu adaptador de red activo (ej: `192.168.1.100`)

**¿Cuándo cambiar?**
- Para acceder desde otras computadoras en la red
- Para usar reconocimiento de voz desde tablets/celulares

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### PostgreSQL Connection

**Archivo:** `config.json`

**Sección a modificar:**
```json
{
  "database": {
    "host": "localhost",     // ← IP del servidor PostgreSQL
    "port": 5432,            // ← Puerto PostgreSQL
    "user": "postgres",      // ← Usuario de base de datos
    "password": "tu_password", // ← Contraseña
    "database": "postgres"   // ← Nombre de la base de datos
  }
}
```

### Opciones comunes:

**A. PostgreSQL en la misma máquina:**
```json
"host": "localhost"
```

**B. PostgreSQL en otra máquina de la red:**
```json
"host": "192.168.1.50"
```

**C. PostgreSQL en servidor remoto:**
```json
"host": "db.miempresa.com"
```

### ⚠️ IMPORTANTE: Crear la base de datos

**Antes de iniciar el servidor:**

1. Abrir pgAdmin o línea de comandos
2. Ejecutar el script:
   ```
   base_data/crear_base_datos.sql
   ```

**Comando desde terminal:**
```bash
psql -U postgres -f base_data/crear_base_datos.sql
```

---

## 🖨️ CONFIGURACIÓN DE IMPRESORAS

### IPs de las Impresoras

**Archivo:** `bandeja/config.json`

**Sección a modificar:**
```json
{
  "printers": {
    "zebra": {
      "ip": "192.168.1.34",  // ← IP de impresora Zebra ZD230
      "port": 9100           // ← Puerto (generalmente 9100)
    },
    "godex": {
      "ip": "192.168.1.35",  // ← IP de impresora Godex G530
      "port": 9100           // ← Puerto (generalmente 9100)
    }
  }
}
```

### ¿Cómo obtener la IP de una impresora?

**Método 1: Imprimir reporte de configuración**
- Apaga la impresora
- Mantén presionado el botón FEED mientras la enciendes
- Imprimirá un reporte con su IP

**Método 2: Desde el panel de la impresora**
- Menú → Network → TCP/IP → IP Address

**Método 3: Desde el router**
- Accede a tu router (ej: 192.168.1.1)
- Ve a "Dispositivos conectados"
- Busca la impresora por nombre

### Configurar IP estática (RECOMENDADO)

Para evitar que la IP cambie:

1. **Desde el router:** Asigna IP fija por MAC address
2. **Desde la impresora:** Configura IP estática en el menú de red

---

## 🚀 INICIO AUTOMÁTICO

### Opción 1: shell:startup (RECOMENDADO)

**Pasos:**

1. **Abrir carpeta de inicio:**
   - Presiona `Win + R`
   - Escribe `shell:startup`
   - Presiona Enter

2. **Editar `bandeja.bat`** (si ya lo copiaste):
   - Clic derecho → Editar
   - Cambiar la línea 13:
     ```bat
     set PROJECT_DIR=TU_RUTA_AQUI\mi-app-etiquetas\bandeja
     ```
   - Guardar y cerrar

3. **O usar el instalador automático:**
   ```cmd
   cd bandeja
   .\INSTALAR-EN-STARTUP.bat
   ```
   (Requiere editar primero `INSTALAR-EN-STARTUP.ps1` con tu ruta)

### Opción 2: Programador de Tareas (Avanzado)

**Ventajas:**
- Más control sobre cuándo inicia
- Puede ejecutarse con privilegios de administrador
- Puede iniciar aunque no hayas iniciado sesión

**Pasos:**
1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Desencadenador: "Al iniciar sesión"
4. Acción: Iniciar programa
5. Programa: `npm`
6. Argumentos: `start`
7. Iniciar en: `D:\tu\ruta\bandeja`

---

## ✅ CHECKLIST DE INSTALACIÓN

### Antes de instalar en una nueva computadora:

- [ ] **1. Copiar todo el proyecto a la nueva ubicación**
  - Ej: `C:\Sistemas\SistemaEtiquetas\`

- [ ] **2. Editar `bandeja/bandeja.bat`:**
  - Cambiar `PROJECT_DIR` con la nueva ruta

- [ ] **3. Editar `config.json` (raíz del proyecto):**
  - [ ] Puerto del servidor (`PORT`)
  - [ ] IP del servidor (`IP_SERVIDOR`)
  - [ ] Host de PostgreSQL (`database.host`)
  - [ ] Usuario y contraseña de PostgreSQL

- [ ] **4. Editar `bandeja/config.json`:**
  - [ ] Puerto del servidor (`server_port`)
  - [ ] IP de impresora Zebra (`printers.zebra.ip`)
  - [ ] IP de impresora Godex (`printers.godex.ip`)

- [ ] **5. Instalar dependencias:**
  ```cmd
  cd mi-app-etiquetas
  npm install
  
  cd bandeja
  npm install
  ```

- [ ] **6. Crear base de datos:**
  ```cmd
  psql -U postgres -f base_data/crear_base_datos.sql
  ```

- [ ] **7. Probar el servidor manualmente:**
  ```cmd
  node server.js
  ```
  Abrir navegador: `http://localhost:3012`

- [ ] **8. Probar la bandeja manualmente:**
  ```cmd
  cd bandeja
  npm start
  ```

- [ ] **9. Configurar inicio automático:**
  - Editar `INSTALAR-EN-STARTUP.ps1` con la nueva ruta
  - Ejecutar `INSTALAR-EN-STARTUP.bat`

- [ ] **10. Reiniciar y verificar:**
  - Reiniciar Windows
  - Verificar que el ícono aparece en la bandeja
  - Verificar que el servidor inicia automáticamente

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: "No se encuentra el proyecto"

**Causa:** La ruta en `bandeja.bat` es incorrecta

**Solución:**
1. Abrir `bandeja.bat`
2. Verificar que `PROJECT_DIR` apunta a la carpeta correcta
3. Verificar que `main.js` existe en esa carpeta

### Problema: "Puerto ocupado"

**Causa:** Otro servicio usa el puerto 3012

**Solución:**
1. Cambiar puerto en `config.json` (raíz)
2. Cambiar puerto en `bandeja/config.json`
3. Reiniciar ambos servicios

### Problema: "No conecta con PostgreSQL"

**Causa:** Configuración de base de datos incorrecta

**Solución:**
1. Verificar que PostgreSQL está corriendo
2. Verificar usuario/contraseña en `config.json`
3. Verificar que la base de datos existe
4. Si es remoto, verificar firewall (puerto 5432)

### Problema: "No imprime"

**Causa:** IP de impresora incorrecta o impresora apagada

**Solución:**
1. Hacer ping a la impresora: `ping 192.168.1.34`
2. Verificar que la impresora está encendida
3. Verificar IP en `bandeja/config.json`
4. Imprimir reporte de configuración de la impresora

### Problema: "El ícono no aparece en la bandeja"

**Causa:** Archivo en startup apunta a ruta incorrecta

**Solución:**
1. Presionar `Win + R` → `shell:startup`
2. Abrir `bandeja.bat`
3. Verificar `PROJECT_DIR`
4. Eliminar y volver a instalar con el instalador

---

## 📞 CONTACTO Y SOPORTE

**Desarrollador:** Sistema Etiquetas v2.5  
**Fecha de última actualización:** 5 de noviembre de 2025

**Para soporte:**
- Revisar logs en: `bandeja/logs/app.log`
- Revisar logs del servidor: `bandeja/logs/servidor.log`
- Verificar estado de impresoras en el panel de administración

---

## 📊 RESUMEN DE ARCHIVOS A EDITAR

| Archivo | Ubicación | Qué cambiar | Cuándo |
|---------|-----------|-------------|--------|
| `bandeja.bat` | `bandeja/` | `PROJECT_DIR` (línea 13) | Siempre en nueva PC |
| `config.json` | Raíz del proyecto | Puerto, IP, DB | Siempre en nueva PC |
| `bandeja/config.json` | `bandeja/` | Puerto, IPs impresoras | Siempre en nueva PC |
| `INSTALAR-EN-STARTUP.ps1` | `bandeja/` | `$projectPath` (línea 20) | Si usas instalador |

**Tip:** Busca en los archivos el texto `192.168.1` o `D:\Informacion` para encontrar todas las rutas hardcodeadas.

---

## 🎯 EJEMPLO COMPLETO: Nueva Instalación

**Escenario:** Instalar en computadora nueva con ruta `C:\SistemaEtiquetas\`

### Paso 1: Copiar proyecto
```
C:\SistemaEtiquetas\mi-app-etiquetas\
```

### Paso 2: Editar bandeja.bat
```bat
set PROJECT_DIR=C:\SistemaEtiquetas\mi-app-etiquetas\bandeja
```

### Paso 3: Editar config.json (raíz)
```json
{
  "servidor": {
    "PORT": 3012,
    "IP_SERVIDOR": "192.168.1.100"  // IP de esta PC
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "mipassword123",
    "database": "sistema_etiquetas"
  }
}
```

### Paso 4: Editar bandeja/config.json
```json
{
  "server_port": 3012,
  "printers": {
    "zebra": {
      "ip": "192.168.1.40",  // IP de Zebra en esta red
      "port": 9100
    },
    "godex": {
      "ip": "192.168.1.41",  // IP de Godex en esta red
      "port": 9100
    }
  }
}
```

### Paso 5: Instalar y probar
```cmd
cd C:\SistemaEtiquetas\mi-app-etiquetas
npm install

cd bandeja
npm install

cd ..
node server.js  # Probar servidor

# En otra terminal:
cd bandeja
npm start  # Probar bandeja
```

### Paso 6: Configurar inicio automático
```cmd
cd C:\SistemaEtiquetas\mi-app-etiquetas\bandeja
# Editar INSTALAR-EN-STARTUP.ps1 primero
.\INSTALAR-EN-STARTUP.bat
```

¡Listo! Sistema configurado en la nueva computadora. 🎉
