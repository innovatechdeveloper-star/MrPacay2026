# ⚡ INICIO RÁPIDO - Nueva Instalación

## 🎯 LO PRIMERO: Cambiar estas 3 rutas

### 1️⃣ `bandeja/bandeja.bat` (línea 17)
```bat
set PROJECT_DIR=TU_RUTA_AQUI\mi-app-etiquetas\bandeja
```
Ejemplo: `C:\SistemaEtiquetas\mi-app-etiquetas\bandeja`

### 2️⃣ `config.json` (raíz del proyecto)
```json
{
  "database": {
    "host": "localhost",        // ← IP de PostgreSQL
    "password": "tu_password"   // ← Tu contraseña
  }
}
```

### 3️⃣ `bandeja/config.json`
```json
{
  "printers": {
    "zebra": { "ip": "192.168.1.34" },  // ← IP de tu Zebra
    "godex": { "ip": "192.168.1.35" }   // ← IP de tu Godex
  }
}
```

---

## 📦 Instalar dependencias

```cmd
cd mi-app-etiquetas
npm install

cd bandeja
npm install
```

---

## 🗄️ Crear base de datos

```cmd
psql -U postgres -f base_data/crear_base_datos.sql
```

---

## 🚀 Iniciar automáticamente

1. Editar `bandeja/INSTALAR-EN-STARTUP.ps1` (línea 20): cambiar ruta
2. Ejecutar:
   ```cmd
   cd bandeja
   .\INSTALAR-EN-STARTUP.bat
   ```

---

## ✅ Probar

1. Reiniciar Windows
2. Verificar ícono en bandeja del sistema
3. Abrir navegador: `http://localhost:3012`

---

**📖 Guía completa:** Ver `bandeja/CONFIGURACION-RUTAS.md`
