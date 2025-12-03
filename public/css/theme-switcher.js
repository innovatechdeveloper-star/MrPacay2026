/* ============================================
   THEME SWITCHER - Sistema de Cambio de Temas
   Autor: Sistema de Diseño Accesible
   ============================================ */

(function() {
    'use strict';
    
    // ===================================
    // CONFIGURACIÓN - AUTO-DETECCIÓN DE TEMAS
    // ===================================
    const THEMES = {
        light: {
            name: 'Claro',
            file: '/css/themes/light.css',
            icon: '☀️',
            description: 'Paleta original rosa vibrante'
        },
        natural: {
            name: 'Serenidad Natural',
            file: '/css/themes/natural.css',
            icon: '🌿',
            description: 'Paleta cálida y orgánica'
        },
        elegant: {
            name: 'Elegancia Moderna',
            file: '/css/themes/elegant.css',
            icon: '✨',
            description: 'Paleta sofisticada y minimalista'
        },
        professional: {
            name: 'Confianza Profesional',
            file: '/css/themes/professional.css',
            icon: '💼',
            description: 'Paleta enérgica y confiable'
        }
    };
    
    const STORAGE_KEY = 'app-theme';
    const DEFAULT_THEME = 'light';
    
    // ===================================
    // CLASE PRINCIPAL
    // ===================================
    class ThemeSwitcher {
        constructor() {
            this.currentTheme = this.loadTheme();
            this.themeLink = null;
            this.init();
        }
        
        // Inicialización
        init() {
            this.createThemeLink();
            this.applyTheme(this.currentTheme);
            this.createUI();
            this.setupKeyboardShortcuts();
        }
        
        // Crear <link> tag para tema
        createThemeLink() {
            this.themeLink = document.createElement('link');
            this.themeLink.rel = 'stylesheet';
            this.themeLink.id = 'theme-stylesheet';
            document.head.appendChild(this.themeLink);
        }
        
        // Aplicar tema
        applyTheme(themeName) {
            if (!THEMES[themeName]) {
                console.warn(`Tema "${themeName}" no existe. Usando tema por defecto.`);
                themeName = DEFAULT_THEME;
            }
            
            const theme = THEMES[themeName];
            this.themeLink.href = theme.file;
            
            // Actualizar data-theme en root
            document.documentElement.setAttribute('data-theme', themeName);
            
            // Actualizar body class (compatibilidad)
            document.body.className = document.body.className
                .replace(/theme-\w+/g, '')
                .trim();
            document.body.classList.add(`theme-${themeName}`);
            
            // Guardar preferencia
            this.currentTheme = themeName;
            this.saveTheme(themeName);
            
            // Disparar evento
            this.dispatchThemeChange(themeName);
            
            console.log(`✅ Tema aplicado: ${theme.name}`);
        }
        
        // Guardar tema en localStorage
        saveTheme(themeName) {
            try {
                localStorage.setItem(STORAGE_KEY, themeName);
            } catch (e) {
                console.warn('No se pudo guardar el tema:', e);
            }
        }
        
        // Cargar tema desde localStorage
        loadTheme() {
            try {
                return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
            } catch (e) {
                console.warn('No se pudo cargar el tema:', e);
                return DEFAULT_THEME;
            }
        }
        
        // Disparar evento de cambio de tema
        dispatchThemeChange(themeName) {
            const event = new CustomEvent('themechange', {
                detail: {
                    theme: themeName,
                    themeData: THEMES[themeName]
                }
            });
            window.dispatchEvent(event);
        }
        
        // Crear UI del switcher
        createUI() {
            const container = document.createElement('div');
            container.id = 'theme-switcher-container';
            container.innerHTML = `
                <button id="theme-switcher-button" 
                        class="theme-switcher-btn"
                        aria-label="Cambiar tema"
                        aria-expanded="false"
                        aria-controls="theme-switcher-menu">
                    <span class="theme-icon">${THEMES[this.currentTheme].icon}</span>
                    <span class="sr-only">Tema actual: ${THEMES[this.currentTheme].name}</span>
                </button>
                
                <div id="theme-switcher-menu" 
                     class="theme-switcher-menu"
                     role="menu"
                     aria-label="Seleccionar tema"
                     hidden>
                    <div class="theme-switcher-header">
                        <h3>Elegir Tema</h3>
                        <button class="theme-close-btn" aria-label="Cerrar menú">✕</button>
                    </div>
                    <ul class="theme-list">
                        ${this.generateThemeOptions()}
                    </ul>
                </div>
            `;
            
            document.body.appendChild(container);
            this.attachUIEvents();
            this.injectStyles();
        }
        
        // Generar opciones de tema
        generateThemeOptions() {
            return Object.entries(THEMES).map(([key, theme]) => `
                <li>
                    <button class="theme-option ${key === this.currentTheme ? 'active' : ''}"
                            data-theme="${key}"
                            role="menuitemradio"
                            aria-checked="${key === this.currentTheme}">
                        <span class="theme-option-icon">${theme.icon}</span>
                        <div class="theme-option-info">
                            <span class="theme-option-name">${theme.name}</span>
                            <span class="theme-option-desc">${theme.description}</span>
                        </div>
                        ${key === this.currentTheme ? '<span class="theme-check">✓</span>' : ''}
                    </button>
                </li>
            `).join('');
        }
        
        // Eventos UI
        attachUIEvents() {
            const button = document.getElementById('theme-switcher-button');
            const menu = document.getElementById('theme-switcher-menu');
            const closeBtn = document.querySelector('.theme-close-btn');
            const options = document.querySelectorAll('.theme-option');
            
            // Toggle menu
            button.addEventListener('click', () => this.toggleMenu());
            
            // Cerrar menu
            closeBtn.addEventListener('click', () => this.closeMenu());
            
            // Click fuera del menu
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#theme-switcher-container')) {
                    this.closeMenu();
                }
            });
            
            // Cambiar tema
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const theme = e.currentTarget.dataset.theme;
                    this.applyTheme(theme);
                    this.updateUI();
                    this.closeMenu();
                });
            });
            
            // Escape para cerrar
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !menu.hidden) {
                    this.closeMenu();
                    button.focus();
                }
            });
        }
        
        // Toggle menu
        toggleMenu() {
            const button = document.getElementById('theme-switcher-button');
            const menu = document.getElementById('theme-switcher-menu');
            const isHidden = menu.hidden;
            
            menu.hidden = !isHidden;
            button.setAttribute('aria-expanded', isHidden);
            
            if (isHidden) {
                // Focus primer opción
                const firstOption = menu.querySelector('.theme-option');
                if (firstOption) firstOption.focus();
            }
        }
        
        // Cerrar menu
        closeMenu() {
            const button = document.getElementById('theme-switcher-button');
            const menu = document.getElementById('theme-switcher-menu');
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
        }
        
        // Actualizar UI después de cambio
        updateUI() {
            const button = document.getElementById('theme-switcher-button');
            const options = document.querySelectorAll('.theme-option');
            
            // Actualizar icono
            button.querySelector('.theme-icon').textContent = THEMES[this.currentTheme].icon;
            button.querySelector('.sr-only').textContent = `Tema actual: ${THEMES[this.currentTheme].name}`;
            
            // Actualizar opciones activas
            options.forEach(option => {
                const theme = option.dataset.theme;
                const isActive = theme === this.currentTheme;
                option.classList.toggle('active', isActive);
                option.setAttribute('aria-checked', isActive);
                
                // Actualizar check
                const check = option.querySelector('.theme-check');
                if (check) check.remove();
                if (isActive) {
                    option.insertAdjacentHTML('beforeend', '<span class="theme-check">✓</span>');
                }
            });
        }
        
        // Atajos de teclado
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K para abrir switcher
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggleMenu();
                }
                
                // Ctrl/Cmd + Shift + T para rotar temas
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    this.cycleTheme();
                }
            });
        }
        
        // Rotar entre temas
        cycleTheme() {
            const themes = Object.keys(THEMES);
            const currentIndex = themes.indexOf(this.currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            this.applyTheme(themes[nextIndex]);
            this.updateUI();
        }
        
        // Inyectar estilos
        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* Theme Switcher Styles */
                #theme-switcher-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 1070;
                }
                
                .theme-switcher-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: var(--color-primary, #0047AB);
                    color: white;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 250ms ease;
                }
                
                .theme-switcher-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                }
                
                .theme-switcher-btn:focus-visible {
                    outline: 3px solid var(--color-primary, #0047AB);
                    outline-offset: 3px;
                }
                
                .theme-switcher-menu {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 320px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
                    border: 2px solid var(--color-border-primary, #D9D9D9);
                    overflow: hidden;
                }
                
                .theme-switcher-header {
                    padding: 16px;
                    border-bottom: 2px solid var(--color-border-secondary, #EFEFEF);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .theme-switcher-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .theme-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                    opacity: 0.6;
                    transition: opacity 150ms;
                }
                
                .theme-close-btn:hover {
                    opacity: 1;
                }
                
                .theme-list {
                    list-style: none;
                    padding: 8px;
                    margin: 0;
                }
                
                .theme-option {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid transparent;
                    border-radius: 8px;
                    background: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    transition: all 150ms;
                }
                
                .theme-option:hover {
                    background: var(--color-background-secondary, #EFEFEF);
                    border-color: var(--color-primary, #0047AB);
                }
                
                .theme-option.active {
                    background: var(--color-primary-light, #E6F0FF);
                    border-color: var(--color-primary, #0047AB);
                }
                
                .theme-option-icon {
                    font-size: 32px;
                    line-height: 1;
                }
                
                .theme-option-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .theme-option-name {
                    font-weight: 600;
                    font-size: 15px;
                }
                
                .theme-option-desc {
                    font-size: 13px;
                    opacity: 0.7;
                }
                
                .theme-check {
                    font-size: 20px;
                    color: var(--color-primary, #0047AB);
                    font-weight: bold;
                }
                
                @media (max-width: 768px) {
                    #theme-switcher-container {
                        bottom: 16px;
                        right: 16px;
                    }
                    
                    .theme-switcher-menu {
                        width: 280px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ===================================
    // INICIALIZACIÓN
    // ===================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.themeSwitcher = new ThemeSwitcher();
        });
    } else {
        window.themeSwitcher = new ThemeSwitcher();
    }
    
    // ===================================
    // API PÚBLICA
    // ===================================
    window.ThemeAPI = {
        getTheme: () => window.themeSwitcher.currentTheme,
        setTheme: (theme) => window.themeSwitcher.applyTheme(theme),
        getThemes: () => THEMES,
        onThemeChange: (callback) => {
            window.addEventListener('themechange', (e) => callback(e.detail));
        }
    };
    
})();
