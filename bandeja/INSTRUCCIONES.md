# 🎯 INSTRUCCIONES - SISTEMA DE BANDEJA

## ✅ CONFIGURAR INICIO AUTOMÁTICO

### Opción 1: Programador de Tareas (RECOMENDADO)

1. **Abrir Programador de Tareas:**
   - Presiona `Windows + R`
   - Escribe: `taskschd.msc`
   - Presiona Enter

2. **Crear Tarea Básica:**
   - Click en "Crear tarea básica..."
   - Nombre: `Sistema Etiquetas`
   - Descripción: `Inicia el servidor de etiquetas automáticamente`
   - Click en "Siguiente"

3. **Desencadenador:**
   - Selecciona: "Al iniciar sesión"
   - Click en "Siguiente"

4. **Acción:**
   - Selecciona: "Iniciar un programa"
   - Click en "Siguiente"
   - En "Programa o script", click en "Examinar" y selecciona:
     ```
     D:\mi-app-etiquetas\mi-app-etiquetas\bandeja\INICIAR-BANDEJA-OCULTO.vbs
     ```
   - Click en "Siguiente"

5. **Finalizar:**
   - Marca la casilla: "Abrir el cuadro de diálogo Propiedades al hacer clic en Finalizar"
   - Click en "Finalizar"

6. **Configuración Avanzada:**
   - En la pestaña "General":
     - Marca: "Ejecutar con los privilegios más altos"
   - En la pestaña "Condiciones":
     - Desmarca: "Iniciar la tarea solo si el equipo está conectado a alimentación de CA"
   - Click en "Aceptar"

### Opción 2: Carpeta Inicio (Más Simple)

1. **Abrir carpeta de Inicio:**
   - Presiona `Windows + R`
   - Escribe: `shell:startup`
   - Presiona Enter

2. **Crear acceso directo:**
   - Click derecho en la carpeta → Nuevo → Acceso directo
   - Ubicación:
     ```
     D:\mi-app-etiquetas\mi-app-etiquetas\bandeja\INICIAR-BANDEJA-OCULTO.vbs
     ```
   - Nombre: `Sistema Etiquetas`
   - Click en "Finalizar"

---

## 🎮 CÓMO USAR LA BANDEJA

### Iniciar manualmente:
- Doble click en: `INICIAR-BANDEJA-OCULTO.vbs`
- Aparecerá el icono en la bandeja del sistema (esquina inferior derecha)

### Opciones del menú (click derecho en el icono):

1. **🟢 Encender**
   - Inicia el servidor Node.js
   - URL: http://localhost:3012
   - Aparece notificación de confirmación

2. **🔄 Reiniciar**
   - Detiene y vuelve a iniciar el servidor
   - Útil si hay cambios en el código

3. **🔴 Apagar**
   - Detiene el servidor
   - El icono permanece en bandeja

4. **❌ Cerrar**
   - Detiene el servidor
   - Cierra la aplicación de bandeja completamente
   - Para volver a iniciar, ejecuta el .vbs manualmente

---

## ⚙️ CONFIGURACIÓN

### Estado del servidor:
- **Texto del icono en bandeja:**
  - "Sistema Etiquetas - Activo" → Servidor funcionando ✅
  - "Sistema Etiquetas - Detenido" → Servidor apagado ❌

### Inicio automático al encender:
- El servidor se **ENCIENDE AUTOMÁTICAMENTE** cuando se ejecuta la bandeja
- No necesitas hacer nada, solo esperar la notificación

### Sin ventanas CMD:
- Todo funciona en segundo plano
- No aparecen ventanas negras
- Solo el icono en la bandeja

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### No aparece el icono en bandeja:
1. Verifica que ejecutaste el archivo correcto: `INICIAR-BANDEJA-OCULTO.vbs`
2. Revisa la esquina derecha de la barra de tareas
3. Click en la flecha ^ para ver iconos ocultos

### El servidor no inicia:
1. Click derecho en el icono → Apagar
2. Espera 5 segundos
3. Click derecho → Encender
4. Revisa si aparece la notificación

### Error al ejecutar:
- Asegúrate de que Node.js está instalado
- Verifica que la ruta sea correcta
- Ejecuta como administrador si es necesario

### Eliminar tarea programada antigua:
1. Presiona `Windows + R` → `taskschd.msc`
2. Busca tareas con nombre "Etiquetas" o similar
3. Click derecho → Eliminar

---

## 📝 NOTAS IMPORTANTES

✅ El servidor se mantiene activo mientras la PC esté encendida
✅ No consume recursos cuando está en bandeja (solo ~10MB RAM)
✅ Se reinicia automáticamente si hay algún error crítico
✅ Puedes cerrar la bandeja sin afectar el sistema si cierras todo correctamente

⚠️ **IMPORTANTE:** 
- Si cierras la bandeja con "❌ Cerrar", el servidor también se detiene
- Para mantener el servidor activo, simplemente deja el icono en la bandeja
- No cierres procesos de Node.js manualmente desde el Administrador de Tareas

---

## 🚀 INICIO RÁPIDO

### Primera vez:
1. Ejecuta: `INICIAR-BANDEJA-OCULTO.vbs`
2. Aparece notificación: "Servidor iniciado"
3. Abre navegador: http://localhost:3012
4. Configura inicio automático (Programador de Tareas)

### Uso diario:
- Al encender la PC, el servidor inicia solo
- Aparece el icono en la bandeja
- Ya puedes usar el sistema
- Al apagar la PC, todo se cierra automáticamente

---

**Versión**: 1.0  
**Fecha**: 3 de noviembre de 2025  
**Compatibilidad**: Windows 10/11
