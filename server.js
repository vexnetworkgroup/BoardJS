const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
const fs = require("fs")
const { v4: uuidv4 } = require('uuid') // Dùng để tạo ID cho nét vẽ

const app = express()
const server = http.createServer(app)
const io = socketIo(server, { cors: { origin: "*" } })

// --- Cấu hình ---
const PORT = process.env.PORT || 3109
const DATA_DIR = path.join(__dirname, "data")
const BOARDS_DIR = path.join(DATA_DIR, "boards")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const BOARD_EXPIRY_DAYS = 14
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 giờ

// --- Khởi tạo thư mục và file ---
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)
if (!fs.existsSync(BOARDS_DIR)) fs.mkdirSync(BOARDS_DIR)
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]))

// --- Helper Functions ---
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE))
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

function getBoardPath(roomId) {
    return path.join(BOARDS_DIR, `${roomId}.json`)
}

function readBoard(roomId) {
    const boardPath = getBoardPath(roomId)
    if (fs.existsSync(boardPath)) {
        return JSON.parse(fs.readFileSync(boardPath))
    }
    return null
}

function writeBoard(roomId, boardData) {
    const boardPath = getBoardPath(roomId)
    boardData.lastModified = Date.now()
    fs.writeFileSync(boardPath, JSON.stringify(boardData, null, 2))
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// --- Middleware ---
app.use(express.json({ limit: "10mb" }))
app.use(express.static("public"))

// --- API Routes cho User Authentication ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." })
    }
    const users = readUsers()
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ message: "Username already exists." })
    }
    // Chú ý: Trong thực tế, bạn PHẢI mã hóa mật khẩu. Ví dụ: dùng bcrypt.
    // const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), username, password /*: hashedPassword */ }
    users.push(newUser)
    writeUsers(users)
    res.status(201).json({ id: newUser.id, username: newUser.username })
})

app.post('/api/login', (req, res) => {
    const { username, password } = req.body
    const users = readUsers()
    const user = users.find(u => u.username === username)
    // Chú ý: So sánh mật khẩu đã được mã hóa trong thực tế
    // const match = await bcrypt.compare(password, user.password);
    if (user && user.password === password) {
        res.status(200).json({ id: user.id, username: user.username })
    } else {
        res.status(401).json({ message: "Invalid credentials." })
    }
})

// --- Socket.IO Logic ---
io.on("connection", (socket) => {
    // Gán user info vào socket để sử dụng sau này
    socket.userInfo = { id: null, username: 'Anonymous' }

    socket.on('authenticate', (userData) => {
        socket.userInfo = userData;
    });

    // --- Room Management ---
    socket.on("create-room", (callback) => {
        const roomId = generateRoomId()
        const newBoard = {
            roomId,
            owner: socket.userInfo.id,
            createdAt: Date.now(),
            lastModified: Date.now(),
            expiryDate: Date.now() + BOARD_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
            strokes: {}, // Dùng object thay vì array để xóa dễ hơn
            members: [],
            bannedIPs: []
        }
        writeBoard(roomId, newBoard)
        callback({ success: true, roomId })
    })

    socket.on("join-room", (roomId, callback) => {
        const board = readBoard(roomId)
        if (!board) {
            return callback({ success: false, message: "Room not found." })
        }
        
        const userIP = socket.handshake.address;
        if (board.bannedIPs && board.bannedIPs.includes(userIP)) {
            return callback({ success: false, message: "You are banned from this room." });
        }

        if (socket.currentRoom) {
            socket.leave(socket.currentRoom)
        }
        socket.join(roomId)
        socket.currentRoom = roomId

        // Cập nhật danh sách thành viên
        const existingMember = board.members.find(m => m.id === socket.userInfo.id)
        if (existingMember) {
            existingMember.status = 'online'
            existingMember.socketId = socket.id;
        } else {
            board.members.push({ ...socket.userInfo, status: 'online', socketId: socket.id })
        }
        writeBoard(roomId, board)

        callback({ success: true, boardData: board })
        
        // Gửi thông tin thành viên mới cho mọi người trong phòng
        io.to(roomId).emit('update-members', board.members)
    })

    // --- Whiteboard Actions ---
    socket.on("add-stroke", ({ roomId, strokeData }) => {
        const board = readBoard(roomId)
        if (!board) return
        
        // Đảm bảo stroke có ID
        const strokeId = strokeData.id || uuidv4();
        board.strokes[strokeId] = { id: strokeId, ...strokeData };
        writeBoard(roomId, board)
        
        // Gửi nét vẽ mới cho những người khác (bao gồm cả người gửi để đồng bộ)
        io.to(roomId).emit("new-stroke", { strokeId, strokeData: board.strokes[strokeId] })
    })
    
    socket.on("delete-stroke", ({ roomId, strokeId }) => {
        const board = readBoard(roomId)
        if (!board) return
        
        // Chỉ chủ phòng mới có quyền xóa (ví dụ)
        // if (board.owner !== socket.userInfo.id) return;
        
        if (board.strokes[strokeId]) {
            delete board.strokes[strokeId]
            writeBoard(roomId, board)
            io.to(roomId).emit("stroke-deleted", strokeId)
        }
    })

    socket.on("clear-board", (roomId) => {
        const board = readBoard(roomId)
        if (board && board.owner === socket.userInfo.id) { // Chỉ chủ phòng được clear
            board.strokes = {}
            writeBoard(roomId, board)
            io.to(roomId).emit("board-cleared")
        }
    })

    // --- Collaboration Features ---
    socket.on('cursor-move', (data) => {
        socket.to(socket.currentRoom).emit('update-cursor', {
            ...data,
            user: socket.userInfo,
        });
    });

    socket.on('viewport-update', (data) => {
        // Có thể dùng để đồng bộ viewport nếu cần
    });
    
    socket.on('kick-user', ({ roomId, userIdToKick }) => {
        const board = readBoard(roomId);
        if (board && board.owner === socket.userInfo.id) {
            const memberToKick = board.members.find(m => m.id === userIdToKick);
            if (memberToKick) {
                // Lấy IP từ socket nếu có
                const targetSocket = io.sockets.sockets.get(memberToKick.socketId);
                if (targetSocket) {
                    const userIP = targetSocket.handshake.address;
                    if (!board.bannedIPs) board.bannedIPs = [];
                    board.bannedIPs.push(userIP); // Block IP
                    
                    targetSocket.emit('kicked', 'You have been kicked and banned from this room.');
                    targetSocket.disconnect();
                }
                
                // Cập nhật trạng thái
                memberToKick.status = 'offline';
                writeBoard(roomId, board);
                io.to(roomId).emit('update-members', board.members);
            }
        }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
        if (socket.currentRoom) {
            const board = readBoard(socket.currentRoom)
            if (board) {
                const member = board.members.find(m => m.socketId === socket.id)
                if (member) {
                    member.status = 'offline'
                    writeBoard(socket.currentRoom, board)
                    io.to(socket.currentRoom).emit('update-members', board.members)
                }
            }
        }
    })
})

// --- Cleanup ---
setInterval(() => {
    const now = Date.now();
    fs.readdir(BOARDS_DIR, (err, files) => {
        if (err) return;
        files.forEach(file => {
            const board = readBoard(file.replace('.json', ''));
            if (board && now > board.expiryDate) {
                fs.unlink(getBoardPath(board.roomId), () => {
                    console.log(`Cleaned up expired board: ${board.roomId}`);
                });
            }
        });
    });
}, CLEANUP_INTERVAL);

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`vDraw Whiteboard Server running on port ${PORT}`)
})