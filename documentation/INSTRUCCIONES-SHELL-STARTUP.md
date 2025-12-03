# 🚀 INSTALACIÓN EN SHELL:STARTUP - Sistema de Bandeja

## ⚡ INSTALACIÓN ULTRA RÁPIDA (2 PASOS)

### 1️⃣ Instalar Dependencias (SOLO PRIMERA VEZ)
```cmd
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
npm install
```
⏱️ Espera 3-10 minutos (una sola vez)

### 2️⃣ Copiar a shell:startup

#### Método Visual (MÁS FÁCIL):
1. Presiona `Win + R`
2. Escribe: `shell:startup`
3. Presiona `Enter`
4. Se abre una carpeta
5. **Copia el archivo:** `bandeja.bat` (este archivo)
6. **Pega** en la carpeta que se abrió
7. ✅ ¡Listo!

#### Método PowerShell (Rápido):
```powershell
# Copiar desde PowerShell
Copy-Item "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja\bandeja.bat" "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\"
```

#### Método CMD (Alternativo):
```cmd
copy "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja\bandeja.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"
```

---

## 🎯 Verificar que Funciona

### Opción 1: Reiniciar Windows
1. Reinicia tu PC
2. Después del login, espera ~15-30 segundos
3. Busca el icono 🏷️ en la bandeja del sistema
4. ✅ Debería aparecer automáticamente

### Opción 2: Ejecutar Manualmente
1. `Win + R` → `shell:startup`
2. Doble clic en `bandeja.bat`
3. Espera ~15-30 segundos
4. Busca el icono 🏷️ en la bandeja

---

## 📋 ¿Qué Hace Este Archivo?

```
bandeja.bat (en shell:startup)
    ↓
Se ejecuta automáticamente al iniciar sesión
    ↓
Navega a: d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
    ↓
Verifica que Node.js esté instalado
    ↓
Verifica que node_modules exista
    ↓
Ejecuta: npm start (Electron)
    ↓
Inicia en segundo plano (ventana minimizada)
    ↓
Sale inmediatamente (no bloquea el inicio)
    ↓
Icono 🏷️ aparece en bandeja del sistema
```

---

## 🔧 Configuración Incluida en bandeja.bat

### Ruta del Proyecto (IMPORTANTE)
```batch
set PROJECT_DIR=d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
```

⚠️ **Si tu proyecto está en otra ubicación:**
1. Edita `bandeja.bat`
2. Cambia la línea `set PROJECT_DIR=...` con tu ruta

### Características
- ✅ **Inicio en segundo plano** - Sin ventanas CMD visibles
- ✅ **Auto-instalación de dependencias** - Si faltan node_modules
- ✅ **Verificación de Node.js** - Falla silenciosamente si no está instalado
- ✅ **Salida inmediata** - No bloquea el inicio de Windows
- ✅ **Ruta absoluta** - Funciona desde cualquier ubicación

---

## 🆘 Troubleshooting

### ❌ No aparece el icono después de reiniciar

**Verificar:**
1. `Win + R` → `shell:startup`
2. Confirmar que `bandeja.bat` está ahí
3. Doble clic en `bandeja.bat` para probar manualmente
4. Revisar que Node.js esté instalado: `node --version`

**Solución:**
```cmd
# Verificar que npm funciona
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
npm start
```

### ❌ Aparece ventana CMD brevemente

**Normal:** Windows muestra ventana CMD por 1-2 segundos, luego desaparece.

**Si molesta:** Usar VBScript (ver abajo)

### ❌ Error "No se encuentra el proyecto"

**Causa:** La ruta en `bandeja.bat` no es correcta.

**Solución:**
1. Editar `bandeja.bat`
2. Cambiar línea 14:
   ```batch
   set PROJECT_DIR=TU_RUTA_AQUÍ\mi-app-etiquetas\bandeja
   ```

---

## 🎨 Opción Avanzada: VBScript (SIN VENTANA CMD)

Si quieres que NO aparezca NINGUNA ventana CMD, usa VBScript:

### Crear archivo `bandeja.vbs` en shell:startup:

```vbscript
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja\bandeja.bat""", 0, False
```

**Copiar a shell:startup:**
```powershell
# Crear el archivo VBS
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja\bandeja.bat""", 0, False
"@

$vbsContent | Out-File -FilePath "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\bandeja.vbs" -Encoding ASCII
```

**Ventaja:** CERO ventanas visibles.

---

## 📊 Comparación de Métodos

| Método | Ventajas | Desventajas |
|--------|----------|-------------|
| **shell:startup + .bat** | ✅ Fácil<br>✅ Editable<br>✅ Visual | ⚠️ Ventana CMD breve |
| **shell:startup + .vbs** | ✅ Sin ventanas<br>✅ Completamente oculto | ⚠️ Menos editable |
| **Programador de Tareas** | ✅ Más control<br>✅ Opciones avanzadas | ⚠️ Más complejo |
| **Electron auto_start** | ✅ Integrado en app | ⚠️ Requiere ejecutar una vez |

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install` en bandeja/)
- [ ] `bandeja.bat` copiado a shell:startup
- [ ] Reiniciado Windows para probar
- [ ] Icono 🏷️ aparece automáticamente
- [ ] Servidor funciona correctamente

---

## 🎯 Ubicación de shell:startup

**Ruta completa:**
```
C:\Users\TU_USUARIO\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

**Variable de entorno:**
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

**Acceso rápido:**
```
Win + R → shell:startup
```

---

## 🔥 RESUMEN DE COMANDOS

### Instalación Completa
```cmd
# 1. Instalar dependencias
cd d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja
npm install

# 2. Copiar a startup
copy bandeja.bat "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"

# 3. Reiniciar Windows
shutdown /r /t 0
```

### Verificación
```cmd
# Ver archivos en startup
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"

# Ejecutar manualmente
"%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\bandeja.bat"
```

### Desinstalar
```cmd
# Eliminar de startup
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\bandeja.bat"
```

---

## ✨ ¡Listo para Usar!

**Una vez configurado:**
1. Enciendes la PC
2. Inicias sesión en Windows
3. [15-30 segundos después]
4. Icono 🏷️ aparece automáticamente
5. Servidor corriendo en puerto 3012
6. Todo funciona sin intervención

**Sin necesidad de:**
- ❌ Ejecutar nada manualmente
- ❌ Abrir CMD
- ❌ Recordar iniciar el servidor
- ❌ Tener VSCode abierto

---

**Fecha:** 5 de Noviembre de 2025  
**Método:** shell:startup + bandeja.bat  
**Estado:** ✅ LISTO PARA COPIAR Y PEGAR  
