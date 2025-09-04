// Enhanced Drawing Engine with Layer Support
class DrawingEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.opacity = 1;
        
        // Layer system
        this.layers = [];
        this.activeLayerId = 0;
        this.layerIdCounter = 0;
        
        // Drawing state
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.points = [];
        
        // Performance optimization
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.isHighDPI = this.devicePixelRatio > 1;
        
        // Drawing modes
        this.drawingModes = {
            brush: { smoothing: true, pressure: false },
            pencil: { smoothing: false, pressure: false },
            eraser: { smoothing: true, pressure: false },
            line: { smoothing: false, pressure: false },
            rectangle: { smoothing: false, pressure: false },
            circle: { smoothing: false, pressure: false },
            text: { smoothing: false, pressure: false }
        };
        
        // Text tool properties
        this.textProperties = {
            font: 'Arial',
            size: 16,
            weight: 'normal',
            style: 'normal'
        };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.initializeLayers();
        this.setupEventListeners();
        this.setupToolProperties();
    }

    setupCanvas() {
        // High DPI support
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        if (this.isHighDPI) {
            this.canvas.width = displayWidth * this.devicePixelRatio;
            this.canvas.height = displayHeight * this.devicePixelRatio;
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
        
        // Smooth drawing settings
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    initializeLayers() {
        // Create initial layer
        this.addLayer('Background', true);
        this.updateLayersPanel();
    }

    addLayer(name = null, isBackground = false) {
        const layerId = this.layerIdCounter++;
        const layerName = name || `Layer ${this.layers.length + 1}`;
        
        const layer = {
            id: layerId,
            name: layerName,
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'normal',
            canvas: document.createElement('canvas'),
            isBackground
        };
        
        // Setup layer canvas
        layer.canvas.width = this.canvas.width;
        layer.canvas.height = this.canvas.height;
        layer.ctx = layer.canvas.getContext('2d');
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        layer.ctx.imageSmoothingEnabled = true;
        
        // Background layer gets white background
        if (isBackground) {
            layer.ctx.fillStyle = '#ffffff';
            layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
        }
        
        this.layers.push(layer);
        this.activeLayerId = layerId;
        
        this.renderLayers();
        this.updateLayersPanel();
        
        return layer;
    }

    deleteLayer(layerId) {
        if (this.layers.length <= 1) {
            this.showNotification('Cannot delete the last layer', 'warning');
            return false;
        }
        
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;
        
        const layer = this.layers[index];
        if (layer.isBackground) {
            this.showNotification('Cannot delete background layer', 'warning');
            return false;
        }
        
        this.layers.splice(index, 1);
        
        // Adjust active layer
        if (this.activeLayerId === layerId) {
            this.activeLayerId = this.layers[Math.max(0, index - 1)].id;
        }
        
        this.renderLayers();
        this.updateLayersPanel();
        
        // Save state for undo
        if (window.undoRedoManager) {
            window.undoRedoManager.saveState(`Deleted layer: ${layer.name}`);
        }
        
        return true;
    }

    duplicateLayer(layerId) {
        const sourceLayer = this.layers.find(l => l.id === layerId);
        if (!sourceLayer) return null;
        
        const newLayer = this.addLayer(`${sourceLayer.name} copy`);
        
        // Copy canvas content
        newLayer.ctx.drawImage(sourceLayer.canvas, 0, 0);
        newLayer.opacity = sourceLayer.opacity;
        newLayer.blendMode = sourceLayer.blendMode;
        
        this.renderLayers();
        this.updateLayersPanel();
        
        return newLayer;
    }

    moveLayer(layerId, direction) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;
        
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        if (newIndex < 0 || newIndex >= this.layers.length) return false;
        
        // Swap layers
        [this.layers[index], this.layers[newIndex]] = [this.layers[newIndex], this.layers[index]];
        
        this.renderLayers();
        this.updateLayersPanel();
        
        return true;
    }

    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.renderLayers();
            this.updateLayersPanel();
        }
    }

    setLayerOpacity(layerId, opacity) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            this.renderLayers();
        }
    }

    setActiveLayer(layerId) {
        if (this.layers.find(l => l.id === layerId)) {
            this.activeLayerId = layerId;
            this.updateLayersPanel();
        }
    }

    getActiveLayer() {
        return this.layers.find(l => l.id === this.activeLayerId);
    }

    renderLayers() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render visible layers in order
        this.layers.forEach(layer => {
            if (layer.visible && layer.canvas) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.globalCompositeOperation = layer.blendMode;
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        
        // Reset composite operation
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // Tool selection
        document.querySelectorAll('.tool-option').forEach(tool => {
            tool.addEventListener('click', (e) => {
                this.selectTool(e.target.closest('.tool-option').dataset.tool);
            });
        });

        // Brush settings
        const brushSizeSlider = document.getElementById('brushSize');
        const opacitySlider = document.getElementById('opacity');
        
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.setBrushSize(parseInt(e.target.value));
            });
        }
        
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.setOpacity(parseInt(e.target.value) / 100);
            });
        }

        // Canvas actions
        const clearBtn = document.getElementById('clearBtn');
        const saveBtn = document.getElementById('saveBtn');
        const addLayerBtn = document.getElementById('addLayer');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the active layer?')) {
                    this.clearActiveLayer();
                }
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCanvas();
            });
        }
        
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', () => {
                this.addLayer();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case 'b': this.selectTool('brush'); break;
                case 'p': this.selectTool('pencil'); break;
                case 'e': this.selectTool('eraser'); break;
                case 'l': this.selectTool('line'); break;
                case 'r': this.selectTool('rectangle'); break;
                case 'c': this.selectTool('circle'); break;
                case 't': this.selectTool('text'); break;
                case 's': this.selectTool('select'); break;
            }
            
            // Brush size shortcuts
            if (e.key === '[') {
                this.setBrushSize(Math.max(1, this.brushSize - 1));
            } else if (e.key === ']') {
                this.setBrushSize(Math.min(50, this.brushSize + 1));
            }
        });
    }

    setupToolProperties() {
        // Initialize tool-specific properties
        this.toolProperties = {
            brush: { size: 5, opacity: 1, flow: 1, hardness: 0.8 },
            pencil: { size: 2, opacity: 1, hardness: 1 },
            eraser: { size: 10, opacity: 1, hardness: 0.5 },
            line: { size: 2, opacity: 1 },
            rectangle: { size: 2, opacity: 1, fill: false },
            circle: { size: 2, opacity: 1, fill: false },
            text: { ...this.textProperties }
        };
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 
            e.type === 'touchmove' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        
        this.canvas.dispatchEvent(mouseEvent);
    }

    startDrawing(e) {
        const activeLayer = this.getActiveLayer();
        if (!activeLayer || activeLayer.locked) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.startY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        this.lastX = this.startX;
        this.lastY = this.startY;
        
        // Initialize points array for smoothing
        this.points = [{ x: this.startX, y: this.startY }];
        
        // Tool-specific initialization
        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
            case 'eraser':
                this.initializeFreehandDrawing(activeLayer.ctx);
                break;
            case 'text':
                this.handleTextTool(this.startX, this.startY);
                break;
        }
        
        // Start batch operation for undo/redo
        if (window.undoRedoManager) {
            window.undoRedoManager.startBatch(`${this.currentTool} operation`);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const activeLayer = this.getActiveLayer();
        if (!activeLayer || activeLayer.locked) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const currentY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const ctx = activeLayer.ctx;
        
        switch (this.currentTool) {
            case 'brush':
                this.drawBrush(ctx, currentX, currentY);
                break;
            case 'pencil':
                this.drawPencil(ctx, currentX, currentY);
                break;
            case 'eraser':
                this.drawEraser(ctx, currentX, currentY);
                break;
            case 'line':
                this.drawLine(ctx, currentX, currentY, true);
                break;
            case 'rectangle':
                this.drawRectangle(ctx, currentX, currentY, true);
                break;
            case 'circle':
                this.drawCircle(ctx, currentX, currentY, true);
                break;
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
        this.points.push({ x: currentX, y: currentY });
        
        this.renderLayers();
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.points = [];
            
            // End batch operation
            if (window.undoRedoManager) {
                window.undoRedoManager.endBatch();
            }
            
            this.renderLayers();
        }
    }

    initializeFreehandDrawing(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = this.brushSize;
        ctx.strokeStyle = this.currentColor;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
    }

    drawBrush(ctx, x, y) {
        ctx.globalCompositeOperation = 'source-over';
        
        if (this.drawingModes.brush.smoothing && this.points.length > 2) {
            // Smooth drawing using quadratic curves
            const lastPoint = this.points[this.points.length - 2];
            const controlX = (lastPoint.x + x) / 2;
            const controlY = (lastPoint.y + y) / 2;
            
            ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, controlX, controlY);
        } else {
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    drawPencil(ctx, x, y) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = Math.max(1, this.brushSize * 0.5);
        
        // Sharp, pixelated drawing
        ctx.imageSmoothingEnabled = false;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.imageSmoothingEnabled = true;
    }

    drawEraser(ctx, x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = this.brushSize;
        
        if (this.drawingModes.eraser.smoothing && this.points.length > 2) {
            const lastPoint = this.points[this.points.length - 2];
            const controlX = (lastPoint.x + x) / 2;
            const controlY = (lastPoint.y + y) / 2;
            ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, controlX, controlY);
        } else {
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    drawLine(ctx, x, y, isPreview = false) {
        if (isPreview) {
            // Save current state and restore for preview
            this.previewShape(ctx, () => {
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(x, y);
                ctx.stroke();
            });
        } else {
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    drawRectangle(ctx, x, y, isPreview = false) {
        const width = x - this.startX;
        const height = y - this.startY;
        
        if (isPreview) {
            this.previewShape(ctx, () => {
                if (this.toolProperties.rectangle.fill) {
                    ctx.fillRect(this.startX, this.startY, width, height);
                } else {
                    ctx.strokeRect(this.startX, this.startY, width, height);
                }
            });
        } else {
            if (this.toolProperties.rectangle.fill) {
                ctx.fillRect(this.startX, this.startY, width, height);
            } else {
                ctx.strokeRect(this.startX, this.startY, width, height);
            }
        }
    }

    drawCircle(ctx, x, y, isPreview = false) {
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        
        if (isPreview) {
            this.previewShape(ctx, () => {
                ctx.beginPath();
                ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                if (this.toolProperties.circle.fill) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            });
        } else {
            ctx.beginPath();
            ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
            if (this.toolProperties.circle.fill) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
    }

    previewShape(ctx, drawFunction) {
        // Save current layer state
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Clear and setup for preview
        ctx.putImageData(this.layerStates[this.activeLayerId] || imageData, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.currentColor;
        ctx.fillStyle = this.currentColor;
        ctx.lineWidth = this.brushSize;
        ctx.globalAlpha = this.opacity;
        
        drawFunction();
    }

    handleTextTool(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            const activeLayer = this.getActiveLayer();
            if (activeLayer) {
                const ctx = activeLayer.ctx;
                ctx.font = `${this.textProperties.style} ${this.textProperties.weight} ${this.textProperties.size}px ${this.textProperties.font}`;
                ctx.fillStyle = this.currentColor;
                ctx.globalAlpha = this.opacity;
                ctx.fillText(text, x, y);
                
                this.renderLayers();
                
                if (window.undoRedoManager) {
                    window.undoRedoManager.saveState('Text added');
                }
            }
        }
        this.isDrawing = false;
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-option').forEach(t => t.classList.remove('active'));
        const toolElement = document.querySelector(`[data-tool="${tool}"]`);
        if (toolElement) {
            toolElement.classList.add('active');
        }
        
        // Update cursor
        this.updateCursor();
        
        // Save layer states for preview
        this.saveLayerStates();
    }

    updateCursor() {
        const cursors = {
            brush: 'crosshair',
            pencil: 'crosshair',
            eraser: 'grab',
            line: 'crosshair',
            rectangle: 'crosshair',
            circle: 'crosshair',
            text: 'text',
            select: 'default'
        };
        
        this.canvas.style.cursor = cursors[this.currentTool] || 'crosshair';
    }

    saveLayerStates() {
        this.layerStates = {};
        this.layers.forEach(layer => {
            this.layerStates[layer.id] = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        });
    }

    setBrushSize(size) {
        this.brushSize = Math.max(1, Math.min(50, size));
        
        const sizeValue = document.getElementById('brushSizeValue');
        const sizeSlider = document.getElementById('brushSize');
        
        if (sizeValue) sizeValue.textContent = this.brushSize;
        if (sizeSlider) sizeSlider.value = this.brushSize;
    }

    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
        
        const opacityValue = document.getElementById('opacityValue');
        const opacitySlider = document.getElementById('opacity');
        
        if (opacityValue) opacityValue.textContent = Math.round(this.opacity * 100);
        if (opacitySlider) opacitySlider.value = Math.round(this.opacity * 100);
    }

    setColor(color) {
        this.currentColor = color;
    }

    clearActiveLayer() {
        const activeLayer = this.getActiveLayer();
        if (activeLayer && !activeLayer.locked) {
            if (activeLayer.isBackground) {
                // Fill background with white
                activeLayer.ctx.fillStyle = '#ffffff';
                activeLayer.ctx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
            } else {
                activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
            }
            
            this.renderLayers();
            
            if (window.undoRedoManager) {
                window.undoRedoManager.saveState(`Cleared layer: ${activeLayer.name}`);
            }
        }
    }

    clearCanvas() {
        this.layers.forEach(layer => {
            if (layer.isBackground) {
                layer.ctx.fillStyle = '#ffffff';
                layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
            } else {
                layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            }
        });
        
        this.renderLayers();
        
        if (window.undoRedoManager) {
            window.undoRedoManager.saveState('Canvas cleared');
        }
    }

    saveCanvas() {
        const link = document.createElement('a');
        link.download = `drawing_${new Date().getTime()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        this.showNotification('Drawing saved successfully!', 'success');
    }

    updateLayersPanel() {
        const container = document.getElementById('layersList');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        this.layers.slice().reverse().forEach(layer => {
            const layerElement = document.createElement('div');
            layerElement.className = `layer-item ${layer.id === this.activeLayerId ? 'active' : ''}`;
            layerElement.innerHTML = `
                <div class="layer-preview">
                    <canvas width="24" height="24"></canvas>
                </div>
                <span class="layer-name">${layer.name}</span>
                <div class="layer-controls">
                    <button class="layer-btn visibility-btn" title="Toggle visibility">
                        <i class="fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button class="layer-btn lock-btn" title="Lock/Unlock layer">
                        <i class="fas ${layer.locked ? 'fa-lock' : 'fa-unlock'}"></i>
                    </button>
                    ${!layer.isBackground ? '<button class="layer-btn delete-btn" title="Delete layer"><i class="fas fa-trash"></i></button>' : ''}
                </div>
            `;
            
            // Generate layer preview
            const previewCanvas = layerElement.querySelector('canvas');
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.drawImage(layer.canvas, 0, 0, 24, 24);
            
            // Event listeners
            layerElement.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-controls')) {
                    this.setActiveLayer(layer.id);
                }
            });
            
            layerElement.querySelector('.visibility-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });
            
            const lockBtn = layerElement.querySelector('.lock-btn');
            if (lockBtn) {
                lockBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    layer.locked = !layer.locked;
                    this.updateLayersPanel();
                });
            }
            
            const deleteBtn = layerElement.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete layer "${layer.name}"?`)) {
                        this.deleteLayer(layer.id);
                    }
                });
            }
            
            // Context menu for additional options
            layerElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showLayerContextMenu(layer, e.clientX, e.clientY);
            });
            
            container.appendChild(layerElement);
        });
    }

    showLayerContextMenu(layer, x, y) {
        const menu = document.createElement('div');
        menu.className = 'layer-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '9999';
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="duplicate">Duplicate Layer</div>
            <div class="context-menu-item" data-action="rename">Rename Layer</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="move-up">Move Up</div>
            <div class="context-menu-item" data-action="move-down">Move Down</div>
            ${!layer.isBackground ? '<div class="context-menu-separator"></div><div class="context-menu-item danger" data-action="delete">Delete Layer</div>' : ''}
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'duplicate':
                    this.duplicateLayer(layer.id);
                    break;
                case 'rename':
                    const newName = prompt('Enter new layer name:', layer.name);
                    if (newName) {
                        layer.name = newName;
                        this.updateLayersPanel();
                    }
                    break;
                case 'move-up':
                    this.moveLayer(layer.id, 'up');
                    break;
                case 'move-down':
                    this.moveLayer(layer.id, 'down');
                    break;
                case 'delete':
                    if (confirm(`Delete layer "${layer.name}"?`)) {
                        this.deleteLayer(layer.id);
                    }
                    break;
            }
            menu.remove();
        });
        
        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
        
        document.body.appendChild(menu);
    }

    // Export canvas data for sharing
    exportCanvasData() {
        return {
            layers: this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                locked: layer.locked,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                isBackground: layer.isBackground,
                data: layer.canvas.toDataURL('image/png')
            })),
            activeLayerId: this.activeLayerId,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            settings: {
                currentTool: this.currentTool,
                currentColor: this.currentColor,
                brushSize: this.brushSize,
                opacity: this.opacity
            }
        };
    }

    // Import canvas data from sharing
    importCanvasData(data) {
        // Clear existing layers
        this.layers = [];
        this.layerIdCounter = 0;
        
        // Import layers
        data.layers.forEach(layerData => {
            const layer = {
                id: layerData.id,
                name: layerData.name,
                visible: layerData.visible,
                locked: layerData.locked || false,
                opacity: layerData.opacity || 1,
                blendMode: layerData.blendMode || 'normal',
                isBackground: layerData.isBackground || false,
                canvas: document.createElement('canvas')
            };
            
            layer.canvas.width = this.canvas.width;
            layer.canvas.height = this.canvas.height;
            layer.ctx = layer.canvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
                layer.ctx.drawImage(img, 0, 0);
                this.renderLayers();
                this.updateLayersPanel();
            };
            img.src = layerData.data;
            
            this.layers.push(layer);
            this.layerIdCounter = Math.max(this.layerIdCounter, layerData.id + 1);
        });
        
        this.activeLayerId = data.activeLayerId;
        
        // Import settings
        if (data.settings) {
            this.selectTool(data.settings.currentTool || 'brush');
            this.setColor(data.settings.currentColor || '#000000');
            this.setBrushSize(data.settings.brushSize || 5);
            this.setOpacity(data.settings.opacity || 1);
        }
    }

    showNotification(message, type = 'info') {
        if (window.roomManager && typeof window.roomManager.showNotification === 'function') {
            window.roomManager.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Resize canvas
    resizeCanvas(width, height) {
        const oldData = this.exportCanvasData();
        
        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Resize all layer canvases
        this.layers.forEach(layer => {
            const oldCanvas = layer.canvas;
            layer.canvas = document.createElement('canvas');
            layer.canvas.width = width;
            layer.canvas.height = height;
            layer.ctx = layer.canvas.getContext('2d');
            
            // Copy old content
            layer.ctx.drawImage(oldCanvas, 0, 0);
        });
        
        this.renderLayers();
        this.updateLayersPanel();
        
        if (window.undoRedoManager) {
            window.undoRedoManager.saveState('Canvas resized');
        }
    }
}

// Add CSS for layer context menu
const drawingEngineCSS = `
.layer-context-menu {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: var(--shadow-lg);
    padding: 4px 0;
    min-width: 150px;
}

.context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    transition: var(--transition);
}

.context-menu-item:hover {
    background: var(--surface-hover);
}

.context-menu-item.danger {
    color: var(--danger-color);
}

.context-menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
}

.context-menu-separator {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
}

.layer-preview {
    width: 24px;
    height: 24px;
    border: 1px solid var(--border);
    border-radius: 3px;
    overflow: hidden;
    flex-shrink: 0;
}

.layer-preview canvas {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
}

.layer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: var(--transition);
}

.layer-item:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
}

.layer-item.active {
    background: rgba(102, 126, 234, 0.1);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.layer-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
}

.layer-controls {
    display: flex;
    gap: 2px;
}

.layer-btn {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: var(--transition);
    font-size: 10px;
}

.layer-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
}
`;

// Add CSS to document
const drawingEngineStyle = document.createElement('style');
drawingEngineStyle.textContent = drawingEngineCSS;
document.head.appendChild(drawingEngineStyle);

// Initialize drawing engine
window.initDrawingEngine = function(canvas) {
    return new DrawingEngine(canvas);
};

// Export for external use
window.DrawingEngine = DrawingEngine;