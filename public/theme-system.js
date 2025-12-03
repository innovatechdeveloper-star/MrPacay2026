// ============================================
// PERSONALIZACIÓN POR GÉNERO Y DECORACIONES
// Sistema de Etiquetas QR - Versión 2.1.0
// ============================================

/**
 * Aplica el tema visual según el género del usuario
 * @param {string} genero - 'femenino' o 'masculino'
 */
function applyGenderTheme(genero) {
    const body = document.body;
    
    // Remover clases anteriores
    body.classList.remove('theme-femenino', 'theme-masculino');
    
    // Aplicar clase según género
    if (genero === 'masculino') {
        body.classList.add('theme-masculino');
        console.log('🎨 Tema masculino aplicado');
    } else {
        body.classList.add('theme-femenino');
        console.log('🎨 Tema femenino aplicado');
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('user-gender', genero);
}

/**
 * Toggle para mostrar/ocultar elementos decorativos
 */
function toggleDecorations() {
    const body = document.body;
    const decorationsHidden = body.classList.toggle('hide-decorations');
    
    // Cambiar icono del botón
    const decorBtn = document.getElementById('decorations-toggle-icon');
    if (decorBtn) {
        decorBtn.textContent = decorationsHidden ? '🎭' : '✨';
    }
    
    // Guardar preferencia
    localStorage.setItem('decorations-hidden', decorationsHidden ? 'true' : 'false');
    
    console.log('✨ Decoraciones:', decorationsHidden ? 'OCULTAS' : 'VISIBLES');
}

/**
 * Cargar preferencias guardadas del usuario
 */
function loadUserPreferences() {
    // Cargar tema claro/oscuro
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
    
    // Cargar estado de decoraciones
    const decorationsHidden = localStorage.getItem('decorations-hidden') === 'true';
    if (decorationsHidden) {
        document.body.classList.add('hide-decorations');
        const decorBtn = document.getElementById('decorations-toggle-icon');
        if (decorBtn) decorBtn.textContent = '🎭';
    }
    
    // Cargar género desde localStorage temporal
    const savedGender = localStorage.getItem('user-gender');
    if (savedGender) {
        applyGenderTheme(savedGender);
    }
}

/**
 * Toggle para modo claro/oscuro (genérico)
 */
function toggleThemeGeneric() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    body.classList.toggle('dark-mode');
    
    // Cambiar icono
    if (body.classList.contains('dark-mode')) {
        if (themeIcon) themeIcon.textContent = '🌙';
        localStorage.setItem('theme-preference', 'dark');
    } else {
        if (themeIcon) themeIcon.textContent = '☀️';
        localStorage.setItem('theme-preference', 'light');
    }
}

/**
 * Cargar información del usuario desde el servidor
 * y aplicar temas según sus preferencias
 */
async function loadAndApplyUserTheme() {
    try {
        // Obtener datos del usuario desde localStorage (guardados al hacer login)
        const userDataStr = localStorage.getItem('currentUser') || localStorage.getItem('userData');
        
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log('👤 Usuario cargado:', userData.nombre || userData.nombre_completo);
            console.log('🎨 Género del usuario:', userData.genero || 'femenino (default)');
            
            // Aplicar tema según género
            const genero = userData.genero || 'femenino';
            applyGenderTheme(genero);
            
            return userData;
        } else {
            console.warn('⚠️ No hay datos de usuario en localStorage');
            // Aplicar tema femenino por defecto
            applyGenderTheme('femenino');
        }
    } catch (error) {
        console.error('❌ Error cargando tema de usuario:', error);
        // Aplicar tema femenino por defecto en caso de error
        applyGenderTheme('femenino');
    }
}

// Auto-cargar preferencias al iniciar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadUserPreferences();
        loadAndApplyUserTheme();
    });
} else {
    loadUserPreferences();
    loadAndApplyUserTheme();
}

// Exportar funciones para uso global
window.applyGenderTheme = applyGenderTheme;
window.toggleDecorations = toggleDecorations;
window.toggleThemeGeneric = toggleThemeGeneric;
window.loadUserPreferences = loadUserPreferences;
window.loadAndApplyUserTheme = loadAndApplyUserTheme;

console.log('✅ Sistema de personalización cargado - v2.1.0');
