# 🚀 EJECUTAR AHORA - Sistema de Bandeja

## ⚡ INICIO RÁPIDO (3 COMANDOS)

### 1️⃣ Abrir Terminal en la Carpeta del Proyecto
```cmd
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
```

### 2️⃣ Instalar Dependencias (SOLO PRIMERA VEZ)
```cmd
INSTALAR-BANDEJA.bat
```
⏱️ **Esperar 3-10 minutos** mientras descarga ~255 MB

### 3️⃣ Ejecutar Aplicación
```cmd
EJECUTAR-SISTEMA-ETIQUETAS.bat
```

🎉 **¡Listo!** Busca el icono 🏷️ en la bandeja del sistema (junto al reloj)

---

## 🖱️ Usar la Aplicación

### Menú Principal (Clic Derecho en Icono)

**Opciones Básicas:**
- 🚀 **Iniciar Servidor** - Inicia server.js en puerto 3012
- 🛑 **Detener Servidor** - Detiene el servidor
- 🌐 **Abrir Sistema** - Abre http://localhost:3012 en navegador

**Configuración Importante:**
1. Clic derecho → `⚙️ Configuración`
2. Marcar:
   - ☑ **Iniciar con Windows** ← ¡IMPORTANTE!
   - ☑ **Iniciar servidor automáticamente** ← ¡IMPORTANTE!
   - ☑ **Mantener servidor activo (Watchdog)**

---

## 🔧 Configurar Inicio con Windows (RECOMENDADO)

### Método 1: Desde la Aplicación (MÁS FÁCIL) ⭐
1. Ejecutar `EJECUTAR-SISTEMA-ETIQUETAS.bat`
2. Clic derecho en icono 🏷️
3. `⚙️ Configuración`
4. Marcar `☑ Iniciar con Windows`
5. ✅ ¡Listo! - Al siguiente reinicio se iniciará solo

### Método 2: Programador de Tareas Windows

#### Paso a Paso:
1. Presiona `Win + R`
2. Escribe: `taskschd.msc`
3. Presiona `Enter`

4. En la ventana que se abre:
   - Clic derecho en **"Biblioteca del Programador de tareas"**
   - Selecciona **"Crear tarea básica..."**

5. **Nombre:**
   ```
   Sistema Etiquetas - Bandeja
   ```
   - Clic en **"Siguiente"**

6. **Desencadenador:**
   - Selecciona: **"Al iniciar sesión"**
   - Clic en **"Siguiente"**

7. **Acción:**
   - Selecciona: **"Iniciar un programa"**
   - Clic en **"Siguiente"**

8. **Programa/Script:**
   ```
   d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\EJECUTAR-SISTEMA-ETIQUETAS.bat
   ```
   ⚠️ **Copiar y pegar exactamente esta ruta**
   
   - Clic en **"Siguiente"**

9. **Finalizar:**
   - Revisar que todo esté correcto
   - Clic en **"Finalizar"**

10. ✅ **¡Listo!** - Ahora se ejecutará automáticamente al iniciar sesión

#### Verificar:
1. **Reinicia Windows**
2. Después del login, espera ~30 segundos
3. Busca el icono 🏷️ en la bandeja del sistema
4. Debería aparecer automáticamente

---

## 📋 Verificación Rápida

### ✅ Checklist Básico
- [ ] Node.js instalado (`node --version`)
- [ ] Dependencias instaladas (`INSTALAR-BANDEJA.bat`)
- [ ] Aplicación ejecutada (`EJECUTAR-SISTEMA-ETIQUETAS.bat`)
- [ ] Icono aparece en bandeja
- [ ] Servidor inicia correctamente
- [ ] Endpoint /health funciona: http://localhost:3012/health

### ✅ Checklist Avanzado (Inicio Automático)
- [ ] Configuración activada en menú (☑ Iniciar con Windows)
- [ ] O tarea creada en Programador de Tareas
- [ ] Windows reiniciado para probar
- [ ] Icono aparece automáticamente después de login
- [ ] Servidor inicia automáticamente (si está configurado)

---

## 🎯 Flujo Ideal

### Primera Vez
```
1. INSTALAR-BANDEJA.bat
   ↓ (esperar 3-10 min)
2. EJECUTAR-SISTEMA-ETIQUETAS.bat
   ↓
3. Aparece icono 🏷️ en bandeja
   ↓
4. Clic derecho → Configuración
   ↓
5. Marcar: ☑ Iniciar con Windows
            ☑ Iniciar servidor automáticamente
   ↓
6. Reiniciar Windows
   ↓
7. ✅ Todo funciona automáticamente
```

### Uso Diario (Después de Configurar)
```
1. Encender PC
   ↓
2. Iniciar sesión en Windows
   ↓
3. [Sistema inicia automáticamente]
   ↓
4. Trabajar normalmente
   ↓
5. [Watchdog vigila en segundo plano]
   ↓
6. Apagar PC
```

---

## 🆘 Problemas Comunes

### ❌ "Node.js no está instalado"
**Solución:**
1. Descargar: https://nodejs.org/
2. Instalar versión LTS
3. Marcar opción "Add to PATH"
4. Reiniciar terminal
5. Verificar: `node --version`

### ❌ "Puerto 3012 ocupado"
**Solución:**
```cmd
# Matar proceso en puerto 3012
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3012') do taskkill /F /PID %a
```

### ❌ Icono no aparece
**Solución:**
1. Cerrar aplicación
2. Verificar que no esté corriendo: `tasklist | findstr electron`
3. Ejecutar de nuevo: `EJECUTAR-SISTEMA-ETIQUETAS.bat`
4. Esperar 10-15 segundos

### ❌ No inicia al encender Windows
**Solución:**
1. Verificar que configuración esté activada
2. O verificar tarea en Programador de Tareas
3. Probar ejecutar tarea manualmente desde Programador

---

## 📞 Ayuda Adicional

### Documentos de Referencia
- `bandeja/README.md` - Documentación completa
- `GUIA-RAPIDA-BANDEJA.md` - Guía rápida
- `RESUMEN-IMPLEMENTACION-BANDEJA.md` - Resumen técnico

### Logs de Diagnóstico
Si hay problemas, revisar:
```
bandeja/logs/app.log
bandeja/logs/servidor-error.log
```

O abrir ventana de logs:
1. Clic derecho en icono
2. `📝 Ver Logs` → `🖥️ Logs en Tiempo Real`

---

## 🎉 ¡Todo Listo!

**Una vez configurado:**
- ✅ Sistema inicia automáticamente con Windows
- ✅ Servidor corre en segundo plano sin ventanas
- ✅ Watchdog vigila y reinicia si hay problemas
- ✅ Control total desde icono de bandeja
- ✅ Logs profesionales cuando los necesites

**Sin necesidad de:**
- ❌ Abrir CMD manualmente
- ❌ Ejecutar `node server.js`
- ❌ Mantener VSCode abierto
- ❌ Recordar iniciar el servidor

---

**Fecha:** 5 de Noviembre de 2025  
**Versión:** Sistema Etiquetas v2.5 con Bandeja  
**Estado:** ✅ LISTO PARA USAR  
