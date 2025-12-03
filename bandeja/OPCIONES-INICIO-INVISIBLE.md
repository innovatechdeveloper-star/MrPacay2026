# 🚀 Opciones de Inicio - Sistema Etiquetas Bandeja

## 🎯 Problema Identificado

**Síntoma:** Al iniciar con `bandeja.bat`, se abre una ventana CMD visible que:
- ❌ Molesta la vista
- ❌ Los usuarios la cierran pensando que es innecesaria
- ❌ Al cerrar el CMD, se cierra el servidor completo
- ❌ No es profesional tener ventanas CMD abiertas

**Solución:** Usar lanzadores INVISIBLES que ejecutan todo en segundo plano.

---

## ✅ 3 Opciones Disponibles

### 🥇 OPCIÓN 1: VBScript (RECOMENDADA)
**Archivo:** `INICIAR-BANDEJA-INVISIBLE.vbs`

**Ventajas:**
- ✅ **100% invisible** - No muestra ninguna ventana
- ✅ Compatible con Windows XP hasta Windows 11
- ✅ No requiere permisos especiales
- ✅ Más rápido que PowerShell
- ✅ Funciona en shell:startup sin configuración

**Uso:**
```
1. Doble click en INICIAR-BANDEJA-INVISIBLE.vbs
2. La aplicación inicia completamente oculta
3. Solo verás el icono en la bandeja del sistema
```

**Para shell:startup:**
```
1. Win + R → "shell:startup" → Enter
2. Copiar INICIAR-BANDEJA-INVISIBLE.vbs
3. Reiniciar PC → Inicia automáticamente invisible
```

---

### 🥈 OPCIÓN 2: PowerShell (Alternativa Moderna)
**Archivo:** `INICIAR-BANDEJA-OCULTO.ps1`

**Ventajas:**
- ✅ Moderno y mantenible
- ✅ Ventana completamente oculta
- ✅ Mejor para scripts complejos
- ⚠️ Puede requerir permisos de ejecución

**Uso:**
```powershell
# Ejecutar directamente
powershell -ExecutionPolicy Bypass -File "INICIAR-BANDEJA-OCULTO.ps1"
```

**Para shell:startup (crear .bat):**
```bat
@echo off
powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0INICIAR-BANDEJA-OCULTO.ps1"
```

---

### 🥉 OPCIÓN 3: BAT Mejorado (Última Opción)
**Archivo:** `bandeja.bat`

**Ventajas:**
- ✅ Funciona en cualquier Windows
- ⚠️ Aún puede mostrar ventana brevemente
- ⚠️ No es 100% invisible

**Uso:**
```
Doble click en bandeja.bat
```

---

## 🎯 Configuración Recomendada

### Para shell:startup (Inicio Automático):

**MÉTODO 1 - VBScript (MÁS SIMPLE):**
```
1. Win + R → "shell:startup" → Enter
2. Copiar INICIAR-BANDEJA-INVISIBLE.vbs aquí
3. Cambiar ruta en línea 16 del archivo VBS
4. Reiniciar PC
```

**MÉTODO 2 - Crear BAT que llama al VBS:**
Crear archivo `Bandeja-Invisible.bat` en shell:startup:
```bat
@echo off
cscript //nologo "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja\INICIAR-BANDEJA-INVISIBLE.vbs"
```

---

## 📋 Comparativa Completa

| Característica | VBScript | PowerShell | BAT Mejorado |
|----------------|----------|------------|--------------|
| **Invisibilidad** | ✅ 100% | ✅ 100% | ⚠️ 90% |
| **Velocidad** | ✅ Rápido | ⚠️ Medio | ✅ Rápido |
| **Compatibilidad** | ✅ XP-11 | ⚠️ Win7+ | ✅ Todos |
| **Permisos** | ✅ Ninguno | ⚠️ ExecutionPolicy | ✅ Ninguno |
| **Profesional** | ✅ Sí | ✅ Sí | ⚠️ Regular |
| **Recomendado** | ✅✅✅ | ✅✅ | ⚠️ |

---

## 🔧 Cambiar Ruta del Proyecto

### En VBScript (línea 16):
```vbscript
PROJECT_DIR = "C:\SistemaEtiquetas\mi-app-etiquetas\bandeja"
```

### En PowerShell (línea 10):
```powershell
$PROJECT_DIR = "C:\SistemaEtiquetas\mi-app-etiquetas\bandeja"
```

### En BAT (línea 19):
```bat
set PROJECT_DIR=C:\SistemaEtiquetas\mi-app-etiquetas\bandeja
```

---

## ✅ Verificación de Funcionamiento

### 1. Ejecutar Lanzador:
```
Doble click en INICIAR-BANDEJA-INVISIBLE.vbs
```

### 2. Verificar Proceso:
```
Abrir Administrador de Tareas (Ctrl + Shift + Esc)
Buscar: "node.exe" o "electron.exe"
Debe aparecer corriendo
```

### 3. Verificar Bandeja:
```
Mirar bandeja del sistema (esquina inferior derecha)
Debe aparecer icono del sistema de etiquetas
```

### 4. Verificar Servidor:
```
Abrir navegador: http://localhost:3012
Debe cargar el sistema
```

---

## 🐛 Solución de Problemas

### Problema: "No pasa nada al ejecutar VBS"
**Solución:**
```
1. Verificar ruta en PROJECT_DIR (línea 16)
2. Abrir CMD y ejecutar: node --version
3. Si no aparece → Instalar Node.js
```

### Problema: "Se sigue viendo ventana CMD"
**Solución:**
```
1. NO usar bandeja.bat
2. Usar INICIAR-BANDEJA-INVISIBLE.vbs
3. Eliminar bandeja.bat de shell:startup si está ahí
```

### Problema: "No inicia al reiniciar PC"
**Solución:**
```
1. Win + R → "shell:startup"
2. Verificar que existe el archivo VBS ahí
3. Verificar ruta PROJECT_DIR en el VBS
4. Probar ejecutar VBS manualmente primero
```

### Problema: "PowerShell no puede ejecutarse"
**Solución:**
```powershell
# Como Administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📝 Notas Importantes

1. **No usar bandeja.bat para shell:startup** - Muestra ventana CMD
2. **Usar VBScript para máxima invisibilidad**
3. **Cambiar PROJECT_DIR antes de copiar a shell:startup**
4. **El proceso Node.js quedará corriendo en segundo plano**
5. **Para cerrar: Usar menú de bandeja → Salir**

---

## 🎯 Recomendación Final

**Para producción y usuarios finales:**
```
✅ Copiar INICIAR-BANDEJA-INVISIBLE.vbs a shell:startup
✅ Cambiar PROJECT_DIR a la ruta correcta
✅ Probar reiniciando PC
✅ Usuario nunca ve ventanas CMD
```

**Para desarrollo:**
```
✅ Ejecutar desde VS Code con npm start
✅ O usar INICIAR-BANDEJA-INVISIBLE.vbs manualmente
```

---

**Problema original SOLUCIONADO:** ✅  
Ahora la aplicación inicia completamente invisible, sin ventanas CMD que molesten o que los usuarios puedan cerrar accidentalmente.
