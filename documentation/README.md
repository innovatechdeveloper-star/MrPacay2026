# 📚 Documentación del Proyecto - Sistema de Etiquetas

Esta carpeta contiene toda la documentación técnica, pruebas y avances del sistema.

## 📁 Estructura

### `/avances-tecnicos/` (55 archivos)
Archivos Markdown y TXT con documentación técnica ordenados cronológicamente por fecha de creación. Cada archivo está numerado (001-, 002-, etc.) para facilitar el seguimiento del desarrollo.

**Contenido:**
- Guías de implementación
- Análisis de flujo del sistema
- Soluciones a problemas técnicos
- Documentación de features
- Resúmenes ejecutivos
- Planes de desarrollo
- Capturas de texto (*.txt)

### `/pruebas/` (85 archivos)
Scripts JavaScript de prueba, análisis y conversión utilizados durante el desarrollo.

**Tipos de archivos:**
- `analizar-*.js` - Scripts de análisis de imágenes y dimensiones
- `calcular-*.js` - Cálculos de tamaños y conversiones
- `capturar-*.js` - Capturas de datos de impresoras
- `check-*.js` - Verificaciones de base de datos
- `configurar-*.js` - Scripts de configuración
- `convertir-*.js` - Conversión de imágenes a ZPL
- `ejecutar-migracion-*.js` - Migraciones de base de datos
- `generar-*.js` - Generación de logos y pruebas
- `test-*.js` - Pruebas de funcionalidades
- `verificar*.js` - Verificaciones de registros
- `logo-*.js` - Logos ZPL obsoletos (ya no usados)

### `/iniciadores/`
Scripts batch (.bat) para ejecutar operaciones del sistema.

**Contenido:**
- Migraciones de base de datos
- Calibración de impresoras
- Configuración de puertos
- Apertura de firewall
- Scripts de mantenimiento

## ⚠️ Nota Importante

Los archivos en esta carpeta **NO** están siendo utilizados activamente por el sistema. Son para referencia, aprendizaje y documentación del proceso de desarrollo.

**Archivos activos en producción:**
- `server.js` - Servidor principal
- `/public/*.html` - Interfaces de usuario
- `/public/css/**` - Estilos
- `/public/js/**` - Scripts del frontend
- `logo-*-zpl.js` - Constantes ZPL utilizadas
- `icono-*-zpl.js` - Iconos ZPL utilizados

## 🔍 Cómo Usar Esta Documentación

1. **Para entender el flujo del sistema**: Lee los archivos en `/avances-tecnicos/` en orden numérico
2. **Para replicar pruebas**: Revisa los scripts en `/pruebas/` relacionados con la funcionalidad
3. **Para troubleshooting**: Busca archivos `SOLUCION-*.md` en avances técnicos

---
*Última actualización: 3 de noviembre de 2025*
