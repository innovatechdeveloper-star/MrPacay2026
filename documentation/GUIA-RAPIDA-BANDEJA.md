# ⚡ GUÍA RÁPIDA - Sistema de Bandeja

## 🚀 Instalación (5 minutos)

### 1️⃣ Instalar Dependencias
```cmd
INSTALAR-BANDEJA.bat
```
Espera 3-10 minutos (descarga ~255 MB)

### 2️⃣ Ejecutar por Primera Vez
```cmd
EJECUTAR-SISTEMA-ETIQUETAS.bat
```

### 3️⃣ Configurar Inicio Automático
1. **Clic derecho** en icono 🏷️ de la bandeja
2. **Configuración** → Marcar:
   - ☑ **Iniciar con Windows**
   - ☑ **Iniciar servidor automáticamente**
   - ☑ **Mantener servidor activo**

---

## 🎯 Uso Diario

### Opción A: Inicio Automático (RECOMENDADO)
Una vez configurado, el sistema se inicia solo al encender la PC.

### Opción B: Inicio Manual
```cmd
EJECUTAR-SISTEMA-ETIQUETAS.bat
```

---

## 📋 Programador de Tareas Windows

### Configuración Paso a Paso

1. **Abrir Programador de Tareas:**
   ```
   Win + R → taskschd.msc → Enter
   ```

2. **Crear Tarea Nueva:**
   - Clic derecho en "Biblioteca del Programador de tareas"
   - "Crear tarea básica..."

3. **Nombre de la Tarea:**
   ```
   Sistema Etiquetas - Bandeja
   ```

4. **Desencadenador:**
   - Seleccionar: **"Al iniciar sesión"**
   - Siguiente

5. **Acción:**
   - Seleccionar: **"Iniciar un programa"**
   - Siguiente

6. **Programa/Script:**
   ```
   d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\EJECUTAR-SISTEMA-ETIQUETAS.bat
   ```
   ⚠️ **IMPORTANTE:** Ajusta la ruta según tu instalación

7. **Iniciar en (opcional pero recomendado):**
   ```
   d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
   ```

8. **Finalizar:**
   - Clic en "Finalizar"
   - ✅ Tarea creada

### Verificar que Funciona

1. **Reinicia Windows**
2. Espera ~30 segundos después del login
3. Busca el icono 🏷️ en la bandeja del sistema
4. Debería aparecer automáticamente

### Opciones Avanzadas (Opcional)

**Para configurar más detalles:**

1. En Programador de Tareas, encuentra tu tarea
2. Clic derecho → **"Propiedades"**
3. Pestaña **"General":**
   - ☑ Ejecutar tanto si el usuario inició sesión como si no
   - ☑ Ejecutar con los privilegios más altos (si necesitas permisos admin)

4. Pestaña **"Condiciones":**
   - ☐ Iniciar la tarea solo si el equipo está conectado a CA (desmarcar para laptops)
   - ☐ Detener si el equipo deja de estar en CA (desmarcar)

5. Pestaña **"Configuración":**
   - ☑ Permitir que se ejecute a petición
   - ☑ Si la tarea no se ejecutó, ejecutarla lo antes posible

---

## 🔄 Alternativa: Registro de Windows

### Script para Agregar al Registro

Crear archivo `agregar-inicio-windows.reg`:

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run]
"SistemaEtiquetas"="d:\\Informacion\\DESARROLLO\\Sistema-EtiquetasV2.5\\mi-app-etiquetas\\EJECUTAR-SISTEMA-ETIQUETAS.bat"
```

**⚠️ Ajustar ruta según tu instalación (usar doble barra invertida \\)**

Ejecutar el archivo `.reg` para importarlo al registro.

### Verificar en Registro

1. `Win + R` → `regedit`
2. Navegar a: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. Buscar entrada "SistemaEtiquetas"

---

## 🛠️ Troubleshooting

### ❌ Tarea no se ejecuta al inicio

**Verificar:**
1. Abrir Programador de Tareas
2. Buscar la tarea "Sistema Etiquetas - Bandeja"
3. Clic derecho → **"Ejecutar"**
4. Si falla, revisar:
   - ✅ Ruta del .bat es correcta
   - ✅ Node.js está en PATH
   - ✅ Permisos de ejecución

### ❌ Ventana CMD aparece y desaparece

**Normal:** La primera vez mostrará una ventana que se cierra después de cargar Electron.

**Si molesta:** Crear VBScript que ejecute en segundo plano:

Archivo `ejecutar-oculto.vbs`:
```vbscript
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\EJECUTAR-SISTEMA-ETIQUETAS.bat""", 0, False
```

Y en Programador de Tareas usar este `.vbs` en lugar del `.bat`.

---

## 📊 Estado de la Tarea

### Ver Historial de Ejecución

1. Programador de Tareas
2. Clic en tu tarea
3. Pestaña inferior: **"Historial"**
4. Verás todos los intentos de ejecución

### Deshabilitar Tarea Temporalmente

1. Clic derecho en la tarea
2. **"Deshabilitar"**
3. Para reactivar: Clic derecho → **"Habilitar"**

---

## ✅ Checklist Post-Instalación

- [ ] Dependencias instaladas (`INSTALAR-BANDEJA.bat`)
- [ ] Aplicación funciona manualmente (`EJECUTAR-SISTEMA-ETIQUETAS.bat`)
- [ ] Icono aparece en bandeja
- [ ] Servidor inicia correctamente
- [ ] Tarea programada creada
- [ ] Configuración activada en el menú (Iniciar con Windows)
- [ ] Reiniciado Windows para probar
- [ ] Icono aparece automáticamente después de login

---

## 🎯 Resultado Final

```
Enciendes la PC
    ↓
Windows inicia sesión
    ↓
Programador de Tareas ejecuta el .bat
    ↓
Electron inicia en segundo plano
    ↓
Icono 🏷️ aparece en bandeja
    ↓
Servidor inicia automáticamente (si está configurado)
    ↓
Sistema 100% operativo
```

**SIN:**
- ❌ Ventanas CMD abiertas
- ❌ Intervención manual
- ❌ VSCode abierto

**CON:**
- ✅ Icono discreto en bandeja
- ✅ Control total desde menú
- ✅ Logs profesionales
- ✅ Auto-recuperación si falla

---

## 📞 Ayuda Rápida

| Problema | Solución |
|----------|----------|
| No aparece icono | Ejecutar manualmente primero |
| Servidor no inicia | Activar "Iniciar servidor automáticamente" |
| Se reinicia solo | Normal - Watchdog en acción |
| Ventana CMD visible | Usar script VBS oculto |
| Olvidé la ruta del .bat | Ver este documento 👆 |

---

**Última actualización:** 5 de Noviembre de 2025
