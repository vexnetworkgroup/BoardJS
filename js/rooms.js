// Room Management System with Public/Private Support
class RoomManager {
    constructor() {
        this.currentRoom = null;
        this.publicRooms = new Map();
        this.privateRooms = new Map();
        this.isHost = false;
        this.joinCode = null;
        this.roomUrl = null;
        this.userId = this.generateUserId();
        this.userName = 'Anonymous';
        
        // Room settings
        this.maxUsers = 10;
        this.roomTimeout = 24 * 60 * 60 * 1000; // 24 hours
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredRooms();
        this.checkUrlForRoom();
        this.startRoomCleanup();
    }

    // Check URL for room join parameters
    checkUrlForRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        const code = urlParams.get('code');
        
        if (roomId && code) {
            // Auto-join room from URL
            setTimeout(() => {
                this.joinRoomFromUrl(roomId, code);
            }, 1000); // Delay to ensure DOM is ready
        } else {
            // Show landing page
            this.showLandingPage();
        }
    }

    // Show landing page
    showLandingPage() {
        const landingPage = document.getElementById('landingPage');
        const app = document.getElementById('app');
        
        if (landingPage) landingPage.style.display = 'flex';
        if (app) app.style.display = 'none';
    }

    // Hide landing page and show app
    hideLandingPage() {
        const landingPage = document.getElementById('landingPage');
        const app = document.getElementById('app');
        
        if (landingPage) landingPage.style.display = 'none';
        if (app) app.style.display = 'flex';
    }

    // Create new room
    async createRoom(roomName, isPrivate = false, customCode = null) {
        try {
            const roomId = this.generateRoomId();
            const joinCode = customCode || this.generateJoinCode();
            
            const room = {
                id: roomId,
                name: roomName,
                type: isPrivate ? 'private' : 'public',
                joinCode: joinCode,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                host: this.userId,
                hostName: this.userName,
                users: [{
                    id: this.userId,
                    name: this.userName,
                    joinedAt: new Date().toISOString(),
                    isHost: true,
                    isActive: true
                }],
                maxUsers: this.maxUsers,
                isActive: true,
                settings: {
                    allowDrawing: true,
                    allowChat: true,
                    moderationEnabled: false
                }
            };

            this.currentRoom = room;
            this.isHost = true;
            this.joinCode = joinCode;
            this.roomUrl = this.generateRoomUrl(roomId, joinCode);

            // Store room
            if (isPrivate) {
                this.privateRooms.set(roomId, room);
                localStorage.setItem(`privateRoom_${roomId}`, JSON.stringify(room));
            } else {
                this.publicRooms.set(roomId, room);
                localStorage.setItem(`publicRoom_${roomId}`, JSON.stringify(room));
            }

            // Update UI
            this.updateRoomInfo();
            this.hideLandingPage();
            
            // Initialize drawing canvas
            this.initializeDrawingCanvas();
            
            // Save current room reference
            localStorage.setItem('currentRoom', JSON.stringify({
                id: roomId,
                joinCode: joinCode,
                type: room.type
            }));
            
            this.showNotification(`Room "${roomName}" created successfully!`, 'success');
            
            // Start room heartbeat
            this.startRoomHeartbeat();
            
            return room;
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.showNotification('Failed to create room. Please try again.', 'error');
            return null;
        }
    }

    // Join existing room
    async joinRoom(roomIdOrCode, userName = null) {
        try {
            this.userName = userName || this.userName;
            let room = null;
            
            // Try to find room by different methods
            if (roomIdOrCode.startsWith('http')) {
                // Extract room info from URL
                const url = new URL(roomIdOrCode);
                const roomId = url.searchParams.get('room');
                const code = url.searchParams.get('code');
                room = this.findRoomByIdAndCode(roomId, code);
            } else if (roomIdOrCode.length === 6 && roomIdOrCode.match(/^[A-Z0-9]+$/)) {
                // Join code format
                room = this.findRoomByJoinCode(roomIdOrCode);
            } else {
                // Room ID format or other
                room = this.findRoomById(roomIdOrCode) || this.findRoomByJoinCode(roomIdOrCode);
            }

            if (!room) {
                this.showNotification('Room not found or invalid join code.', 'error');
                return false;
            }

            if (!room.isActive) {
                this.showNotification('This room is no longer active.', 'error');
                return false;
            }

            if (room.users.length >= room.maxUsers) {
                this.showNotification('Room is full. Please try again later.', 'error');
                return false;
            }

            // Check if user is already in room
            const existingUser = room.users.find(u => u.id === this.userId);
            if (existingUser) {
                // Rejoin existing user
                existingUser.isActive = true;
                existingUser.joinedAt = new Date().toISOString();
            } else {
                // Add new user to room
                const user = {
                    id: this.userId,
                    name: this.userName,
                    joinedAt: new Date().toISOString(),
                    isHost: false,
                    isActive: true
                };
                room.users.push(user);
            }

            room.lastActivity = new Date().toISOString();
            this.currentRoom = room;
            this.isHost = room.host === this.userId;
            this.joinCode = room.joinCode;
            this.roomUrl = this.generateRoomUrl(room.id, room.joinCode);

            // Update stored room
            const storageKey = room.type === 'private' ? `privateRoom_${room.id}` : `publicRoom_${room.id}`;
            localStorage.setItem(storageKey, JSON.stringify(room));

            // Update UI
            this.updateRoomInfo();
            this.hideLandingPage();
            
            // Initialize drawing canvas
            this.initializeDrawingCanvas();
            
            // Update URL without page reload
            const newUrl = `${window.location.origin}${window.location.pathname}?room=${room.id}&code=${room.joinCode}`;
            window.history.pushState({}, '', newUrl);
            
            // Save current room reference
            localStorage.setItem('currentRoom', JSON.stringify({
                id: room.id,
                joinCode: room.joinCode,
                type: room.type
            }));
            
            this.showNotification(`Joined room "${room.name}"!`, 'success');
            
            // Start room heartbeat
            this.startRoomHeartbeat();
            
            return true;
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.showNotification('Failed to join room. Please check the code and try again.', 'error');
            return false;
        }
    }

    // Join room from URL parameters
    async joinRoomFromUrl(roomId, code) {
        const room = this.findRoomByIdAndCode(roomId, code);
        if (room) {
            await this.joinRoom(code, 'Guest');
        } else {
            this.showNotification('Invalid room link.', 'error');
            this.showLandingPage();
        }
    }

    // Find room by ID and code
    findRoomByIdAndCode(roomId, code) {
        // Check public rooms
        const publicRoom = this.publicRooms.get(roomId);
        if (publicRoom && publicRoom.joinCode === code) {
            return publicRoom;
        }
        
        // Check private rooms
        const privateRoom = this.privateRooms.get(roomId);
        if (privateRoom && privateRoom.joinCode === code) {
            return privateRoom;
        }
        
        return null;
    }

    // Find room by join code
    findRoomByJoinCode(joinCode) {
        // Check public rooms
        for (const room of this.publicRooms.values()) {
            if (room.joinCode === joinCode && room.isActive) {
                return room;
            }
        }
        
        // Check private rooms
        for (const room of this.privateRooms.values()) {
            if (room.joinCode === joinCode && room.isActive) {
                return room;
            }
        }
        
        return null;
    }

    // Find room by ID
    findRoomById(roomId) {
        return this.publicRooms.get(roomId) || this.privateRooms.get(roomId);
    }

    // Get public rooms for lobby
    getPublicRooms() {
        return Array.from(this.publicRooms.values())
            .filter(room => room.isActive)
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    }

    // Load stored rooms from localStorage
    loadStoredRooms() {
        // Load public rooms
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('publicRoom_')) {
                try {
                    const room = JSON.parse(localStorage.getItem(key));
                    if (this.isRoomValid(room)) {
                        this.publicRooms.set(room.id, room);
                    } else {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            } else if (key.startsWith('privateRoom_')) {
                try {
                    const room = JSON.parse(localStorage.getItem(key));
                    if (this.isRoomValid(room)) {
                        this.privateRooms.set(room.id, room);
                    } else {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        }
        
        // Add demo public rooms if none exist
        if (this.publicRooms.size === 0) {
            this.addDemoPublicRooms();
        }
    }

    // Check if room is still valid
    isRoomValid(room) {
        if (!room || !room.id || !room.createdAt) return false;
        
        const createdAt = new Date(room.createdAt);
        const now = new Date();
        const timeDiff = now - createdAt;
        
        return timeDiff < this.roomTimeout;
    }

    // Generate room ID
    generateRoomId() {
        return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate join code (6 characters)
    generateJoinCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Generate user ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate shareable room URL
    generateRoomUrl(roomId, joinCode) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?room=${roomId}&code=${joinCode}`;
    }

    // Update room information in UI
    updateRoomInfo() {
        if (this.currentRoom) {
            const roomNameEl = document.getElementById('roomName');
            const roomTypeEl = document.getElementById('roomType');
            const onlineCountEl = document.getElementById('onlineCount');
            
            if (roomNameEl) roomNameEl.textContent = this.currentRoom.name;
            
            if (roomTypeEl) {
                roomTypeEl.textContent = this.currentRoom.type;
                roomTypeEl.className = `room-type ${this.currentRoom.type}`;
            }
            
            if (onlineCountEl) {
                const activeUsers = this.currentRoom.users.filter(u => u.isActive).length;
                onlineCountEl.querySelector('span').textContent = activeUsers;
            }
            
            // Update page title
            document.title = `${this.currentRoom.name} - Collaborative Drawing Board`;
        }
    }

    // Initialize drawing canvas
    initializeDrawingCanvas() {
        const canvas = document.getElementById('drawingCanvas');
        if (!canvas) return;
        
        // Initialize drawing engine
        if (window.initDrawingEngine) {
            window.drawingEngine = window.initDrawingEngine(canvas);
        }
        
        // Initialize undo/redo
        if (window.initUndoRedo) {
            window.undoRedoManager = window.initUndoRedo(canvas);
        }
        
        // Initialize color manager
        if (window.colorManager) {
            window.colorManager.selectColor('#000000');
        }
    }

    // Share room functionality
    shareRoom() {
        if (!this.currentRoom) return;
        
        const shareUrl = this.roomUrl || this.generateRoomUrl(this.currentRoom.id, this.currentRoom.joinCode);
        
        // Update share modal
        const shareUrlInput = document.getElementById('shareUrl');
        const shareCodeInput = document.getElementById('shareCode');
        
        if (shareUrlInput) shareUrlInput.value = shareUrl;
        if (shareCodeInput) shareCodeInput.value = this.currentRoom.joinCode;
        
        // Generate QR code if library is available
        this.generateQRCode(shareUrl);
        
        // Show share modal
        const shareModal = document.getElementById('shareModal');
        if (shareModal) shareModal.classList.add('active');
    }

    // Generate QR code for room URL
    generateQRCode(url) {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;
        
        // Simple QR code placeholder (you can integrate a QR code library here)
        qrContainer.innerHTML = `
            <div style="width: 150px; height: 150px; background: #f0f0f0; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <div style="text-align: center; color: #666; font-size: 12px;">
                    <i class="fas fa-qrcode" style="font-size: 24px; margin-bottom: 8px;"></i><br>
                    QR Code<br>
                    <small>Scan to join</small>
                </div>
            </div>
        `;
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copied to clipboard!', 'success');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById('notifications');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 4000);
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

    // Setup event listeners
    setupEventListeners() {
        // Landing page buttons
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const browseRoomsBtn = document.getElementById('browseRoomsBtn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                const modal = document.getElementById('roomModal');
                if (modal) modal.classList.add('active');
            });
        }

        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => {
                const modal = document.getElementById('joinModal');
                if (modal) modal.classList.add('active');
            });
        }

        if (browseRoomsBtn) {
            browseRoomsBtn.addEventListener('click', () => {
                this.showPublicLobby();
            });
        }

        // Room creation modal
        const createRoomSubmit = document.getElementById('createRoom');
        if (createRoomSubmit) {
            createRoomSubmit.addEventListener('click', () => {
                const roomNameInput = document.getElementById('roomNameInput');
                const roomTypeRadio = document.querySelector('input[name="roomType"]:checked');
                const joinCodeInput = document.getElementById('joinCodeInput');
                
                const roomName = roomNameInput ? roomNameInput.value.trim() : '';
                const isPrivate = roomTypeRadio ? roomTypeRadio.value === 'private' : false;
                const customCode = joinCodeInput ? joinCodeInput.value.trim() : '';
                
                if (!roomName) {
                    this.showNotification('Please enter a room name.', 'error');
                    return;
                }
                
                this.createRoom(roomName, isPrivate, customCode || null);
                
                const modal = document.getElementById('roomModal');
                if (modal) modal.classList.remove('active');
            });
        }

        // Join room modal
        const joinRoomSubmit = document.getElementById('joinRoom');
        if (joinRoomSubmit) {
            joinRoomSubmit.addEventListener('click', () => {
                const joinInput = document.getElementById('joinInput');
                const userNameInput = document.getElementById('userNameInput');
                
                const joinValue = joinInput ? joinInput.value.trim() : '';
                const userName = userNameInput ? userNameInput.value.trim() : 'Anonymous';
                
                if (!joinValue) {
                    this.showNotification('Please enter a room code or URL.', 'error');
                    return;
                }
                
                this.joinRoom(joinValue, userName);
                
                const modal = document.getElementById('joinModal');
                if (modal) modal.classList.remove('active');
            });
        }

        // Share functionality
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareRoom();
            });
        }

        const copyUrlBtn = document.getElementById('copyUrl');
        const copyCodeBtn = document.getElementById('copyCode');
        
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                const urlInput = document.getElementById('shareUrl');
                if (urlInput) this.copyToClipboard(urlInput.value);
            });
        }
        
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                const codeInput = document.getElementById('shareCode');
                if (codeInput) this.copyToClipboard(codeInput.value);
            });
        }

        // Modal close functionality
        document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Room type change handler
        document.querySelectorAll('input[name="roomType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const passwordGroup = document.getElementById('passwordGroup');
                if (passwordGroup) {
                    passwordGroup.style.display = e.target.value === 'private' ? 'block' : 'none';
                }
            });
        });

        // Window beforeunload
        window.addEventListener('beforeunload', () => {
            this.leaveRoom();
        });
    }

    // Show public lobby
    showPublicLobby() {
        const modal = document.getElementById('lobbyModal');
        const roomsList = document.getElementById('publicRoomsList');
        
        if (!modal || !roomsList) return;
        
        // Clear existing rooms
        roomsList.innerHTML = '';
        
        // Get public rooms
        const publicRooms = this.getPublicRooms();
        
        if (publicRooms.length === 0) {
            roomsList.innerHTML = '<div class="no-rooms">No public rooms available. Create one to get started!</div>';
        } else {
            publicRooms.forEach(room => {
                const roomElement = this.createRoomElement(room);
                roomsList.appendChild(roomElement);
            });
        }
        
        modal.classList.add('active');
        
        // Setup search functionality
        const searchInput = document.getElementById('roomSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterRooms(e.target.value);
            });
        }
        
        const refreshBtn = document.getElementById('refreshRooms');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.showPublicLobby();
            });
        }
    }

    // Create room element for lobby
    createRoomElement(room) {
        const element = document.createElement('div');
        element.className = 'room-card';
        
        const activeUsers = room.users.filter(u => u.isActive).length;
        const timeAgo = this.formatTimeAgo(room.lastActivity || room.createdAt);
        
        element.innerHTML = `
            <div class="room-header">
                <h4>${room.name}</h4>
                <span class="room-users">${activeUsers}/${room.maxUsers}</span>
            </div>
            <div class="room-info">
                <span class="room-age">${timeAgo}</span>
                <span class="room-status ${room.isActive ? 'active' : 'inactive'}">
                    ${room.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="room-meta">
                <span class="room-host">Host: ${room.hostName || 'Unknown'}</span>
            </div>
            <button class="btn btn-primary btn-sm join-room-btn" data-room-code="${room.joinCode}" ${!room.isActive || activeUsers >= room.maxUsers ? 'disabled' : ''}>
                ${activeUsers >= room.maxUsers ? 'Full' : 'Join Room'}
            </button>
        `;
        
        // Add join functionality
        const joinBtn = element.querySelector('.join-room-btn');
        if (joinBtn && !joinBtn.disabled) {
            joinBtn.addEventListener('click', () => {
                this.joinRoom(room.joinCode);
                const modal = document.getElementById('lobbyModal');
                if (modal) modal.classList.remove('active');
            });
        }
        
        return element;
    }

    // Filter rooms in lobby
    filterRooms(searchTerm) {
        const roomCards = document.querySelectorAll('.room-card');
        const term = searchTerm.toLowerCase();
        
        roomCards.forEach(card => {
            const roomName = card.querySelector('h4').textContent.toLowerCase();
            const hostName = card.querySelector('.room-host').textContent.toLowerCase();
            
            if (roomName.includes(term) || hostName.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Add demo public rooms
    addDemoPublicRooms() {
        const demoRooms = [
            { name: 'Art Studio', users: 3, hostName: 'Artist123' },
            { name: 'Design Workshop', users: 7, hostName: 'Designer' },
            { name: 'Sketch Pad', users: 1, hostName: 'Sketcher' },
            { name: 'Creative Space', users: 5, hostName: 'Creative' },
            { name: 'Drawing Room', users: 2, hostName: 'Drawer' }
        ];

        demoRooms.forEach(demo => {
            const room = {
                id: this.generateRoomId(),
                name: demo.name,
                type: 'public',
                joinCode: this.generateJoinCode(),
                createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                lastActivity: new Date(Date.now() - Math.random() * 1800000).toISOString(),
                host: this.generateUserId(),
                hostName: demo.hostName,
                users: Array(demo.users).fill().map((_, i) => ({
                    id: this.generateUserId(),
                    name: `User${Math.floor(Math.random() * 1000)}`,
                    isHost: i === 0,
                    isActive: Math.random() > 0.3,
                    joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
                })),
                maxUsers: this.maxUsers,
                isActive: true,
                settings: {
                    allowDrawing: true,
                    allowChat: true,
                    moderationEnabled: false
                }
            };
            
            this.publicRooms.set(room.id, room);
        });
    }

    // Format time ago
    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    // Leave current room
    leaveRoom() {
        if (this.currentRoom) {
            // Mark user as inactive
            const user = this.currentRoom.users.find(u => u.id === this.userId);
            if (user) {
                user.isActive = false;
            }
            
            // Update room activity
            this.currentRoom.lastActivity = new Date().toISOString();
            
            // Save room state
            const storageKey = this.currentRoom.type === 'private' ? 
                `privateRoom_${this.currentRoom.id}` : `publicRoom_${this.currentRoom.id}`;
            localStorage.setItem(storageKey, JSON.stringify(this.currentRoom));
            
            // Clear current room data
            this.currentRoom = null;
            this.isHost = false;
            this.joinCode = null;
            this.roomUrl = null;
            
            // Clear localStorage
            localStorage.removeItem('currentRoom');
            
            // Reset URL
            window.history.pushState({}, '', window.location.pathname);
            
            // Reset page title
            document.title = 'Collaborative Drawing Board';
            
            // Stop heartbeat
            this.stopRoomHeartbeat();
            
            // Show landing page
            this.showLandingPage();
        }
    }

    // Room heartbeat to keep room active
    startRoomHeartbeat() {
        this.stopRoomHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.currentRoom) {
                this.currentRoom.lastActivity = new Date().toISOString();
                
                const storageKey = this.currentRoom.type === 'private' ? 
                    `privateRoom_${this.currentRoom.id}` : `publicRoom_${this.currentRoom.id}`;
                localStorage.setItem(storageKey, JSON.stringify(this.currentRoom));
            }
        }, 30000); // Update every 30 seconds
    }

    stopRoomHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Cleanup expired rooms
    startRoomCleanup() {
        setInterval(() => {
            this.cleanupExpiredRooms();
        }, 60000); // Check every minute
    }

    cleanupExpiredRooms() {
        const now = new Date();
        
        // Clean public rooms
        for (const [roomId, room] of this.publicRooms.entries()) {
            const lastActivity = new Date(room.lastActivity || room.createdAt);
            if (now - lastActivity > this.roomTimeout) {
                this.publicRooms.delete(roomId);
                localStorage.removeItem(`publicRoom_${roomId}`);
            }
        }
        
        // Clean private rooms
        for (const [roomId, room] of this.privateRooms.entries()) {
            const lastActivity = new Date(room.lastActivity || room.createdAt);
            if (now - lastActivity > this.roomTimeout) {
                this.privateRooms.delete(roomId);
                localStorage.removeItem(`privateRoom_${roomId}`);
            }
        }
    }

    // Get room sharing info
    getRoomSharingInfo() {
        if (!this.currentRoom) return null;
        
        return {
            roomName: this.currentRoom.name,
            roomType: this.currentRoom.type,
            joinCode: this.currentRoom.joinCode,
            shareUrl: this.roomUrl || this.generateRoomUrl(this.currentRoom.id, this.currentRoom.joinCode),
            qrCodeData: this.roomUrl,
            activeUsers: this.currentRoom.users.filter(u => u.isActive).length,
            maxUsers: this.currentRoom.maxUsers
        };
    }

    // Export room data
    exportRoomData() {
        if (!this.currentRoom) return null;
        
        return {
            room: this.currentRoom,
            canvas: window.drawingEngine ? window.drawingEngine.exportCanvasData() : null,
            undoRedo: window.undoRedoManager ? window.undoRedoManager.exportStates() : null,
            timestamp: new Date().toISOString()
        };
    }

    // Import room data
    importRoomData(data) {
        if (data.room) {
            this.currentRoom = data.room;
            this.updateRoomInfo();
        }
        
        if (data.canvas && window.drawingEngine) {
            window.drawingEngine.importCanvasData(data.canvas);
        }
        
        if (data.undoRedo && window.undoRedoManager) {
            window.undoRedoManager.importStates(data.undoRedo);
        }
    }
}

// Initialize room manager
document.addEventListener('DOMContentLoaded', () => {
    window.roomManager = new RoomManager();
});

// Export for external use
window.RoomManager = RoomManager;