// UI Management and Interactions
class UIManager {
    constructor() {
        this.isInitialized = false;
        this.activeModals = new Set();
        this.tooltips = new Map();
        this.shortcuts = new Map();
        this.theme = 'light';
        
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();
        this.setupModalSystem();
        this.setupResponsiveDesign();
        this.loadUserPreferences();
        
        this.isInitialized = true;
    }

    setupGlobalEventListeners() {
        // Prevent right-click context menu on canvas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'drawingCanvas') {
                e.preventDefault();
            }
        });

        // Handle escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost - working offline', 'warning');
        });

        // Setup drag and drop for canvas
        this.setupDragAndDrop();
    }

    setupModalSystem() {
        // Enhanced modal functionality
        document.querySelectorAll('.modal').forEach(modal => {
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });

            // Close button functionality
            const closeButtons = modal.querySelectorAll('.modal-close');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModal(modal.id);
                });
            });

            // Trap focus within modal
            modal.addEventListener('keydown', (e) => {
                this.trapFocus(e, modal);
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('active');
        this.activeModals.add(modalId);
        
        // Focus first focusable element
        const focusable = modal.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            setTimeout(() => focusable.focus(), 100);
        }

        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.activeModals.delete(modalId);

        // Re-enable body scroll if no modals are open
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    closeTopModal() {
        if (this.activeModals.size > 0) {
            const topModal = Array.from(this.activeModals).pop();
            this.closeModal(topModal);
        }
    }

    trapFocus(e, modal) {
        if (e.key !== 'Tab') return;

        const focusableElements = modal.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    initializeTooltips() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: var(--text-primary);
            color: var(--surface);
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10000;
            white-space: nowrap;
        `;
        document.body.appendChild(this.tooltip);

        // Setup tooltip triggers
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[title], [data-tooltip]');
            if (element) {
                const text = element.getAttribute('data-tooltip') || element.getAttribute('title');
                if (text) {
                    this.showTooltip(text, e.pageX, e.pageY);
                    element.removeAttribute('title'); // Prevent native tooltip
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const element = e.target.closest('[title], [data-tooltip]');
            if (element) {
                this.hideTooltip();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.tooltip.style.opacity === '1') {
                this.updateTooltipPosition(e.pageX, e.pageY);
            }
        });
    }

    showTooltip(text, x, y) {
        this.tooltip.textContent = text;
        this.updateTooltipPosition(x, y);
        this.tooltip.style.opacity = '1';
    }

    hideTooltip() {
        this.tooltip.style.opacity = '0';
    }

    updateTooltipPosition(x, y) {
        const rect = this.tooltip.getBoundingClientRect();
        let left = x + 10;
        let top = y - rect.height - 10;

        // Adjust if tooltip would go off screen
        if (left + rect.width > window.innerWidth) {
            left = x - rect.width - 10;
        }
        if (top < 0) {
            top = y + 10;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    setupKeyboardShortcuts() {
        const shortcuts = {
            'ctrl+n': () => this.openModal('roomModal'),
            'ctrl+j': () => this.openModal('joinModal'),
            'ctrl+shift+l': () => this.openModal('lobbyModal'),
            'ctrl+shift+s': () => window.roomManager?.shareRoom(),
            'ctrl+shift+c': () => this.clearCanvas(),
            'ctrl+shift+e': () => this.exportCanvas(),
            'f11': (e) => {
                e.preventDefault();
                this.toggleFullscreen();
            },
            'ctrl+shift+h': () => this.toggleHelp(),
            'ctrl+shift+t': () => this.toggleTheme()
        };

        document.addEventListener('keydown', (e) => {
            // Skip if typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = this.getShortcutKey(e);
            const handler = shortcuts[key];
            
            if (handler) {
                e.preventDefault();
                handler(e);
            }
        });

        this.shortcuts = new Map(Object.entries(shortcuts));
    }

    getShortcutKey(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.metaKey) parts.push('meta');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    setupResponsiveDesign() {
        // Handle mobile menu toggle
        this.setupMobileMenu();
        
        // Handle sidebar collapse
        this.setupSidebarToggle();
        
        // Handle responsive canvas
        this.setupResponsiveCanvas();
    }

    setupMobileMenu() {
        // Create mobile menu button if it doesn't exist
        if (!document.getElementById('mobileMenuBtn')) {
            const header = document.querySelector('.header');
            if (header) {
                const menuBtn = document.createElement('button');
                menuBtn.id = 'mobileMenuBtn';
                menuBtn.className = 'tool-btn mobile-menu-btn';
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                menuBtn.style.display = 'none';
                
                menuBtn.addEventListener('click', () => {
                    this.toggleMobileMenu();
                });
                
                header.querySelector('.header-left').appendChild(menuBtn);
            }
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    }

    setupSidebarToggle() {
        // Create sidebar toggle button
        if (!document.getElementById('sidebarToggle')) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                const toggleBtn = document.createElement('button');
                toggleBtn.id = 'sidebarToggle';
                toggleBtn.className = 'sidebar-toggle';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                toggleBtn.title = 'Toggle Sidebar';
                
                toggleBtn.addEventListener('click', () => {
                    this.toggleSidebar();
                });
                
                sidebar.appendChild(toggleBtn);
            }
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            const toggleBtn = document.getElementById('sidebarToggle');
            
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
            
            // Save preference
            localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
        }
    }

    setupResponsiveCanvas() {
        const canvas = document.getElementById('drawingCanvas');
        const container = document.querySelector('.canvas-container');
        
        if (!canvas || !container) return;

        const resizeObserver = new ResizeObserver(() => {
            this.adjustCanvasSize();
        });
        
        resizeObserver.observe(container);
    }

    adjustCanvasSize() {
        const canvas = document.getElementById('drawingCanvas');
        const container = document.querySelector('.canvas-container');
        
        if (!canvas || !container) return;

        const containerRect = container.getBoundingClientRect();
        const padding = 40; // 20px padding on each side
        
        const maxWidth = containerRect.width - padding;
        const maxHeight = containerRect.height - padding;
        
        // Maintain aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        let newWidth = maxWidth;
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    }

    setupDragAndDrop() {
        const canvas = document.getElementById('drawingCanvas');
        if (!canvas) return;

        // Prevent default drag behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            canvas.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            canvas.addEventListener(eventName, () => {
                canvas.classList.add('drag-highlight');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            canvas.addEventListener(eventName, () => {
                canvas.classList.remove('drag-highlight');
            });
        });

        // Handle file drop
        canvas.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
    }

    handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.importImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    importImage(img) {
        if (window.drawingEngine) {
            const activeLayer = window.drawingEngine.getActiveLayer();
            if (activeLayer) {
                // Draw image to active layer
                activeLayer.ctx.drawImage(img, 0, 0);
                window.drawingEngine.renderLayers();
                
                // Save state for undo
                if (window.undoRedoManager) {
                    window.undoRedoManager.saveState('Image imported');
                }
                
                this.showNotification('Image imported successfully', 'success');
            }
        }
    }

    handleWindowResize() {
        // Update tooltip position
        this.hideTooltip();
        
        // Update canvas size
        this.adjustCanvasSize();
        
        // Update mobile menu visibility
        this.updateMobileMenuVisibility();
    }

    updateMobileMenuVisibility() {
        const menuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuBtn && sidebar) {
            if (window.innerWidth <= 768) {
                menuBtn.style.display = 'flex';
                sidebar.classList.add('mobile-hidden');
            } else {
                menuBtn.style.display = 'none';
                sidebar.classList.remove('mobile-hidden', 'mobile-open');
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause animations, save state, etc.
            this.pauseAnimations();
        } else {
            // Page is visible - resume animations, sync state, etc.
            this.resumeAnimations();
        }
    }

    pauseAnimations() {
        document.body.classList.add('animations-paused');
    }

    resumeAnimations() {
        document.body.classList.remove('animations-paused');
    }

    clearCanvas() {
        if (window.drawingEngine) {
            if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
                window.drawingEngine.clearCanvas();
                this.showNotification('Canvas cleared', 'info');
            }
        }
    }

    exportCanvas() {
        if (window.drawingEngine) {
            window.drawingEngine.saveCanvas();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                this.showNotification('Fullscreen not supported', 'warning');
            });
        } else {
            document.exitFullscreen();
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        this.showNotification(`Switched to ${this.theme} theme`, 'info');
    }

    toggleHelp() {
        this.showHelpModal();
    }

    showHelpModal() {
        // Create help modal if it doesn't exist
        if (!document.getElementById('helpModal')) {
            const modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2><i class="fas fa-question-circle"></i> Help & Shortcuts</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${this.generateHelpContent()}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close">Close</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.setupModalSystem(); // Re-setup for new modal
        }
        
        this.openModal('helpModal');
    }

    generateHelpContent() {
        return `
            <div class="help-sections">
                <div class="help-section">
                    <h3>Drawing Tools</h3>
                    <div class="help-grid">
                        <div class="help-item">
                            <kbd>B</kbd>
                            <span>Brush tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>P</kbd>
                            <span>Pencil tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>E</kbd>
                            <span>Eraser tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>L</kbd>
                            <span>Line tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>R</kbd>
                            <span>Rectangle tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>C</kbd>
                            <span>Circle tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>T</kbd>
                            <span>Text tool</span>
                        </div>
                        <div class="help-item">
                            <kbd>S</kbd>
                            <span>Select tool</span>
                        </div>
                    </div>
                </div>
                
                <div class="help-section">
                    <h3>Brush Controls</h3>
                    <div class="help-grid">
                        <div class="help-item">
                            <kbd>[</kbd>
                            <span>Decrease brush size</span>
                        </div>
                        <div class="help-item">
                            <kbd>]</kbd>
                            <span>Increase brush size</span>
                        </div>
                    </div>
                </div>
                
                <div class="help-section">
                    <h3>General Controls</h3>
                    <div class="help-grid">
                        <div class="help-item">
                            <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                            <span>Undo</span>
                        </div>
                        <div class="help-item">
                            <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                            <span>Redo</span>
                        </div>
                        <div class="help-item">
                            <kbd>Ctrl</kbd> + <kbd>S</kbd>
                            <span>Save state</span>
                        </div>
                        <div class="help-item">
                            <kbd>Ctrl</kbd> + <kbd>N</kbd>
                            <span>New room</span>
                        </div>
                        <div class="help-item">
                            <kbd>Ctrl</kbd> + <kbd>J</kbd>
                            <span>Join room</span>
                        </div>
                        <div class="help-item">
                            <kbd>F11</kbd>
                            <span>Toggle fullscreen</span>
                        </div>
                        <div class="help-item">
                            <kbd>Esc</kbd>
                            <span>Close modal</span>
                        </div>
                    </div>
                </div>
                
                <div class="help-section">
                    <h3>Room Features</h3>
                    <ul>
                        <li><strong>Public Rooms:</strong> Visible in the lobby, anyone can join</li>
                        <li><strong>Private Rooms:</strong> Require a join code or invite link</li>
                        <li><strong>URL Sharing:</strong> Share room links for easy access</li>
                        <li><strong>Real-time Collaboration:</strong> See other users' drawings live</li>
                        <li><strong>Layer Support:</strong> Work on multiple layers</li>
                        <li><strong>Undo/Redo:</strong> Full history with optimized performance</li>
                    </ul>
                </div>
            </div>
        `;
    }

    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        const container = document.getElementById('notifications');
        if (container) {
            container.appendChild(notification);
            
            // Close button functionality
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.remove();
            });
            
            // Auto-remove
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    loadUserPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.theme = savedTheme;
            document.documentElement.setAttribute('data-theme', this.theme);
        }
        
        // Load sidebar state
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            this.toggleSidebar();
        }
        
        // Load other preferences
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        this.applyPreferences(preferences);
    }

    saveUserPreferences() {
        const preferences = {
            theme: this.theme,
            sidebarCollapsed: document.querySelector('.sidebar')?.classList.contains('collapsed') || false,
            // Add more preferences as needed
        };
        
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }

    applyPreferences(preferences) {
        // Apply loaded preferences
        if (preferences.theme) {
            this.theme = preferences.theme;
            document.documentElement.setAttribute('data-theme', this.theme);
        }
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        this.performanceStats = {
            frameRate: 0,
            memoryUsage: 0,
            renderTime: 0
        };
        
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitor = () => {
            const now = performance.now();
            frameCount++;
            
            if (now - lastTime >= 1000) {
                this.performanceStats.frameRate = frameCount;
                frameCount = 0;
                lastTime = now;
                
                // Update memory usage if available
                if (performance.memory) {
                    this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
                }
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        this.shortcuts.clear();
        
        // Remove tooltip
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Save preferences
        this.saveUserPreferences();
    }
}

// Add CSS for UI enhancements
const uiCSS = `
.drag-highlight {
    border: 2px dashed var(--primary-color) !important;
    background: rgba(102, 126, 234, 0.1) !important;
}

.mobile-menu-btn {
    display: none !important;
}

.sidebar.mobile-hidden {
    transform: translateX(-100%);
}

.sidebar.mobile-open {
    transform: translateX(0);
}

.sidebar-toggle {
    position: absolute;
    top: 50%;
    right: -12px;
    transform: translateY(-50%);
    width: 24px;
    height: 48px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0 6px 6px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--text-secondary);
    transition: var(--transition);
    z-index: 10;
}

.sidebar-toggle:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
}

.sidebar.collapsed {
    width: 60px;
    overflow: hidden;
}

.sidebar.collapsed .tool-panel h3,
.sidebar.collapsed .settings-panel h3,
.sidebar.collapsed .color-panel h3,
.sidebar.collapsed .layers-panel h3,
.sidebar.collapsed .layer-name,
.sidebar.collapsed .setting-group label,
.sidebar.collapsed .color-section h4 {
    opacity: 0;
}

.help-sections {
    display: grid;
    gap: 24px;
}

.help-section h3 {
    margin-bottom: 12px;
    color: var(--primary-color);
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
}

.help-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
}

.help-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--background);
    border-radius: 4px;
}

.help-item kbd {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 24px;
    text-align: center;
}

.help-section ul {
    list-style: none;
    padding: 0;
}

.help-section li {
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
}

.help-section li:last-child {
    border-bottom: none;
}

.notification {
    position: relative;
    animation: slideInRight 0.3s ease;
}

.notification-close {
    opacity: 0.7;
    transition: var(--transition);
}

.notification-close:hover {
    opacity: 1;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animations-paused * {
    animation-play-state: paused !important;
    transition: none !important;
}

@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        left: 0;
        top: 64px;
        height: calc(100vh - 64px);
        z-index: 200;
        transition: transform 0.3s ease;
    }
    
    .sidebar.mobile-hidden {
        transform: translateX(-100%);
    }
    
    .sidebar.mobile-open {
        transform: translateX(0);
    }
    
    .mobile-menu-btn {
        display: flex !important;
    }
    
    .main-content {
        margin-left: 0;
    }
    
    .help-grid {
        grid-template-columns: 1fr;
    }
}

/* Dark theme support */
[data-theme="dark"] {
    --background: #0f172a;
    --surface: #1e293b;
    --surface-hover: #334155;
    --border: #475569;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
}

/* High contrast mode */
@media (prefers-contrast: high) {
    :root {
        --border: #000000;
        --text-secondary: #000000;
    }
    
    [data-theme="dark"] {
        --border: #ffffff;
        --text-secondary: #ffffff;
    }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
`;

// Add CSS to document
const uiStyle = document.createElement('style');
uiStyle.textContent = uiCSS;
document.head.appendChild(uiStyle);

// Initialize UI manager
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
    window.uiManager.startPerformanceMonitoring();
});

// Export for external use
window.UIManager = UIManager;