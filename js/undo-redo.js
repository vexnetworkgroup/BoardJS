// Optimized Undo/Redo System with Efficient State Management
class UndoRedoManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];
        this.currentStateIndex = -1;
        this.maxStates = 50; // Limit to prevent memory issues
        this.isRecording = true;
        this.batchMode = false;
        this.batchOperations = [];
        
        // Optimization settings
        this.compressionLevel = 0.8; // JPEG compression for larger canvases
        this.useCompression = false; // Will be set based on canvas size
        this.compressionThreshold = 500000; // Pixels (width * height)
        
        // Performance monitoring
        this.performanceStats = {
            totalStates: 0,
            compressionRatio: 0,
            averageStateSize: 0,
            memoryUsage: 0
        };
        
        this.init();
    }

    init() {
        this.updateCompressionSettings();
        this.setupKeyboardShortcuts();
        this.updateButtons();
        this.setupPerformanceMonitoring();
        
        // Save initial blank state
        setTimeout(() => {
            this.saveState('Initial state');
        }, 100);
    }

    updateCompressionSettings() {
        const canvasPixels = this.canvas.width * this.canvas.height;
        this.useCompression = canvasPixels > this.compressionThreshold;
        
        // Adjust compression level based on canvas size
        if (canvasPixels > 1000000) {
            this.compressionLevel = 0.6; // Higher compression for very large canvases
        } else if (canvasPixels > 500000) {
            this.compressionLevel = 0.7;
        } else {
            this.compressionLevel = 0.8;
        }
    }

    // Save current canvas state
    saveState(description = 'Drawing action') {
        if (!this.isRecording || this.batchMode) return;
        
        try {
            // Remove any states after current index (when user drew after undo)
            this.states = this.states.slice(0, this.currentStateIndex + 1);
            
            const timestamp = Date.now();
            let stateData;
            let compressed = false;
            
            if (this.useCompression) {
                // Use compressed data for large canvases
                stateData = this.canvas.toDataURL('image/jpeg', this.compressionLevel);
                compressed = true;
            } else {
                // Use ImageData for smaller canvases (faster operations)
                stateData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                compressed = false;
            }
            
            const state = {
                data: stateData,
                timestamp,
                compressed,
                description,
                size: this.estimateStateSize(stateData),
                id: `state_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            this.states.push(state);
            
            // Limit number of states to prevent memory issues
            if (this.states.length > this.maxStates) {
                const removedState = this.states.shift();
                this.onStateRemoved(removedState);
            } else {
                this.currentStateIndex++;
            }
            
            this.updateButtons();
            this.updatePerformanceStats();
            this.onStateSaved(state);
            
        } catch (error) {
            console.error('Failed to save canvas state:', error);
            this.onError('Failed to save state', error);
        }
    }

    // Restore canvas to previous state
    undo() {
        if (this.canUndo()) {
            this.currentStateIndex--;
            this.restoreState();
            this.updateButtons();
            this.onUndo(this.getCurrentState());
            return true;
        }
        return false;
    }

    // Restore canvas to next state
    redo() {
        if (this.canRedo()) {
            this.currentStateIndex++;
            this.restoreState();
            this.updateButtons();
            this.onRedo(this.getCurrentState());
            return true;
        }
        return false;
    }

    // Go to specific state
    goToState(stateIndex) {
        if (stateIndex >= 0 && stateIndex < this.states.length) {
            this.currentStateIndex = stateIndex;
            this.restoreState();
            this.updateButtons();
            return true;
        }
        return false;
    }

    // Restore canvas to specific state
    restoreState() {
        if (this.currentStateIndex >= 0 && this.currentStateIndex < this.states.length) {
            const state = this.states[this.currentStateIndex];
            
            this.isRecording = false; // Prevent recording during restore
            
            if (state.compressed) {
                // Restore from compressed data
                const img = new Image();
                img.onload = () => {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(img, 0, 0);
                    this.isRecording = true;
                    this.onStateRestored(state);
                };
                img.onerror = (error) => {
                    console.error('Failed to restore compressed state:', error);
                    this.isRecording = true;
                    this.onError('Failed to restore state', error);
                };
                img.src = state.data;
            } else {
                // Restore from ImageData
                try {
                    this.ctx.putImageData(state.data, 0, 0);
                    this.isRecording = true;
                    this.onStateRestored(state);
                } catch (error) {
                    console.error('Failed to restore ImageData state:', error);
                    this.isRecording = true;
                    this.onError('Failed to restore state', error);
                }
            }
        }
    }

    // Batch operations for better performance
    startBatch(description = 'Batch operation') {
        this.batchMode = true;
        this.batchDescription = description;
        this.batchStartTime = Date.now();
    }

    endBatch() {
        if (this.batchMode) {
            this.batchMode = false;
            this.saveState(this.batchDescription || 'Batch operation');
            
            const duration = Date.now() - this.batchStartTime;
            this.onBatchCompleted(this.batchDescription, duration);
        }
    }

    // Check if undo is possible
    canUndo() {
        return this.currentStateIndex > 0;
    }

    // Check if redo is possible
    canRedo() {
        return this.currentStateIndex < this.states.length - 1;
    }

    // Get current state
    getCurrentState() {
        return this.states[this.currentStateIndex] || null;
    }

    // Get state by index
    getState(index) {
        return this.states[index] || null;
    }

    // Get all states
    getAllStates() {
        return this.states.map((state, index) => ({
            id: state.id,
            description: state.description,
            timestamp: state.timestamp,
            size: state.size,
            compressed: state.compressed,
            isActive: index === this.currentStateIndex
        }));
    }

    // Update button states
    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.style.opacity = this.canUndo() ? '1' : '0.5';
            undoBtn.title = this.canUndo() ? 
                `Undo: ${this.states[this.currentStateIndex - 1]?.description || 'Previous action'}` : 
                'Nothing to undo';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.style.opacity = this.canRedo() ? '1' : '0.5';
            redoBtn.title = this.canRedo() ? 
                `Redo: ${this.states[this.currentStateIndex + 1]?.description || 'Next action'}` : 
                'Nothing to redo';
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    this.redo();
                } else if (e.key === 's') {
                    e.preventDefault();
                    this.saveState('Manual save');
                    this.showNotification('State saved manually', 'success');
                }
            }
        });
    }

    // Clear all states
    clear() {
        this.states = [];
        this.currentStateIndex = -1;
        this.updateButtons();
        this.updatePerformanceStats();
        this.onCleared();
    }

    // Get current state info
    getStateInfo() {
        return {
            totalStates: this.states.length,
            currentIndex: this.currentStateIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            memoryUsage: this.estimateMemoryUsage(),
            compressionEnabled: this.useCompression,
            compressionLevel: this.compressionLevel,
            performanceStats: { ...this.performanceStats }
        };
    }

    // Estimate memory usage
    estimateMemoryUsage() {
        let totalSize = 0;
        this.states.forEach(state => {
            totalSize += state.size || this.estimateStateSize(state.data);
        });
        return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
    }

    // Estimate individual state size
    estimateStateSize(data) {
        if (typeof data === 'string') {
            // Base64 string size
            return data.length * 0.75; // Approximate bytes
        } else if (data && data.data) {
            // ImageData size
            return data.data.length;
        }
        return 0;
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        this.performanceInterval = setInterval(() => {
            this.updatePerformanceStats();
        }, 5000); // Update every 5 seconds
    }

    updatePerformanceStats() {
        const totalSize = this.states.reduce((sum, state) => sum + (state.size || 0), 0);
        const compressedStates = this.states.filter(state => state.compressed).length;
        
        this.performanceStats = {
            totalStates: this.states.length,
            compressionRatio: this.states.length > 0 ? compressedStates / this.states.length : 0,
            averageStateSize: this.states.length > 0 ? totalSize / this.states.length : 0,
            memoryUsage: totalSize / 1024 / 1024, // MB
            compressionEnabled: this.useCompression
        };
    }

    // Export/Import for room synchronization
    exportStates(includeImageData = false) {
        return {
            states: this.states.map(state => ({
                id: state.id,
                description: state.description,
                timestamp: state.timestamp,
                compressed: state.compressed,
                size: state.size,
                // Only include image data if requested (for full backup)
                data: includeImageData ? state.data : null
            })),
            currentIndex: this.currentStateIndex,
            settings: {
                maxStates: this.maxStates,
                compressionLevel: this.compressionLevel,
                useCompression: this.useCompression
            },
            performanceStats: this.performanceStats
        };
    }

    importStates(stateData, mergeMode = false) {
        try {
            if (!mergeMode) {
                this.states = [];
                this.currentStateIndex = -1;
            }
            
            if (stateData.states) {
                const importedStates = stateData.states.filter(state => state.data !== null);
                
                if (mergeMode) {
                    this.states.push(...importedStates);
                } else {
                    this.states = importedStates;
                    this.currentStateIndex = Math.min(
                        stateData.currentIndex || 0, 
                        this.states.length - 1
                    );
                }
            }
            
            if (stateData.settings) {
                this.maxStates = stateData.settings.maxStates || this.maxStates;
                this.compressionLevel = stateData.settings.compressionLevel || this.compressionLevel;
                this.useCompression = stateData.settings.useCompression !== undefined ? 
                    stateData.settings.useCompression : this.useCompression;
            }
            
            this.updateButtons();
            this.updatePerformanceStats();
            this.onStatesImported(stateData);
            
            return true;
        } catch (error) {
            console.error('Failed to import states:', error);
            this.onError('Failed to import states', error);
            return false;
        }
    }

    // History navigation
    showHistory() {
        const historyModal = this.createHistoryModal();
        document.body.appendChild(historyModal);
    }

    createHistoryModal() {
        const modal = document.createElement('div');
        modal.className = 'undo-history-modal modal active';
        
        const statesList = this.states.map((state, index) => `
            <div class="history-item ${index === this.currentStateIndex ? 'active' : ''}" 
                 data-index="${index}">
                <div class="history-info">
                    <span class="history-description">${state.description}</span>
                    <span class="history-time">${new Date(state.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="history-meta">
                    <span class="history-size">${(state.size / 1024).toFixed(1)}KB</span>
                    ${state.compressed ? '<i class="fas fa-compress" title="Compressed"></i>' : ''}
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-history"></i> Undo History</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="history-stats">
                        <div class="stat">
                            <span class="stat-label">Total States:</span>
                            <span class="stat-value">${this.states.length}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Memory Usage:</span>
                            <span class="stat-value">${this.estimateMemoryUsage()}MB</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Compression:</span>
                            <span class="stat-value">${this.useCompression ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                    <div class="history-list">
                        ${statesList || '<p class="no-history">No history available</p>'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="clearHistory" class="btn btn-danger">Clear History</button>
                    <button class="btn btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || 
                e.target.classList.contains('modal-close')) {
                modal.remove();
            } else if (e.target.closest('.history-item')) {
                const index = parseInt(e.target.closest('.history-item').dataset.index);
                this.goToState(index);
                modal.remove();
            } else if (e.target.id === 'clearHistory') {
                if (confirm('Are you sure you want to clear all undo history?')) {
                    this.clear();
                    modal.remove();
                }
            }
        });
        
        return modal;
    }

    // Event handlers (can be overridden)
    onStateSaved(state) {
        // Override in subclass or set as callback
        if (this.onStateSavedCallback) {
            this.onStateSavedCallback(state);
        }
    }

    onStateRemoved(state) {
        // Override in subclass or set as callback
        if (this.onStateRemovedCallback) {
            this.onStateRemovedCallback(state);
        }
    }

    onStateRestored(state) {
        // Override in subclass or set as callback
        if (this.onStateRestoredCallback) {
            this.onStateRestoredCallback(state);
        }
    }

    onUndo(state) {
        // Override in subclass or set as callback
        if (this.onUndoCallback) {
            this.onUndoCallback(state);
        }
    }

    onRedo(state) {
        // Override in subclass or set as callback
        if (this.onRedoCallback) {
            this.onRedoCallback(state);
        }
    }

    onBatchCompleted(description, duration) {
        // Override in subclass or set as callback
        if (this.onBatchCompletedCallback) {
            this.onBatchCompletedCallback(description, duration);
        }
    }

    onCleared() {
        // Override in subclass or set as callback
        if (this.onClearedCallback) {
            this.onClearedCallback();
        }
    }

    onStatesImported(data) {
        // Override in subclass or set as callback
        if (this.onStatesImportedCallback) {
            this.onStatesImportedCallback(data);
        }
    }

    onError(message, error) {
        console.error(message, error);
        if (this.onErrorCallback) {
            this.onErrorCallback(message, error);
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.roomManager && typeof window.roomManager.showNotification === 'function') {
            window.roomManager.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Cleanup
    destroy() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
        this.states = [];
        this.currentStateIndex = -1;
    }
}

// Add CSS for history modal
const undoRedoCSS = `
.undo-history-modal .modal-content {
    max-width: 600px;
    max-height: 80vh;
}

.history-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--background);
    border-radius: 8px;
}

.stat {
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-color);
}

.history-list {
    max-height: 300px;
    overflow-y: auto;
}

.history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: var(--transition);
}

.history-item:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
}

.history-item.active {
    background: rgba(102, 126, 234, 0.1);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.history-info {
    flex: 1;
}

.history-description {
    display: block;
    font-weight: 500;
    margin-bottom: 2px;
}

.history-time {
    font-size: 12px;
    color: var(--text-secondary);
}

.history-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-secondary);
}

.history-size {
    font-family: monospace;
}

.no-history {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px;
}

.btn-danger {
    background: var(--danger-color);
    color: white;
}

.btn-danger:hover {
    background: #dc2626;
}
`;

// Add CSS to document
const undoRedoStyle = document.createElement('style');
undoRedoStyle.textContent = undoRedoCSS;
document.head.appendChild(undoRedoStyle);

// Initialize undo/redo when canvas is ready
window.initUndoRedo = function(canvas) {
    window.undoRedoManager = new UndoRedoManager(canvas);
    
    // Setup button event listeners
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            window.undoRedoManager.undo();
        });
        
        // Right-click to show history
        undoBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            window.undoRedoManager.showHistory();
        });
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            window.undoRedoManager.redo();
        });
        
        // Right-click to show history
        redoBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            window.undoRedoManager.showHistory();
        });
    }
    
    return window.undoRedoManager;
};

// Export for external use
window.UndoRedoManager = UndoRedoManager;