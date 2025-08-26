class WhiteboardApp {
    constructor() {
        // --- Core Properties ---
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = io();
        this.roomId = null;
        this.currentUser = JSON.parse(sessionStorage.getItem('vdraw_user'));
        
        if (!this.currentUser) {
            window.location.href = '/'; // Redirect if not logged in
            return;
        }

        // --- Board State ---
        this.strokes = {}; // Store strokes by ID
        this.isDrawing = false;
        this.currentStroke = null;

        // --- Camera/Viewport ---
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        this.lastMousePos = { x: 0, y: 0 };
        this.isPanning = false;
        this.isSpacePressed = false;

        // --- Tool State ---
        this.currentTool = 'pen'; // 'pen', 'eraser', 'move'
        this.currentColor = '#000000';
        this.currentSize = 5;

        // --- Collaboration ---
        this.remoteCursors = {};

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.joinRoomFromURL();
        this.animate(); // Start the render loop
    }
    
    // --- Setup ---
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.setupCanvas());

        // Mouse events
        this.canvas.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerUp.bind(this));
        this.canvas.addEventListener('mouseout', this.onPointerUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.onPointerDown.bind(this));
        this.canvas.addEventListener('touchmove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('touchend', this.onPointerUp.bind(this));

        // Toolbar
        document.querySelector('.floating-toolbar').addEventListener('click', (e) => {
            const btn = e.target.closest('.tool-btn');
            if (btn) this.selectTool(btn.dataset.tool);
        });
        document.getElementById('colorPicker').addEventListener('change', (e) => this.currentColor = e.target.value);
        document.getElementById('brushSize').addEventListener('change', (e) => this.currentSize = parseInt(e.target.value));
        document.getElementById('clearBoard').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire board?')) {
                this.socket.emit('clear-board', this.roomId);
            }
        });
        document.getElementById('copyRoomId').addEventListener('click', () => {
            navigator.clipboard.writeText(this.roomId).then(() => alert('Room ID copied!'));
        });

        // Keyboard events for panning with space
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.isSpacePressed = true;
                this.canvas.style.cursor = 'grab';
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpacePressed = false;
                this.canvas.style.cursor = this.currentTool === 'move' ? 'grab' : 'crosshair';
            }
        });
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.socket.emit('authenticate', this.currentUser);
        });

        this.socket.on('update-members', this.updateMembersList.bind(this));
        this.socket.on('new-stroke', ({ strokeId, strokeData }) => {
            this.strokes[strokeId] = strokeData;
        });
        this.socket.on('stroke-deleted', (strokeId) => {
            delete this.strokes[strokeId];
        });
        this.socket.on('board-cleared', () => {
            this.strokes = {};
        });
        this.socket.on('update-cursor', this.updateRemoteCursor.bind(this));
        this.socket.on('kicked', message => {
            alert(message);
            window.location.href = '/';
        });
    }

    joinRoomFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.roomId = urlParams.get('room');
        if (!this.roomId) {
            alert('No room specified!');
            window.location.href = '/';
            return;
        }

        this.socket.emit('join-room', this.roomId, (response) => {
            if (response.success) {
                this.strokes = response.boardData.strokes || {};
                document.getElementById('roomId').textContent = this.roomId;
                // Center camera on initial load
                this.camera.x = -this.canvas.width / 2;
                this.camera.y = -this.canvas.height / 2;
            } else {
                alert(`Error: ${response.message}`);
                window.location.href = '/';
            }
        });
    }

    // --- Coordinate Transformation ---
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // For touch events
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    screenToWorld(screenPos) {
        return {
            x: (screenPos.x - this.camera.x) / this.camera.zoom,
            y: (screenPos.y - this.camera.y) / this.camera.zoom,
        };
    }
    
    worldToScreen(worldPos) {
        return {
            x: worldPos.x * this.camera.zoom + this.camera.x,
            y: worldPos.y * this.camera.zoom + this.camera.y,
        };
    }

    // --- Event Handlers ---
    onPointerDown(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        this.lastMousePos = pos;
        
        // Allow panning with middle mouse button or space key with any tool
        if (e.button === 1 || this.isSpacePressed) {
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        const worldPos = this.screenToWorld(pos);

        if (this.currentTool === 'pen') {
            this.isDrawing = true;
            const strokeId = 'temp-' + Date.now();
            this.currentStroke = {
                id: strokeId,
                color: this.currentColor,
                size: this.currentSize,
                points: [worldPos]
            };
            // Add to strokes immediately for instant display
            this.strokes[strokeId] = this.currentStroke;
        } else if (this.currentTool === 'eraser') {
            this.isErasing = true;
            this.eraseAt(worldPos);
        } else if (this.currentTool === 'move') {
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    onPointerMove(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const worldPos = this.screenToWorld(pos);

        this.socket.emit('cursor-move', { pos: worldPos });

        // Always allow panning with middle mouse button or space key
        if (this.isPanning || e.button === 1 || this.isSpacePressed) {
            const dx = pos.x - this.lastMousePos.x;
            const dy = pos.y - this.lastMousePos.y;
            this.camera.x += dx;
            this.camera.y += dy;
            this.lastMousePos = pos;
            return;
        }

        if (this.isDrawing && this.currentTool === 'pen') {
            this.currentStroke.points.push(worldPos);
        } else if (this.isErasing && this.currentTool === 'eraser') {
            this.eraseAt(worldPos);
        }
        
        this.lastMousePos = pos;
    }

    onPointerUp(e) {
        e.preventDefault();
        this.isPanning = false;
        this.isErasing = false;
        this.canvas.style.cursor = this.currentTool === 'move' ? 'grab' : 'crosshair';

        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.currentStroke && this.currentStroke.points.length > 1) {
                // Send the completed stroke to the server
                this.socket.emit('add-stroke', {
                    roomId: this.roomId,
                    strokeData: this.currentStroke
                });
            } else {
                // Remove very short strokes
                delete this.strokes[this.currentStroke.id];
            }
            this.currentStroke = null;
        }
    }

    onWheel(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // Allow zooming with any tool
        this.camera.x = (this.camera.x - pos.x) * zoom + pos.x;
        this.camera.y = (this.camera.y - pos.y) * zoom + pos.y;
        this.camera.zoom *= zoom;
    }
    
    // --- Tool Logic ---
    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tool-btn[data-tool="${tool}"]`).classList.add('active');
        this.canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair';
    }

    eraseAt(worldPos) {
        const ERASE_RADIUS = 20 / this.camera.zoom; // Radius in world coordinates
        let closestStrokeId = null;
        let minDistance = Infinity;

        for (const id in this.strokes) {
            const stroke = this.strokes[id];
            for (const point of stroke.points) {
                const dist = Math.hypot(point.x - worldPos.x, point.y - worldPos.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestStrokeId = id;
                }
            }
        }

        if (closestStrokeId && minDistance < ERASE_RADIUS) {
            delete this.strokes[closestStrokeId]; // Optimistic deletion
            this.socket.emit('delete-stroke', { roomId: this.roomId, strokeId: closestStrokeId });
        }
    }
    
    // --- Rendering ---
    animate() {
        this.draw();
        requestAnimationFrame(this.animate.bind(this));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        this.drawGrid();

        // Draw all saved strokes
        for (const id in this.strokes) {
            this.drawStroke(this.strokes[id]);
        }

        this.ctx.restore();
    }
    
    drawGrid() {
        const gridSize = 50;
        const scaledGridSize = gridSize * this.camera.zoom;
        if (scaledGridSize < 5) return; // Don't draw if too small

        const startWorld = this.screenToWorld({x: 0, y: 0});
        const endWorld = this.screenToWorld({x: this.canvas.width, y: this.canvas.height});
        
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1 / this.camera.zoom;

        // Vertical lines
        for (let x = Math.floor(startWorld.x / gridSize) * gridSize; x < endWorld.x; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startWorld.y);
            this.ctx.lineTo(x, endWorld.y);
            this.ctx.stroke();
        }
        // Horizontal lines
        for (let y = Math.floor(startWorld.y / gridSize) * gridSize; y < endWorld.y; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startWorld.x, y);
            this.ctx.lineTo(endWorld.x, y);
            this.ctx.stroke();
        }
    }

    drawStroke(stroke) {
        if (stroke.points.length < 2) return;
        
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        this.ctx.stroke();
    }
    
    // --- UI & Collaboration Updates ---
    updateMembersList(members) {
        const listEl = document.getElementById('members-list');
        const countEl = document.getElementById('userCount');
        listEl.innerHTML = '';

        const onlineMembers = members.filter(m => m.status === 'online');
        countEl.textContent = onlineMembers.length;

        members.sort((a, b) => (a.status === 'offline') - (b.status === 'offline') || a.username.localeCompare(b.username));

        members.forEach(member => {
            const li = document.createElement('li');
            const statusClass = member.status === 'online' ? 'online' : 'offline';
            
            let kickButton = '';
            // Simple logic: if I am the owner, I can kick others
            // A more robust check against board.owner would be better
            if (this.currentUser.id !== member.id) { 
                kickButton = `<button class="kick-btn" data-user-id="${member.id}">Kick</button>`;
            }

            li.innerHTML = `
                <div>
                    <span class="status-dot ${statusClass}"></span>
                    <span>${member.username} ${member.id === this.currentUser.id ? '(You)' : ''}</span>
                </div>
                ${kickButton}
            `;
            listEl.appendChild(li);
        });

        // Add event listeners for kick buttons
        listEl.querySelectorAll('.kick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userIdToKick = e.target.dataset.userId;
                if (confirm('Kick and ban this user by IP?')) {
                    this.socket.emit('kick-user', { roomId: this.roomId, userIdToKick });
                }
            });
        });
    }

    updateRemoteCursor({ user, pos }) {
        if (user.id === this.currentUser.id) return;

        const cursorsContainer = document.getElementById('cursors-container');
        let cursorEl = document.getElementById(`cursor-${user.id}`);
        if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.id = `cursor-${user.id}`;
            cursorEl.className = 'remote-cursor';
            cursorEl.innerHTML = `<div class="cursor-label">${user.username}</div>`;
            cursorsContainer.appendChild(cursorEl);
            this.remoteCursors[user.id] = cursorEl;
        }

        const screenPos = this.worldToScreen(pos);
        cursorEl.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px)`;
    }
}

window.onload = () => new WhiteboardApp();