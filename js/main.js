// Main Application Controller
class DrawingApp {
    constructor() {
        this.isInitialized = false;
        this.version = '2.0.0';
        this.components = {};
        this.eventBus = new EventTarget();
        
        this.init();
    }

    async init() {
        try {
            console.log(`🎨 Initializing Drawing Board v${this.version}`);
            
            // Show loading screen
            this.showLoading();
            
            // Initialize components in order
            await this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup inter-component communication
            this.setupEventBus();
            
            // Check for existing room or URL parameters
            await this.checkInitialState();
            
            // Hide loading screen
            this.hideLoading();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Drawing Board initialized successfully');
            
            // Dispatch ready event
            this.eventBus.dispatchEvent(new CustomEvent('appReady', { 
                detail: { version: this.version } 
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.hideLoading();
            this.showCriticalError('Failed to initialize application. Please refresh the page.');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    async initializeComponents() {
        const initSteps = [
            { name: 'UI Manager', init: () => this.initUIManager() },
            { name: 'Color Manager', init: () => this.initColorManager() },
            { name: 'Room Manager', init: () => this.initRoomManager() },
            { name: 'Performance Monitor', init: () => this.initPerformanceMonitor() }
        ];

        for (const step of initSteps) {
            try {
                console.log(`Initializing ${step.name}...`);
                await step.init();
                console.log(`✓ ${step.name} initialized`);
            } catch (error) {
                console.error(`✗ Failed to initialize ${step.name}:`, error);
                throw new Error(`Component initialization failed: ${step.name}`);
            }
        }
    }

    async initUIManager() {
        // UI Manager is initialized in ui.js
        this.components.ui = window.uiManager;
        
        // Wait for UI to be ready
        return new Promise((resolve) => {
            if (this.components.ui?.isInitialized) {
                resolve();
            } else {
                const checkUI = () => {
                    if (window.uiManager?.isInitialized) {
                        this.components.ui = window.uiManager;
                        resolve();
                    } else {
                        setTimeout(checkUI, 50);
                    }
                };
                checkUI();
            }
        });
    }

    async initColorManager() {
        // Color Manager is initialized in colors.js
        return new Promise((resolve) => {
            if (window.colorManager) {
                this.components.color = window.colorManager;
                resolve();
            } else {
                const checkColor = () => {
                    if (window.colorManager) {
                        this.components.color = window.colorManager;
                        resolve();
                    } else {
                        setTimeout(checkColor, 50);
                    }
                };
                checkColor();
            }
        });
    }

    async initRoomManager() {
        // Room Manager is initialized in rooms.js
        return new Promise((resolve) => {
            if (window.roomManager) {
                this.components.room = window.roomManager;
                resolve();
            } else {
                const checkRoom = () => {
                    if (window.roomManager) {
                        this.components.room = window.roomManager;
                        resolve();
                    } else {
                        setTimeout(checkRoom, 50);
                    }
                };
                checkRoom();
            }
        });
    }

    async initPerformanceMonitor() {
        this.performanceMonitor = {
            startTime: performance.now(),
            metrics: {
                fps: 0,
                memory: 0,
                drawCalls: 0,
                undoRedoSize: 0
            },
            isMonitoring: false
        };

        this.startPerformanceMonitoring();
    }

    async checkInitialState() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        const code = urlParams.get('code');
        
        if (roomId && code) {
            console.log('🔗 Room parameters found in URL');
            // Room manager will handle this automatically
            return;
        }

        // Check for stored room session
        const storedRoom = localStorage.getItem('currentRoom');
        if (storedRoom) {
            try {
                const roomData = JSON.parse(storedRoom);
                if (this.isRoomSessionValid(roomData)) {
                    console.log('💾 Restoring previous room session');
                    await this.restoreRoomSession(roomData);
                    return;
                }
            } catch (error) {
                console.error('Failed to restore room session:', error);
                localStorage.removeItem('currentRoom');
            }
        }

        // Show landing page if no room to join
        console.log('🏠 Showing landing page');
        if (this.components.room) {
            this.components.room.showLandingPage();
        }
    }

    isRoomSessionValid(roomData) {
        if (!roomData || !roomData.id || !roomData.joinCode) return false;
        
        // Check if session is not too old (24 hours)
        const sessionAge = Date.now() - (roomData.timestamp || 0);
        return sessionAge < 24 * 60 * 60 * 1000;
    }

    async restoreRoomSession(roomData) {
        if (this.components.room) {
            try {
                await this.components.room.joinRoom(roomData.joinCode, 'Returning User');
            } catch (error) {
                console.error('Failed to restore room session:', error);
                this.components.room.showLandingPage();
            }
        }
    }

    initializeCanvas() {
        const canvas = document.getElementById('drawingCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Initialize drawing engine
        if (window.initDrawingEngine) {
            this.components.drawing = window.initDrawingEngine(canvas);
            console.log('✓ Drawing engine initialized');
        }
        
        // Initialize undo/redo
        if (window.initUndoRedo) {
            this.components.undoRedo = window.initUndoRedo(canvas);
            console.log('✓ Undo/Redo system initialized');
        }
        
        // Save initial state after a short delay
        setTimeout(() => {
            if (this.components.undoRedo) {
                this.components.undoRedo.saveState('Initial canvas state');
            }
        }, 500);
    }

    setupGlobalEventListeners() {
        // Prevent context menu on canvas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'drawingCanvas') {
                e.preventDefault();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (this.components.room?.currentRoom) {
                this.saveApplicationState();
                // Don't show confirmation dialog as it's annoying
                // e.preventDefault();
                // e.returnValue = 'Are you sure you want to leave? Your drawing progress may be lost.';
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatusChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleOnlineStatusChange(false);
        });

        // Handle errors
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e.error, e.message, e.filename, e.lineno);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.handleGlobalError(e.reason, 'Unhandled Promise Rejection');
        });
    }

    setupEventBus() {
        // Room events
        this.eventBus.addEventListener('roomJoined', (e) => {
            console.log('🏠 Room joined:', e.detail);
            this.initializeCanvas();
            this.updateApplicationState();
        });

        this.eventBus.addEventListener('roomLeft', (e) => {
            console.log('🚪 Room left:', e.detail);
            this.cleanupCanvas();
            this.updateApplicationState();
        });

        // Drawing events
        this.eventBus.addEventListener('drawingAction', (e) => {
            this.updatePerformanceMetrics('drawCalls', 1);
        });

        // Color events
        this.eventBus.addEventListener('colorChanged', (e) => {
            console.log('🎨 Color changed:', e.detail.color);
        });

        // Error events
        this.eventBus.addEventListener('error', (e) => {
            this.handleApplicationError(e.detail);
        });

        // Performance events
        this.eventBus.addEventListener('performanceUpdate', (e) => {
            this.updatePerformanceDisplay(e.detail);
        });
    }

    handleResize() {
        console.log('📱 Window resized');
        
        // Update canvas sizing
        if (this.components.drawing) {
            // Drawing engine handles its own resize logic
        }
        
        // Update UI components
        if (this.components.ui) {
            this.components.ui.handleWindowResize();
        }
        
        // Dispatch resize event
        this.eventBus.dispatchEvent(new CustomEvent('windowResize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
    }

    handlePageHidden() {
        console.log('👁️ Page hidden - saving state');
        
        // Save current state
        this.saveApplicationState();
        
        // Pause animations and reduce activity
        if (this.components.ui) {
            this.components.ui.pauseAnimations();
        }
        
        // Reduce performance monitoring frequency
        this.performanceMonitor.isMonitoring = false;
    }

    handlePageVisible() {
        console.log('👁️ Page visible - resuming activity');
        
        // Resume animations
        if (this.components.ui) {
            this.components.ui.resumeAnimations();
        }
        
        // Resume performance monitoring
        this.performanceMonitor.isMonitoring = true;
        
        // Sync room state if in a room
        if (this.components.room?.currentRoom) {
            this.syncRoomState();
        }
    }

    handleOnlineStatusChange(isOnline) {
        console.log(`🌐 Connection ${isOnline ? 'restored' : 'lost'}`);
        
        const message = isOnline ? 'Connection restored' : 'Working offline';
        const type = isOnline ? 'success' : 'warning';
        
        if (this.components.ui) {
            this.components.ui.showNotification(message, type);
        }
        
        // Update room connection status
        if (this.components.room) {
            this.components.room.isOnline = isOnline;
        }
    }

    handleGlobalError(error, message, filename, lineno) {
        console.error('🚨 Global error:', { error, message, filename, lineno });
        
        // Don't show error notifications for minor issues
        const isMinorError = message?.includes('ResizeObserver') || 
                           message?.includes('Non-Error promise rejection');
        
        if (!isMinorError && this.components.ui) {
            this.components.ui.showNotification(
                'An error occurred. Please refresh if issues persist.', 
                'error'
            );
        }
        
        // Log error for debugging
        this.logError({
            type: 'global',
            error: error?.toString() || message,
            filename,
            lineno,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    handleApplicationError(errorDetail) {
        console.error('🔥 Application error:', errorDetail);
        
        if (this.components.ui) {
            this.components.ui.showNotification(
                errorDetail.message || 'An application error occurred',
                'error'
            );
        }
    }

    cleanupCanvas() {
        // Clear drawing components
        this.components.drawing = null;
        this.components.undoRedo = null;
        
        // Clear global references
        window.drawingEngine = null;
        window.undoRedoManager = null;
    }

    saveApplicationState() {
        try {
            const state = {
                version: this.version,
                timestamp: Date.now(),
                room: this.components.room?.currentRoom ? {
                    id: this.components.room.currentRoom.id,
                    joinCode: this.components.room.currentRoom.joinCode,
                    type: this.components.room.currentRoom.type
                } : null,
                canvas: this.components.drawing?.exportCanvasData() || null,
                colors: this.components.color?.exportPalette() || null,
                undoRedo: this.components.undoRedo?.exportStates(false) || null, // Don't include image data
                preferences: this.getUserPreferences()
            };
            
            // Save to localStorage
            localStorage.setItem('appState', JSON.stringify(state));
            console.log('💾 Application state saved');
            
        } catch (error) {
            console.error('Failed to save application state:', error);
        }
    }

    loadApplicationState() {
        try {
            const stateJson = localStorage.getItem('appState');
            if (!stateJson) return null;
            
            const state = JSON.parse(stateJson);
            
            // Check version compatibility
            if (state.version !== this.version) {
                console.log('⚠️ State version mismatch, skipping restore');
                return null;
            }
            
            // Check if state is not too old (24 hours)
            const age = Date.now() - (state.timestamp || 0);
            if (age > 24 * 60 * 60 * 1000) {
                console.log('⏰ State too old, skipping restore');
                return null;
            }
            
            return state;
            
        } catch (error) {
            console.error('Failed to load application state:', error);
            return null;
        }
    }

    restoreApplicationState(state) {
        try {
            // Restore color palette
            if (state.colors && this.components.color) {
                this.components.color.importPalette(state.colors);
            }
            
            // Restore canvas (only if in a room)
            if (state.canvas && this.components.drawing && this.components.room?.currentRoom) {
                this.components.drawing.importCanvasData(state.canvas);
            }
            
            // Restore undo/redo states (metadata only)
            if (state.undoRedo && this.components.undoRedo) {
                this.components.undoRedo.importStates(state.undoRedo, false);
            }
            
            // Restore user preferences
            if (state.preferences) {
                this.applyUserPreferences(state.preferences);
            }
            
            console.log('🔄 Application state restored');
            
        } catch (error) {
            console.error('Failed to restore application state:', error);
        }
    }

    getUserPreferences() {
        return {
            theme: document.documentElement.getAttribute('data-theme') || 'light',
            sidebarCollapsed: document.querySelector('.sidebar')?.classList.contains('collapsed') || false,
            // Add more preferences as needed
        };
    }

    applyUserPreferences(preferences) {
        if (preferences.theme) {
            document.documentElement.setAttribute('data-theme', preferences.theme);
        }
        
        if (preferences.sidebarCollapsed && this.components.ui) {
            // Apply sidebar state
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                this.components.ui.toggleSidebar();
            }
        }
    }

    updateApplicationState() {
        // Update current room reference
        if (this.components.room?.currentRoom) {
            localStorage.setItem('currentRoom', JSON.stringify({
                id: this.components.room.currentRoom.id,
                joinCode: this.components.room.currentRoom.joinCode,
                type: this.components.room.currentRoom.type,
                timestamp: Date.now()
            }));
        } else {
            localStorage.removeItem('currentRoom');
        }
    }

    syncRoomState() {
        // Sync with room if connected
        if (this.components.room?.currentRoom) {
            console.log('🔄 Syncing room state');
            // Room manager handles its own sync logic
        }
    }

    startPerformanceMonitoring() {
        if (this.performanceMonitor.isMonitoring) return;
        
        this.performanceMonitor.isMonitoring = true;
        
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            if (!this.performanceMonitor.isMonitoring) return;
            
            const now = performance.now();
            frameCount++;
            
            // Update FPS every second
            if (now - lastTime >= 1000) {
                this.performanceMonitor.metrics.fps = Math.round(frameCount * 1000 / (now - lastTime));
                frameCount = 0;
                lastTime = now;
                
                // Update memory usage if available
                if (performance.memory) {
                    this.performanceMonitor.metrics.memory = Math.round(
                        performance.memory.usedJSHeapSize / 1024 / 1024
                    );
                }
                
                // Update undo/redo size
                if (this.components.undoRedo) {
                    this.performanceMonitor.metrics.undoRedoSize = 
                        this.components.undoRedo.estimateMemoryUsage();
                }
                
                // Dispatch performance update
                this.eventBus.dispatchEvent(new CustomEvent('performanceUpdate', {
                    detail: this.performanceMonitor.metrics
                }));
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }

    updatePerformanceMetrics(metric, value) {
        if (this.performanceMonitor.metrics[metric] !== undefined) {
            this.performanceMonitor.metrics[metric] += value;
        }
    }

    updatePerformanceDisplay(metrics) {
        // Update performance display in debug mode
        if (this.isDebugMode()) {
            console.log('📊 Performance:', metrics);
        }
    }

    isDebugMode() {
        return localStorage.getItem('debugMode') === 'true' || 
               window.location.search.includes('debug=true');
    }

    logError(errorInfo) {
        // Store error log for debugging
        const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
        errors.push(errorInfo);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        localStorage.setItem('errorLog', JSON.stringify(errors));
    }

    showCriticalError(message) {
        // Show critical error that prevents app from working
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #fee;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: system-ui, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    text-align: center;
                    max-width: 400px;
                ">
                    <h2 style="color: #d32f2f; margin-bottom: 16px;">
                        ⚠️ Application Error
                    </h2>
                    <p style="margin-bottom: 24px; color: #666;">
                        ${message}
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: #1976d2;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    // Public API methods
    getState() {
        return {
            isInitialized: this.isInitialized,
            version: this.version,
            components: Object.keys(this.components),
            performance: this.performanceMonitor.metrics,
            room: this.components.room?.currentRoom ? {
                id: this.components.room.currentRoom.id,
                name: this.components.room.currentRoom.name,
                type: this.components.room.currentRoom.type,
                users: this.components.room.currentRoom.users.length
            } : null
        };
    }

    exportData() {
        return this.components.room?.exportRoomData() || null;
    }

    importData(data) {
        if (this.components.room) {
            this.components.room.importRoomData(data);
        }
    }

    // Cleanup
    destroy() {
        console.log('🧹 Cleaning up application');
        
        // Save final state
        this.saveApplicationState();
        
        // Stop performance monitoring
        this.performanceMonitor.isMonitoring = false;
        
        // Cleanup components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // Clear references
        this.components = {};
        this.isInitialized = false;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.drawingApp = new DrawingApp();
    
    // Expose app state for debugging
    if (window.drawingApp.isDebugMode()) {
        window.getAppState = () => window.drawingApp.getState();
        window.exportAppData = () => window.drawingApp.exportData();
        window.importAppData = (data) => window.drawingApp.importData(data);
        console.log('🐛 Debug mode enabled. Use getAppState(), exportAppData(), importAppData() in console.');
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.drawingApp) {
        window.drawingApp.destroy();
    }
});

// Export for external use
window.DrawingApp = DrawingApp;