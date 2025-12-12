# 🌐 ACCESO A LA RED - INSTRUCCIONES SIMPLES

## ✅ TU CONFIGURACIÓN ACTUAL

```
🖥️ Servidor:    192.168.15.22:3012
🖨️ Zebra:       192.168.15.34:9100  ✅ CONECTADA
🖨️ Godex:       192.168.15.35:9100  ⚠️ Desconectada (por conectar)
```

---

## 🚀 ACCESO RÁPIDO

### Desde TU PC (servidor):
```
http://localhost:3012
http://192.168.15.22:3012
```

### Desde otros dispositivos (celular, tablet, otra PC):
```
http://192.168.15.22:3012
```

---

## ⚡ ACCIÓN REQUERIDA (1 PASO)

### 🔥 Abrir puerto en Firewall:

1. Ve a la carpeta del proyecto:
   ```
   D:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas
   ```

2. **Clic derecho** en: `ABRIR-PUERTO-FIREWALL.bat`

3. Selecciona: **"Ejecutar como administrador"**

4. ✅ ¡Listo! El puerto 3012 estará accesible

---

## 📱 PROBAR DESDE CELULAR/TABLET

### Requisitos:
- ✅ El celular/tablet debe estar en la **misma WiFi**
- ✅ La red WiFi debe ser: `192.168.15.x`

### Pasos:
1. Conectar el dispositivo a la WiFi
2. Abrir navegador (Chrome, Safari, Firefox)
3. Ir a: `http://192.168.15.22:3012`
4. ✅ Debería cargar el sistema

---

## 🔍 VERIFICAR CONECTIVIDAD

### Desde Windows:

```powershell
# Ejecutar en PowerShell
.\DIAGNOSTICO-RED.bat
```

### Desde celular:

```
1. Abrir navegador
2. Ir a: http://192.168.15.22:3012
3. Si carga = ✅ Funciona
4. Si no carga = Revisar red WiFi
```

---

## ⚠️ SI NO FUNCIONA

### Problema 1: "No se puede acceder al sitio"

**Solución:**
1. Verificar que el servidor esté corriendo:
   ```powershell
   node server.js
   ```

2. Abrir firewall (ejecutar como admin):
   ```
   ABRIR-PUERTO-FIREWALL.bat
   ```

3. Verificar que el celular esté en la red correcta:
   - Debe ser: `192.168.15.x`
   - Verificar en: Configuración > WiFi > IP

### Problema 2: "Servidor no responde"

**Solución:**
1. Reiniciar servidor:
   ```powershell
   # Presionar Ctrl + C para detener
   node server.js
   ```

2. Verificar puerto:
   ```powershell
   netstat -an | findstr ":3012"
   ```

### Problema 3: "Dispositivo en red diferente"

**Ejemplo:**
- Servidor: `192.168.15.22`
- Celular: `192.168.1.50` ← Red diferente

**Soluciones:**

**A) Cambiar el celular a la red correcta:**
   - Conectar a WiFi: `192.168.15.x`

**B) Servidor con 2 IPs (avanzado):**
   - Conectar 2 adaptadores de red
   - Uno en `192.168.1.x`
   - Otro en `192.168.15.x`

**C) Configurar router (avanzado):**
   - Habilitar routing entre redes
   - Contactar al administrador de red

---

## 🎯 CONFIGURACIÓN RECOMENDADA

Para un entorno de producción con múltiples dispositivos:

### Red unificada:
```
Router WiFi principal
  ├─ Servidor:  192.168.15.22  (Ethernet o WiFi)
  ├─ Zebra:     192.168.15.34  (Ethernet)
  ├─ Godex:     192.168.15.35  (Ethernet)
  ├─ Tablet 1:  192.168.15.100 (WiFi)
  ├─ Tablet 2:  192.168.15.101 (WiFi)
  └─ Celular:   192.168.15.102 (WiFi)
```

### Ventajas:
- ✅ Todos se ven entre sí
- ✅ Sin configuración adicional
- ✅ Fácil de mantener

---

## 📊 RESUMEN TÉCNICO

| Componente | IP | Puerto | Estado |
|------------|-------------|--------|--------|
| Servidor Web | 192.168.15.22 | 3012 | ✅ Activo |
| Zebra ZD230 | 192.168.15.34 | 9100 | ✅ Conectada |
| Godex G530 | 192.168.15.35 | 9100 | ⚠️ Por conectar |
| Firewall | Puerto 3012 | TCP | ⚠️ Por abrir |

---

## 🔧 COMANDOS ÚTILES

### Verificar IP del servidor:
```powershell
ipconfig | findstr "IPv4"
```

### Verificar servidor corriendo:
```powershell
netstat -an | findstr ":3012"
```

### Probar conectividad:
```powershell
ping 192.168.15.22
```

### Ver todas las IPs de la red:
```powershell
arp -a
```

---

## 📞 SOPORTE

### Archivos de ayuda creados:
- ✅ `ABRIR-PUERTO-FIREWALL.bat` - Abrir puerto (ejecutar como admin)
- ✅ `DIAGNOSTICO-RED.bat` - Verificar configuración
- ✅ `CONFIGURAR-MULTI-RED.bat` - Para redes múltiples
- ✅ `CONFIGURACION-RED-COMPLETA.md` - Guía detallada

### Para más información:
- Ver: `CONFIGURACION-RED-COMPLETA.md`

---

**✅ RESUMEN EN 3 PASOS:**

1. Ejecutar `ABRIR-PUERTO-FIREWALL.bat` como administrador
2. Asegurar que todos estén en red `192.168.15.x`
3. Acceder desde cualquier dispositivo a: `http://192.168.15.22:3012`

---

**Fecha:** 11 de diciembre de 2025
**Sistema:** Etiquetas V2.5
**Puerto:** 3012
