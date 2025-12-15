/* ========================================== */
/* UTILIDADES PARA COMPONENTES AVANZADOS */
/* JavaScript helpers para usar los componentes */
/* ========================================== */

// ========================================== 
// NOTIFICACIÓN TOAST
// ==========================================

function showToast(title, message, type = 'info') {
    // Remover toast anterior si existe
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const iconMap = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this)">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        closeToast(toast.querySelector('.toast-close'));
    }, 5000);
}

function closeToast(btn) {
    const toast = btn.closest('.toast-notification');
    toast.style.animation = 'slideOutRight 0.4s ease-out';
    setTimeout(() => toast.remove(), 400);
}

// ==========================================
// LOADING HAMSTER
// ==========================================

function showLoading(text = 'Procesando...') {
    // Remover loading anterior si existe
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div aria-label="Orange and tan hamster running in a metal wheel" role="img" class="wheel-and-hamster">
                <div class="wheel"></div>
                <div class="hamster">
                    <div class="hamster__body">
                        <div class="hamster__head">
                            <div class="hamster__ear"></div>
                            <div class="hamster__eye"></div>
                            <div class="hamster__nose"></div>
                        </div>
                        <div class="hamster__limb hamster__limb--fr"></div>
                        <div class="hamster__limb hamster__limb--fl"></div>
                        <div class="hamster__limb hamster__limb--br"></div>
                        <div class="hamster__limb hamster__limb--bl"></div>
                        <div class="hamster__tail"></div>
                    </div>
                </div>
                <div class="spoke"></div>
            </div>
            <div class="loading-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-text').textContent = text;
    }
    
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ==========================================
// SUCCESS CHECKBOX
// ==========================================

function showSuccess(text = 'REGISTRADO CORRECTAMENTE') {
    // Remover success anterior si existe
    let overlay = document.querySelector('.success-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="success-checkbox" checked>
                <svg viewBox="0 0 35.6 35.6">
                    <circle class="background" cx="17.8" cy="17.8" r="17.8"></circle>
                    <circle class="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                    <polyline class="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                </svg>
            </div>
            <div class="success-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.success-text').textContent = text;
    }
    
    overlay.classList.add('active');
    
    // Auto cerrar después de 1 segundo
    setTimeout(() => {
        overlay.classList.remove('active');
        // Remover del DOM después de la animación
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }, 1000);
}

// ==========================================
// POPUP MENU RULETA
// ==========================================

function showWheelMenu(options) {
    // Crear overlay
    let popup = document.querySelector('.popup-overlay');
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'popup-overlay';
        document.body.appendChild(popup);
    }
    
    // Crear menu wheel
    popup.innerHTML = `
        <div class="menu-wheel">
            <div class="up">
                <button class="wheel-card wheel-card1" onclick="handleWheelOption('${options[0].action}')">
                    <div class="wheel-icon">${options[0].icon}</div>
                    <div class="wheel-label">${options[0].label}</div>
                </button>
                <button class="wheel-card wheel-card2" onclick="handleWheelOption('${options[1].action}')">
                    <div class="wheel-icon">${options[1].icon}</div>
                    <div class="wheel-label">${options[1].label}</div>
                </button>
            </div>
            <div class="down">
                <button class="wheel-card wheel-card3" onclick="handleWheelOption('${options[2].action}')">
                    <div class="wheel-icon">${options[2].icon}</div>
                    <div class="wheel-label">${options[2].label}</div>
                </button>
                <button class="wheel-card wheel-card4" onclick="handleWheelOption('${options[3].action}')">
                    <div class="wheel-icon">${options[3].icon}</div>
                    <div class="wheel-label">${options[3].label}</div>
                </button>
            </div>
        </div>
    `;
    
    popup.classList.add('active');
    
    // Cerrar al hacer click fuera
    popup.onclick = (e) => {
        if (e.target === popup) {
            closeWheelMenu();
        }
    };
}

function closeWheelMenu() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) {
        popup.classList.remove('active');
    }
}

function handleWheelOption(action) {
    closeWheelMenu();
    
    // Aquí se ejecuta la acción según el botón presionado
    if (window[action] && typeof window[action] === 'function') {
        window[action]();
    } else {
        console.log('Acción seleccionada:', action);
    }
}

// ==========================================
// BACKGROUND SELECTOR
// ==========================================

function initBackgroundSelector() {
    const selector = document.createElement('div');
    selector.innerHTML = `
        <button class="bg-selector-toggle" onclick="toggleBgSelector()" title="Cambiar fondo" style="pointer-events: auto;">
            🎨
        </button>
    `;
    selector.id = 'bg-toggle';
    selector.style.cssText = 'position: fixed; bottom: 80px; left: 20px; z-index: 9990; pointer-events: auto;';
    document.body.appendChild(selector);
    
    // Cargar background guardado
    const savedBg = localStorage.getItem('selectedBackground') || 'bg-diagonal-blue';
    applyBackground(savedBg);
}

function toggleBgSelector() {
    let panel = document.getElementById('bg-selector-panel');
    
    if (!panel) {
        // Crear el panel por primera vez
        panel = document.createElement('div');
        panel.id = 'bg-selector-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: white;
            border-radius: 15px;
            padding: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(0, 0, 0, 0.1);
            width: 240px;
            z-index: 9995;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: auto;
        `;
        
        let gridHTML = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 400px; overflow-y: auto;">';
        
        const bgLabels = {
            'bg-diagonal-blue': 'Diagonal Azul',
            'bg-rain-blue': 'Lluvia Azul',
            'bg-rain-gray': 'Lluvia Gris',
            'bg-christmas': 'Navidad Verde',
            'bg-christmas-red': 'Navidad Roja',
            'bg-dots': 'Puntos',
            'bg-cosmic': 'Cósmico',
            'bg-gradient-wave': 'Ola Gradiente',
            'bg-grid': 'Cuadrícula',
            'bg-bubbles': 'Burbujas'
        };

        const bgStyles = {
            'bg-diagonal-blue': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
            'bg-rain-blue': 'background: linear-gradient(to right, #2e3192, #1bafe0);',
            'bg-rain-gray': 'background: linear-gradient(to bottom, #9ca3af, #4b5563);',
            'bg-christmas': 'background: linear-gradient(135deg, #10b981 0%, #047857 100%);',
            'bg-christmas-red': 'background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);',
            'bg-dots': 'background-color: #ffffff; background-image: radial-gradient(circle, #1f2937 1px, transparent 1px); background-size: 15px 15px;',
            'bg-cosmic': 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);',
            'bg-gradient-wave': 'background: linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%);',
            'bg-grid': 'background: linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px); background-size: 50px 50px;',
            'bg-bubbles': 'background: linear-gradient(135deg, #667eea 0%, #f093fb 100%);'
        };
        
        Object.keys(bgLabels).forEach(bgClass => {
            const bgStyle = bgStyles[bgClass] || '';
            gridHTML += `
                <div data-bg="${bgClass}" style="cursor: pointer; display: flex; flex-direction: column; gap: 6px; align-items: center; padding: 8px; border-radius: 10px; transition: all 0.3s ease; border: 2px solid transparent; pointer-events: auto;">
                    <div style="width: 100%; aspect-ratio: 4/3; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0, 0, 0, 0.05); ${bgStyle}"></div>
                    <span style="font-size: 11px; font-weight: 600; color: #475569; text-align: center; line-height: 1.2;">${bgLabels[bgClass]}</span>
                </div>
            `;
        });
        
        gridHTML += '</div>';
        
        panel.innerHTML = `
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; letter-spacing: 0.3px;">🎨 Seleccionar Fondo</h4>
            ${gridHTML}
        `;
        
        document.body.appendChild(panel);
        
        // Agregar event listeners a todos los items
        panel.querySelectorAll('[data-bg]').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0,0,0,0.04)';
                this.style.borderColor = 'rgba(0,0,0,0.1)';
                this.style.transform = 'translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = '';
                this.style.borderColor = 'transparent';
                this.style.transform = 'translateY(0)';
            });
            
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const bgClass = this.getAttribute('data-bg');
                selectBackground(bgClass);
            });
        });
    } else {
        // Toggle visibility
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    }
}

function selectBackground(bgClass) {
    applyBackground(bgClass);
    localStorage.setItem('selectedBackground', bgClass);
    console.log(`🎨 Fondo cambiado a: ${bgClass}`);
    
    // Cerrar panel después de seleccionar
    setTimeout(() => {
        const panel = document.getElementById('bg-selector-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }, 200);
}

function applyBackground(bgClass) {
    const body = document.body;
    
    // Remover todas las clases de background
    const bgClasses = [
        'bg-diagonal-blue', 'bg-rain-blue', 'bg-rain-gray',
        'bg-christmas', 'bg-christmas-red', 'bg-dots',
        'bg-cosmic', 'bg-gradient-wave', 'bg-grid', 'bg-bubbles'
    ];
    
    bgClasses.forEach(cls => body.classList.remove(cls));
    
    // Aplicar nuevo background
    body.classList.add(bgClass);
    console.log(`✓ Fondo aplicado al body: ${bgClass}`);
    
    // Marcar como activo en el selector
    const panel = document.getElementById('bg-selector-panel');
    if (panel) {
        const items = panel.querySelectorAll('[data-bg]');
        items.forEach(item => {
            if (item.getAttribute('data-bg') === bgClass) {
                item.style.borderColor = '#667eea';
                item.style.background = 'rgba(102, 126, 234, 0.08)';
            } else {
                item.style.borderColor = 'transparent';
                item.style.background = '';
            }
        });
    }
}

// ==========================================
// FUNCIONES DE PROCESO COMPLETO
// ==========================================

async function processWithFeedback(asyncFunction, loadingText, successText) {
    try {
        showLoading(loadingText);
        await asyncFunction();
        hideLoading();
        showSuccess(successText);
    } catch (error) {
        hideLoading();
        showToast('Error', error.message || 'Ocurrió un error', 'error');
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar selector de fondos
    initBackgroundSelector();
    
    // Verificar si es 20 de diciembre para activar fondo navideño
    const today = new Date();
    if (today.getMonth() === 11 && today.getDate() >= 20) { // Diciembre = 11
        const hasSeenChristmas = localStorage.getItem('christmasShown2025');
        if (!hasSeenChristmas) {
            selectBackground('bg-christmas');
            localStorage.setItem('christmasShown2025', 'true');
            showToast('¡Feliz Navidad! 🎄', 'Fondo navideño activado', 'success');
        }
    }
});

// Exponer funciones globales
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showSuccess = showSuccess;
window.showWheelMenu = showWheelMenu;
window.closeWheelMenu = closeWheelMenu;
window.handleWheelOption = handleWheelOption;
window.toggleBgSelector = toggleBgSelector;
window.selectBackground = selectBackground;
window.processWithFeedback = processWithFeedback;
