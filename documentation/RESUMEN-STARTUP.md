# ⚡ INSTALACIÓN EN 3 PASOS

## Método 1: AUTOMÁTICO (RECOMENDADO) ⭐

### Ejecuta este archivo:
```
INSTALAR-EN-STARTUP.bat
```

**Hace TODO automáticamente:**
✅ Verifica Node.js  
✅ Instala dependencias (si faltan)  
✅ Copia `bandeja.bat` a shell:startup  
✅ Te pregunta si quieres ejecutar ahora  

---

## Método 2: MANUAL (2 pasos)

### Paso 1: Instalar dependencias (solo primera vez)
```cmd
cd bandeja
npm install
```

### Paso 2: Copiar a startup
1. `Win + R`
2. Escribe: `shell:startup`
3. Copia el archivo: `bandeja/bandeja.bat`
4. Pégalo en la carpeta que se abrió

---

## 🎯 Verificar

**Reinicia Windows**  
Después del login → Espera 30 segundos → Icono 🏷️ aparece

---

## 📂 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `bandeja/bandeja.bat` | ⚡ Archivo para copiar a startup |
| `INSTALAR-EN-STARTUP.bat` | 🤖 Instalador automático |
| `INSTALAR-EN-STARTUP.ps1` | 🔧 Script PowerShell (lo usa el .bat) |
| `INSTRUCCIONES-SHELL-STARTUP.md` | 📖 Documentación completa |

---

## ✅ Resultado

```
Enciendes PC → Login Windows → [30s] → Icono 🏷️ aparece → Servidor activo
```

**Sin:**
- ❌ Ejecutar nada manualmente
- ❌ Ventanas CMD abiertas
- ❌ VSCode abierto

---

**Recomendación:** Usa `INSTALAR-EN-STARTUP.bat` (hace todo por ti)
