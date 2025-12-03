# 🔧 GUÍA DE INTEGRACIÓN - login_fixed.html

## 📋 PASOS PARA INTEGRAR login_fixed.html

### 1. Agregar Endpoints al Servidor

Copia el contenido de `endpoints_adicionales.js` y agrégalo al final de tu `server.js`, 
antes de la línea `app.listen(port, () => {`

### 2. Cambiar Ruta Raíz (Opcional)

Si quieres que `login_fixed.html` sea la página principal, cambia en `server.js`:

```javascript
// ANTES (línea ~190):
app.get('/', verificarToken, (req, res) => {
    // ... código existente
});

// DESPUÉS:
app.get('/dashboard', verificarToken, (req, res) => {
    // ... código existente movido aquí
});

// NUEVA ruta raíz:
app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'public', 'login_fixed.html'));
});
```

### 3. Verificar Base de Datos

Ejecuta `datos_ejemplo.sql` en tu PostgreSQL si no tienes usuarios:

```bash
psql -h localhost -U postgres -d postgres -f datos_ejemplo.sql
```

### 4. Probar la Aplicación

1. Inicia el servidor: `node server.js`
2. Ve a: `http://localhost:3010`
3. Usa cualquiera de estos usuarios:
   - **Email:** panchita@empresa.com **Password:** 123456 (Supervisor)
   - **Email:** maria.gonzalez@empresa.com **Password:** 123456 (Costurera)

## 🔍 VALIDACIONES A REALIZAR

### ✅ Checklist de Funcionamiento:

- [ ] Servidor inicia sin errores
- [ ] Login_fixed.html carga la lista de usuarios
- [ ] Login con credenciales correctas funciona
- [ ] Redireccionamiento por roles funciona
- [ ] JWT tokens se generan correctamente
- [ ] Dashboards cargan según el rol

## 🚨 PROBLEMAS COMUNES

### Error: "Cannot find module"
- **Causa:** Falta alguna dependencia
- **Solución:** `npm install`

### Error: "Connection refused PostgreSQL"
- **Causa:** PostgreSQL no está corriendo o credenciales incorrectas
- **Solución:** Verificar que PostgreSQL esté activo y cambiar password en server.js

### Error: "User not found"
- **Causa:** No hay usuarios en la base de datos
- **Solución:** Ejecutar `datos_ejemplo.sql`

### Error: "Invalid password"
- **Causa:** Contraseña incorrecta o hash no coincide
- **Solución:** Verificar que uses "123456" o recrear los usuarios

## 📊 DIFERENCIAS TÉCNICAS

### login.html (original) vs login_fixed.html (nuevo):

| **Aspecto** | **login.html** | **login_fixed.html** |
|-------------|----------------|---------------------|
| **Endpoint usuarios** | `/api/usuarios-login` | `/api/usuarios-lista` |
| **Endpoint login** | `/api/login` | `/api/login-simple` |
| **Validación** | Básica | Mejorada |
| **UX** | Standard | Optimizada |
| **Código** | Funcional | Más limpio |

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Implementar login_fixed.html** siguiendo esta guía
2. **Probar todas las funcionalidades** por rol
3. **Agregar validaciones adicionales** según necesites
4. **Implementar logout mejorado** en todos los dashboards
5. **Considerar migraciones de datos** si ya tienes usuarios existentes