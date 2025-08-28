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
		this.minZoom = 0.1;
		this.maxZoom = 6;

		// --- Tool State ---
		this.currentTool = 'pen'; // 'pen', 'eraser', 'move', 'select'
		this.currentColor = '#000000';
		this.currentSize = 5;

		// --- Collaboration ---
		this.remoteCursors = {};
		this.remoteCursorPositions = {};

		// --- Touch Gesture State ---
		this.pinchState = {
			active: false,
			initialDistance: 0,
			initialZoom: 1,
			initialCenterWorld: { x: 0, y: 0 }
		};

		// --- Selection State ---
		this.selectionRect = null; // {x,y,w,h} in world coords
		this.selectedStrokeIds = new Set();
		this.isSelecting = false;
		this.isDraggingSelection = false;
		this.selectionStartWorld = null;
		this.lastDragWorld = null;
		this.accumulatedDrag = { x: 0, y: 0 };

		// --- History (Undo/Redo) ---
		this.undoStack = [];
		this.redoStack = [];

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
		this.canvas.addEventListener('touchstart', this.onPointerDown.bind(this), { passive: false });
		this.canvas.addEventListener('touchmove', this.onPointerMove.bind(this), { passive: false });
		this.canvas.addEventListener('touchend', this.onPointerUp.bind(this), { passive: false });

		// Toolbar
		document.querySelector('.floating-toolbar').addEventListener('click', (e) => {
			const btn = e.target.closest('.tool-btn');
			if (btn) this.selectTool(btn.dataset.tool);
		});
		document.getElementById('colorPicker').addEventListener('change', (e) => this.currentColor = e.target.value);
		document.getElementById('brushSize').addEventListener('change', (e) => this.currentSize = parseInt(e.target.value));
		document.getElementById('clearBoard').addEventListener('click', () => {
			if (confirm('Are you sure you want to clear the entire board?')) {
				// Save state for undo
				const snapshot = JSON.parse(JSON.stringify(this.strokes));
				this.pushHistory({ type: 'clear', before: snapshot });
				this.socket.emit('clear-board', this.roomId);
			}
		});
		document.getElementById('copyRoomId').addEventListener('click', () => {
			navigator.clipboard.writeText(this.roomId).then(() => alert('Room ID copied!'));
		});
		document.getElementById('undoBtn').addEventListener('click', () => this.undo());
		document.getElementById('redoBtn').addEventListener('click', () => this.redo());

		// Keyboard events
		window.addEventListener('keydown', (e) => {
			if (e.code === 'Space') {
				this.isSpacePressed = true;
				this.canvas.style.cursor = 'grab';
			}
			// Undo/Redo shortcuts
			const isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;
			const mod = isMac ? e.metaKey : e.ctrlKey;
			if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
				e.preventDefault();
				this.undo();
			}
			if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
				e.preventDefault();
				this.redo();
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
		this.socket.on('strokes-updated', ({ strokeIds, dx, dy }) => {
			for (const id of strokeIds) {
				const s = this.strokes[id];
				if (!s || !Array.isArray(s.points)) continue;
				for (const p of s.points) { p.x += dx; p.y += dy; }
			}
			// Move selection rectangle too if dragging
			if (this.selectionRect && this.isDraggingSelection) {
				this.selectionRect.x += dx; this.selectionRect.y += dy;
			}
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
				// Initialize members list immediately
				this.updateMembersList(response.boardData.members || []);
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
		// Multi-touch pinch start
		if (e.touches && e.touches.length === 2) {
			const t = this.getTouchInfo(e);
			this.pinchState.active = true;
			this.pinchState.initialDistance = t.distance;
			this.pinchState.initialZoom = this.camera.zoom;
			this.pinchState.initialCenterWorld = this.screenToWorld(t.center);
			this.isDrawing = false;
			this.isErasing = false;
			this.isPanning = true;
			this.canvas.style.cursor = 'grabbing';
			return;
		}
		const pos = this.getMousePos(e);
		this.lastMousePos = pos;
		const worldPos = this.screenToWorld(pos);
		
		// Allow panning with middle mouse button or space key with any tool
		if (e.button === 1 || this.isSpacePressed) {
			this.isPanning = true;
			this.canvas.style.cursor = 'grabbing';
			return;
		}

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
		} else if (this.currentTool === 'select') {
			// If click inside existing selection => start dragging selection
			if (this.selectionRect && this.pointInRect(worldPos, this.selectionRect)) {
				this.isDraggingSelection = true;
				this.lastDragWorld = worldPos;
				this.accumulatedDrag = { x: 0, y: 0 };
			} else {
				// Start new selection rectangle
				this.isSelecting = true;
				this.selectionStartWorld = worldPos;
				this.selectionRect = { x: worldPos.x, y: worldPos.y, w: 0, h: 0 };
				this.selectedStrokeIds.clear();
			}
		}
	}

	onPointerMove(e) {
		e.preventDefault();
		// Handle pinch zoom/pan when two fingers
		if (e.touches && e.touches.length === 2) {
			const t = this.getTouchInfo(e);
			if (!this.pinchState.active) {
				this.pinchState.active = true;
				this.pinchState.initialDistance = t.distance;
				this.pinchState.initialZoom = this.camera.zoom;
				this.pinchState.initialCenterWorld = this.screenToWorld(t.center);
			}
			const scale = t.distance / (this.pinchState.initialDistance || 1);
			let newZoom = this.pinchState.initialZoom * scale;
			newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
			this.camera.zoom = newZoom;
			// Keep the initial world point under the touch center stable
			this.camera.x = t.center.x - this.pinchState.initialCenterWorld.x * this.camera.zoom;
			this.camera.y = t.center.y - this.pinchState.initialCenterWorld.y * this.camera.zoom;
			return;
		}
		// If pinch ended
		if (this.pinchState.active && (!e.touches || e.touches.length < 2)) {
			this.pinchState.active = false;
		}
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
		} else if (this.currentTool === 'select') {
			if (this.isSelecting) {
				// Update selection rectangle size
				this.selectionRect = this.rectFromPoints(this.selectionStartWorld, worldPos);
			} else if (this.isDraggingSelection && this.selectedStrokeIds.size) {
				// Drag selection - apply local transform for preview
				const dx = worldPos.x - this.lastDragWorld.x;
				const dy = worldPos.y - this.lastDragWorld.y;
				if (dx !== 0 || dy !== 0) {
					for (const id of this.selectedStrokeIds) {
						const s = this.strokes[id];
						if (!s || !Array.isArray(s.points)) continue;
						for (const p of s.points) { p.x += dx; p.y += dy; }
					}
					if (this.selectionRect) { this.selectionRect.x += dx; this.selectionRect.y += dy; }
					this.accumulatedDrag.x += dx; this.accumulatedDrag.y += dy;
					this.lastDragWorld = worldPos;
				}
			}
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
				// Record history
				this.pushHistory({ type: 'add', strokeId: this.currentStroke.id });
			} else {
				// Remove very short strokes
				delete this.strokes[this.currentStroke.id];
			}
			this.currentStroke = null;
		}

		if (this.currentTool === 'select') {
			if (this.isSelecting && this.selectionRect) {
				// Finalize selection: pick strokes whose bbox intersects rect
				this.selectedStrokeIds.clear();
				for (const id in this.strokes) {
					const s = this.strokes[id];
					const bbox = this.strokeBoundingBox(s);
					if (this.rectsIntersect(bbox, this.selectionRect)) {
						this.selectedStrokeIds.add(id);
					}
				}
				this.isSelecting = false;
			} else if (this.isDraggingSelection) {
				this.isDraggingSelection = false;
				// Emit update-strokes with accumulated delta and push history
				if (this.accumulatedDrag.x !== 0 || this.accumulatedDrag.y !== 0) {
					const ids = Array.from(this.selectedStrokeIds);
					const dx = this.accumulatedDrag.x;
					const dy = this.accumulatedDrag.y;
					this.socket.emit('update-strokes', { roomId: this.roomId, strokeIds: ids, dx, dy });
					this.pushHistory({ type: 'move', strokeIds: ids, dx, dy });
				}
			}
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
		this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom));
	}
	
	// --- Tool Logic ---
	selectTool(tool) {
		this.currentTool = tool;
		document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
		const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
		if (btn) btn.classList.add('active');
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
			const removed = this.strokes[closestStrokeId];
			delete this.strokes[closestStrokeId]; // Optimistic deletion
			this.pushHistory({ type: 'delete', strokeId: closestStrokeId, strokeData: removed });
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

		// Draw selection rectangle in world space
		if (this.selectionRect) {
			this.ctx.save();
			this.ctx.strokeStyle = '#007bff';
			this.ctx.setLineDash([4, 4]);
			this.ctx.lineWidth = 1 / this.camera.zoom;
			this.ctx.fillStyle = 'rgba(0, 123, 255, 0.08)';
			this.ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h);
			this.ctx.fillRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h);
			this.ctx.restore();
		}

		this.ctx.restore();

		// Update remote cursor DOM positions to follow camera
		for (const userId in this.remoteCursorPositions) {
			const worldPos = this.remoteCursorPositions[userId];
			const screenPos = this.worldToScreen(worldPos);
			const el = this.remoteCursors[userId];
			if (el) {
				el.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px)`;
			}
		}
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
		if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2) return;
		
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

		// Save world position and position will be applied during draw()
		this.remoteCursorPositions[user.id] = pos;
	}

	// --- Touch Helpers ---
	getTouchInfo(e) {
		const rect = this.canvas.getBoundingClientRect();
		const t1 = e.touches[0];
		const t2 = e.touches[1];
		const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
		const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
		const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
		const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
		return { p1, p2, center, distance };
	}

	// --- Selection Helpers ---
	rectFromPoints(a, b) {
		const x = Math.min(a.x, b.x);
		const y = Math.min(a.y, b.y);
		const w = Math.abs(a.x - b.x);
		const h = Math.abs(a.y - b.y);
		return { x, y, w, h };
	}
	strokeBoundingBox(stroke) {
		if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) {
			return { x: 0, y: 0, w: 0, h: 0 };
		}
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const p of stroke.points) {
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
		}
		return { x: minX, y: minY, w: (maxX - minX), h: (maxY - minY) };
	}
	rectsIntersect(a, b) {
		return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
	}
	pointInRect(p, r) {
		return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
	}

	// --- History Helpers ---
	pushHistory(op) {
		this.undoStack.push(op);
		this.redoStack = [];
	}
	undo() {
		const op = this.undoStack.pop();
		if (!op) return;
		if (op.type === 'add') {
			// Undo add -> delete stroke
			if (this.strokes[op.strokeId]) {
				this.socket.emit('delete-stroke', { roomId: this.roomId, strokeId: op.strokeId });
			}
			this.redoStack.push(op);
		} else if (op.type === 'delete') {
			// Undo delete -> re-add stroke
			if (op.strokeData) {
				this.socket.emit('add-stroke', { roomId: this.roomId, strokeData: op.strokeData });
			}
			this.redoStack.push(op);
		} else if (op.type === 'move') {
			const ids = op.strokeIds;
			this.socket.emit('update-strokes', { roomId: this.roomId, strokeIds: ids, dx: -op.dx, dy: -op.dy });
			this.redoStack.push(op);
		} else if (op.type === 'clear') {
			// Restore previous strokes snapshot
			this.strokes = JSON.parse(JSON.stringify(op.before));
			// Broadcast not implemented for snapshot; re-post each stroke
			for (const id in this.strokes) {
				this.socket.emit('add-stroke', { roomId: this.roomId, strokeData: this.strokes[id] });
			}
			this.redoStack.push(op);
		}
	}
	redo() {
		const op = this.redoStack.pop();
		if (!op) return;
		if (op.type === 'add') {
			// Redo add -> add again
			// Note: relies on original stroke still present; skip otherwise
		} else if (op.type === 'delete') {
			// Redo delete
			this.socket.emit('delete-stroke', { roomId: this.roomId, strokeId: op.strokeId });
		} else if (op.type === 'move') {
			this.socket.emit('update-strokes', { roomId: this.roomId, strokeIds: op.strokeIds, dx: op.dx, dy: op.dy });
		} else if (op.type === 'clear') {
			this.socket.emit('clear-board', this.roomId);
		}
		this.undoStack.push(op);
	}
}

window.onload = () => new WhiteboardApp();