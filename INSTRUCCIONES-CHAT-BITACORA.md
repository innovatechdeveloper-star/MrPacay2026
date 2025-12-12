# 📦 INSTRUCCIONES: INTEGRACIÓN DE CHAT Y BITÁCORA

## 🎯 Resumen

Se han creado **3 componentes modulares** para el sistema:

1. **chat-sistema.html** - Sistema de mensajería instantánea
2. **bitacora-produccion.html** - Registro de producción diaria
3. **reportes-produccion.html** - Generación de reportes para el dueño

## 📁 Ubicación de Archivos

```
mi-app-etiquetas/
├── public/
│   └── components/
│       ├── chat-sistema.html          ← 💬 Chat global
│       ├── bitacora-produccion.html   ← 📋 Bitácora
│       └── reportes-produccion.html   ← 📊 Reportes
├── migrations/
│   ├── 008_crear_tabla_bitacora_produccion.sql
│   ├── 009_crear_tabla_chat_mensajes.sql
│   └── APLICAR_CHAT_Y_BITACORA.sql    ← ⚡ Ejecutar PRIMERO
└── server.js                          ← ✅ Ya tiene los endpoints
```

## 🔧 PASO 1: Aplicar Migraciones de Base de Datos

### Opción A: Desde pgAdmin4 o DBeaver

1. Abrir **pgAdmin4** o **DBeaver**
2. Conectar a la base de datos `sistema_etiquetas`
3. Abrir el archivo `migrations/APLICAR_CHAT_Y_BITACORA.sql`
4. Ejecutar el script completo
5. Verificar que las tablas se crearon:
   ```sql
   SELECT * FROM bitacora_produccion LIMIT 1;
   SELECT * FROM chat_mensajes LIMIT 1;
   ```

### Opción B: Desde línea de comandos (PowerShell)

```powershell
# Buscar la ruta de psql.exe (PostgreSQL)
Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe

# Ejecutar (ajustar ruta según tu instalación)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sistema_etiquetas -f "D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\migrations\APLICAR_CHAT_Y_BITACORA.sql"
```

## 🌐 PASO 2: Integrar Componentes en HTML

### A) Chat (TODAS LAS PÁGINAS)

El chat debe estar disponible en **todas las páginas** (admin, supervisor, costurera).

**Agregar ANTES de `</body>`:**

```html
<!-- Chat del Sistema -->
<script>
    fetch('/components/chat-sistema.html')
        .then(response => response.text())
        .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);
        });
</script>
</body>
</html>
```

**O incluir directamente con iframe:**

```html
<!-- Chat del Sistema -->
<iframe 
    src="/components/chat-sistema.html" 
    style="position: fixed; bottom: 0; right: 0; width: 0; height: 0; border: none; z-index: 10000;"
    id="iframe-chat"
></iframe>
<script>
    // El botón flotante del chat se mostrará automáticamente
    const iframeChat = document.getElementById('iframe-chat');
    iframeChat.onload = () => {
        const chatDoc = iframeChat.contentDocument || iframeChat.contentWindow.document;
        const botonChat = chatDoc.getElementById('btn-chat-flotante');
        if (botonChat) {
            botonChat.style.cssText = 'position: fixed; bottom: 30px; right: 30px; z-index: 10000;';
            document.body.appendChild(botonChat);
        }
    };
</script>
```

**⚠️ MÉTODO RECOMENDADO: Copiar y pegar TODO el contenido de `chat-sistema.html` directamente antes de `</body>`**

### B) Bitácora (SOLO ADMIN)

**En `administracion-mejorado.html`, agregar en el contenido principal:**

```html
<!-- Buscar una sección apropiada, ejemplo después de gestión de usuarios -->

<!-- Bitácora de Producción -->
<div id="contenedor-bitacora"></div>

<script>
    fetch('/components/bitacora-produccion.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('contenedor-bitacora').innerHTML = html;
        });
</script>
```

**O copiar directamente el contenido del archivo.**

### C) Reportes (SOLO ADMIN / DUEÑO)

**En `administracion-mejorado.html`, agregar después de Bitácora:**

```html
<!-- Reportes de Producción -->
<div id="contenedor-reportes"></div>

<script>
    fetch('/components/reportes-produccion.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('contenedor-reportes').innerHTML = html;
        });
</script>
```

## 🚀 PASO 3: Reiniciar Servidor

```powershell
# Detener servidor actual (Ctrl + C)

# Reiniciar
cd "D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas"
node server.js
```

Verificar en la consola:

```
✅ Bitácora de Producción: 5 endpoints registrados
   - POST /api/bitacora/crear
   - GET  /api/bitacora/listar
   - PUT  /api/bitacora/anular
   - PUT  /api/bitacora/editar
   - GET  /api/bitacora/reporte

✅ Sistema de Chat: 4 endpoints registrados
   - POST /api/chat/enviar
   - GET  /api/chat/mensajes
   - PUT  /api/chat/marcar-leido
   - GET  /api/chat/no-leidos
```

## ✅ PASO 4: Pruebas

### Probar Chat

1. Abrir cualquier dashboard (admin, supervisor, costurera)
2. Verificar que aparece el botón flotante 💬 en la esquina inferior derecha
3. Clic en el botón → se abre modal de chat
4. Enviar mensaje de prueba
5. Verificar contador de mensajes no leídos

### Probar Bitácora

1. Ir a panel de administración
2. Buscar sección "📋 Bitácora de Producción"
3. Clic en "➕ Nueva Entrada"
4. Completar formulario:
   - Producto: Seleccionar cualquiera
   - Cantidad: 10
5. Guardar
6. Verificar que aparece en la tabla
7. Probar botón "🚫 Anular" → debe mostrar 2 opciones:
   - ✏️ Editar y Corregir
   - 🚫 Solo Anular

### Probar Reportes

1. En panel de administración, buscar "📊 Reportes de Producción"
2. Seleccionar rango de fechas (último mes por defecto)
3. Clic en "📊 Generar Reporte"
4. Verificar estadísticas y tabla de resultados
5. Clic en "📥 Exportar a Excel" → descarga archivo CSV

## 📋 Endpoints API Disponibles

### Chat

```javascript
// Enviar mensaje
POST /api/chat/enviar
Body: {
  mensaje: "Hola",
  tipo_destinatario: "TODOS" | "USUARIO" | "GRUPO_SUPERVISORES" | "GRUPO_ADMIN",
  id_destinatario: 123 (opcional, solo si tipo = USUARIO)
}

// Obtener mensajes
GET /api/chat/mensajes?limite=50&id_conversacion=123

// Marcar como leído
PUT /api/chat/marcar-leido
Body: { id_mensaje: 456 }

// Contar no leídos
GET /api/chat/no-leidos
```

### Bitácora

```javascript
// Crear registro
POST /api/bitacora/crear
Body: {
  id_producto: 5,
  cantidad: 100,
  observaciones: "Producción normal"
}

// Listar registros
GET /api/bitacora/listar?fecha_inicio=2024-12-01&estado=ACTIVO

// Anular registro
PUT /api/bitacora/anular
Body: {
  id: 10,
  motivo_cambio: "Error en conteo"
}

// Editar registro
PUT /api/bitacora/editar
Body: {
  id: 10,
  cantidad: 150,
  id_producto: 6,
  motivo_cambio: "Corrección de cantidad"
}

// Reporte
GET /api/bitacora/reporte?fecha_inicio=2024-12-01&fecha_fin=2024-12-31
```

## 🎨 Características Implementadas

### Chat
- ✅ Mensajes directos entre usuarios
- ✅ Mensajes grupales (Supervisores, Admin, Todos)
- ✅ Contador de mensajes no leídos en tiempo real
- ✅ Actualización automática cada 10 segundos
- ✅ Interfaz responsive (móvil/tablet)
- ✅ Botón flotante siempre visible

### Bitácora
- ✅ Registro de producción diaria
- ✅ Edición con motivo obligatorio
- ✅ Anulación con 2 opciones (Editar/Solo Anular)
- ✅ Filtros avanzados (fecha, usuario, producto, estado)
- ✅ Historial completo de modificaciones
- ✅ Permisos por rol (costureras solo ven lo suyo)
- ✅ Estados: ACTIVO, EDITADO, ANULADO

### Reportes
- ✅ Filtros por fecha, usuario, producto, estado
- ✅ Estadísticas visuales (cards con totales)
- ✅ Tabla detallada de registros
- ✅ Exportación a CSV/Excel
- ✅ Solo visible para admin/dueño
- ✅ Fechas por defecto (último mes)

## 🔒 Permisos Implementados

| Función | Costurera | Supervisor | Admin/Dueño |
|---------|-----------|------------|-------------|
| Ver chat | ✅ | ✅ | ✅ |
| Enviar mensajes | ✅ | ✅ | ✅ |
| Ver bitácora propia | ✅ | - | - |
| Ver toda bitácora | - | ✅ | ✅ |
| Crear registro | ✅ | ✅ | ✅ |
| Editar propio | ✅ | - | - |
| Editar cualquiera | - | ✅ | ✅ |
| Anular propio | ✅ | - | - |
| Anular cualquiera | - | ✅ | ✅ |
| Ver reportes | - | - | ✅ |
| Exportar reportes | - | - | ✅ |

## 🐛 Troubleshooting

### "psql no se reconoce como comando"
- PostgreSQL no está en PATH
- Usar ruta completa: `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`

### "Error 500 en endpoints"
- Verificar que las tablas existen: `SELECT * FROM chat_mensajes;`
- Revisar logs del servidor con `console.log`

### "Botón de chat no aparece"
- Verificar que el componente se cargó correctamente
- Abrir DevTools → Console → buscar errores
- Verificar `localStorage.getItem('user_email')`

### "Bitácora no carga registros"
- Verificar autenticación: header `user-email`
- Verificar permisos del usuario en base de datos
- Revisar filtros (pueden estar muy restrictivos)

## 📝 Notas Importantes

1. **Las migraciones deben ejecutarse UNA SOLA VEZ** antes de usar el sistema
2. **El chat funciona con polling** (consulta cada 10 seg). Para tiempo real, implementar WebSockets
3. **La exportación a Excel es CSV** por simplicidad. Para XLSX real, agregar librería `exceljs`
4. **Los estilos están incluidos** en cada componente (no requiere CSS externo)
5. **user-email del localStorage** se usa para autenticación en todas las peticiones

## 🚀 Próximas Mejoras Sugeridas

- [ ] WebSockets para chat en tiempo real
- [ ] Notificaciones push del navegador
- [ ] Exportación real a Excel (XLSX) con gráficos
- [ ] Dashboard de métricas en tiempo real
- [ ] Backup automático de bitácora
- [ ] Firma digital para anulaciones importantes

---

**Documentación creada el:** 11 de diciembre de 2025
**Autor:** Sistema de Etiquetas V2.5
**Versión:** 1.0
