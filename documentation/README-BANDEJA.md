# 🏷️ Sistema Etiquetas v2.5 - Sistema de Bandeja INSTALADO ✅

## 🎉 ¡NUEVO! Aplicación de Bandeja del Sistema

Tu Sistema Etiquetas ahora puede ejecutarse desde la **bandeja del sistema de Windows** sin ventanas CMD molestas.

---

## ⚡ INICIO RÁPIDO

### 1️⃣ Primera Vez - Instalar Dependencias
```cmd
INSTALAR-BANDEJA.bat
```
⏱️ Espera 3-10 minutos (descarga ~255 MB)

### 2️⃣ Ejecutar Aplicación
```cmd
EJECUTAR-SISTEMA-ETIQUETAS.bat
```

### 3️⃣ Buscar Icono
Mira la barra de tareas (junto al reloj) → Icono 🏷️

---

## 📚 Documentación

### Guías Disponibles

| Documento | Descripción |
|-----------|-------------|
| **`COMO-EJECUTAR-AHORA.md`** | ⚡ Instrucciones inmediatas paso a paso |
| **`GUIA-RAPIDA-BANDEJA.md`** | 📖 Guía rápida de uso y configuración |
| **`bandeja/README.md`** | 📚 Documentación técnica completa |
| **`RESUMEN-IMPLEMENTACION-BANDEJA.md`** | 🔍 Resumen de lo implementado |

---

## ✨ ¿Qué Puedes Hacer Ahora?

### Desde el Icono de Bandeja (Clic Derecho)
- 🚀 **Iniciar/Detener Servidor** - Sin ventanas CMD
- 🌐 **Abrir Sistema** - En navegador (localhost:3012)
- 📝 **Ver Logs en Tiempo Real** - Ventana visual
- ⚙️ **Configurar Inicio Automático** - Con Windows
- 📊 **Ver Estado** - Servidor + Impresoras

### Watchdog Automático
- ✅ Verifica cada 30 segundos si el servidor responde
- ✅ Reinicia automáticamente si se cuelga
- ✅ Notifica eventos importantes

---

## 🔧 Configurar Inicio con Windows

### Opción 1: Desde la Aplicación (FÁCIL) ⭐
1. Ejecuta: `EJECUTAR-SISTEMA-ETIQUETAS.bat`
2. Clic derecho en icono 🏷️
3. `⚙️ Configuración`
4. Marcar: `☑ Iniciar con Windows`

### Opción 2: Programador de Tareas
Ver instrucciones en: `COMO-EJECUTAR-AHORA.md`

---

## 📂 Estructura del Proyecto

```
mi-app-etiquetas/
│
├── bandeja/                              ← Nueva carpeta
│   ├── main.js                          ← Lógica Electron
│   ├── preload.js                       ← IPC seguro
│   ├── package.json                     ← Dependencias
│   ├── config.json                      ← Configuración
│   ├── README.md                        ← Documentación
│   └── logs/                            ← Logs generados
│
├── EJECUTAR-SISTEMA-ETIQUETAS.bat       ← ⚡ Ejecutar aplicación
├── INSTALAR-BANDEJA.bat                 ← 📦 Instalar dependencias
├── COMO-EJECUTAR-AHORA.md               ← 🚀 Instrucciones inmediatas
├── GUIA-RAPIDA-BANDEJA.md               ← 📖 Guía rápida
│
└── server.js                            ← Modificado (+endpoint /health)
```

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado (v14+)
- [ ] PostgreSQL corriendo (puerto 5432)
- [ ] Dependencias instaladas: `INSTALAR-BANDEJA.bat`
- [ ] Aplicación ejecutada: `EJECUTAR-SISTEMA-ETIQUETAS.bat`
- [ ] Icono aparece en bandeja del sistema
- [ ] Servidor inicia correctamente (puerto 3012)
- [ ] Configurado inicio automático (opcional)

---

## 🎯 Beneficios

### ✅ ANTES vs AHORA

**ANTES:**
- ❌ Abrir CMD manualmente
- ❌ `cd` a la carpeta
- ❌ `node server.js`
- ❌ Dejar CMD abierto todo el día
- ❌ Si se cierra = servidor caído

**AHORA:**
- ✅ Icono en bandeja del sistema
- ✅ Start/Stop desde menú
- ✅ Sin ventanas CMD visibles
- ✅ Watchdog automático
- ✅ Inicio con Windows
- ✅ Logs profesionales

---

## 🆘 Ayuda Rápida

### Problema: "Node.js no está instalado"
**Solución:** Descargar desde https://nodejs.org/

### Problema: "Puerto 3012 ocupado"
**Solución:** Desde el menú: `🛑 Detener Servidor` → `🚀 Iniciar Servidor`

### Problema: Icono no aparece
**Solución:** Esperar 10-15 segundos después de ejecutar el .bat

### Más Ayuda
Ver documentación completa en: `bandeja/README.md`

---

## 🔗 Enlaces Rápidos

- **Endpoint Health:** http://localhost:3012/health
- **Sistema Web:** http://localhost:3012
- **Logs:** `bandeja/logs/`
- **Config:** `bandeja/config.json`

---

## 📞 Información del Sistema

**Versión:** Sistema Etiquetas v2.5 + Bandeja  
**Tecnología:** Electron 27.0.0 + Node.js + Express  
**Puerto:** 3012  
**Base de Datos:** PostgreSQL (puerto 5432)  
**Impresoras:** Zebra ZD230 (192.168.1.34), Godex G500 (192.168.1.35)  

---

## 🚀 Próximo Paso

```cmd
INSTALAR-BANDEJA.bat
```

Luego:
```cmd
EJECUTAR-SISTEMA-ETIQUETAS.bat
```

¡Y listo! 🎉

---

**Fecha de Implementación:** 5 de Noviembre de 2025  
**Estado:** ✅ COMPLETO Y FUNCIONAL  
