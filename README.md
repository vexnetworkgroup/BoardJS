# 🎨 Collaborative Drawing Board

A modern, real-time collaborative drawing application with advanced features, public/private rooms, and comprehensive drawing tools.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

## ✨ Features

### 🎨 **Enhanced Drawing Engine**
- **Multiple Drawing Tools**: Brush, Pencil, Eraser, Line, Rectangle, Circle, Text, Selection
- **Layer Support**: Create, manage, and organize multiple drawing layers
- **Advanced Brush Settings**: Customizable size, opacity, and tool-specific properties
- **High DPI Support**: Crisp drawing on all screen types
- **Smooth Drawing**: Optimized for performance with smooth curves and anti-aliasing

### 🌈 **Comprehensive Color System**
- **Rich Color Palettes**: Basic, Material Design, Pastels, Neon, Earth, Vintage, Ocean, Sunset, Forest colors
- **Seasonal Themes**: Spring, Summer, Autumn, Winter color collections
- **Custom Colors**: Add, save, and manage custom colors
- **Recent Colors**: Quick access to recently used colors
- **Color Harmonies**: Generate complementary, triadic, and analogous color schemes
- **Advanced Color Tools**: HSL/RGB conversion, brightness detection, color search

### ⏪ **Optimized Undo/Redo System**
- **Efficient State Management**: Smart compression for large canvases
- **Unlimited History**: Up to 50 states with memory optimization
- **Batch Operations**: Group multiple actions for better performance
- **Keyboard Shortcuts**: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+S (Save State)
- **Visual History**: Browse and jump to specific states
- **Performance Monitoring**: Memory usage tracking and optimization

### 🏠 **Public/Private Room System**
- **Public Rooms**: Discoverable in the public lobby, anyone can join
- **Private Rooms**: Secure rooms requiring join codes or invite links
- **URL Sharing**: Direct room access via shareable URLs
- **Guest Access**: Join rooms without registration
- **Room Persistence**: Rooms stay active for 24 hours
- **Real-time Collaboration**: See other users drawing in real-time

### 🔗 **Advanced Room Features**
- **Auto-generated Join Codes**: 6-character alphanumeric codes
- **QR Code Sharing**: Visual room sharing (placeholder implementation)
- **Room Management**: Host controls, user management, room settings
- **Public Lobby**: Browse and search available public rooms
- **Room Recovery**: Automatic session restoration
- **Connection Status**: Online/offline status indicators

### 📱 **Modern User Interface**
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Themes**: Automatic theme detection and manual toggle
- **Accessibility**: Full keyboard navigation, screen reader support
- **Touch Support**: Optimized for touch devices and stylus input
- **Drag & Drop**: Import images by dragging them onto the canvas
- **Tooltips & Help**: Comprehensive help system and keyboard shortcuts

### ⚡ **Performance & Optimization**
- **Memory Management**: Smart garbage collection and state compression
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Lazy Loading**: Components load on demand
- **Efficient Rendering**: Optimized canvas operations and layer compositing
- **Background Processing**: Non-blocking operations for smooth experience

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. Choose to create a new room or join an existing one
3. Start drawing collaboratively!

### Creating a Room
1. Click **"Create New Room"** on the landing page
2. Enter a room name
3. Choose **Public** (visible in lobby) or **Private** (requires join code)
4. Click **"Create Room"** to start drawing

### Joining a Room
- **Via Join Code**: Enter the 6-character room code
- **Via URL**: Click on a shared room link
- **Via Public Lobby**: Browse and join public rooms

## 🎮 Controls & Shortcuts

### Drawing Tools
| Key | Tool |
|-----|------|
| `B` | Brush |
| `P` | Pencil |
| `E` | Eraser |
| `L` | Line |
| `R` | Rectangle |
| `C` | Circle |
| `T` | Text |
| `S` | Select |

### Brush Controls
| Key | Action |
|-----|--------|
| `[` | Decrease brush size |
| `]` | Increase brush size |

### General Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save state |
| `Ctrl+N` | New room |
| `Ctrl+J` | Join room |
| `Ctrl+Shift+L` | Browse public rooms |
| `Ctrl+Shift+S` | Share room |
| `Ctrl+Shift+H` | Show help |
| `F11` | Toggle fullscreen |
| `Esc` | Close modal |

## 🏗️ Architecture

### Component Structure
```
DrawingApp (main.js)
├── UIManager (ui.js) - Interface and interactions
├── ColorManager (colors.js) - Color palette system
├── RoomManager (rooms.js) - Room and collaboration
├── DrawingEngine (drawing.js) - Canvas and tools
└── UndoRedoManager (undo-redo.js) - State management
```

### File Structure
```
/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Modern CSS with responsive design
├── js/
│   ├── main.js            # Application controller
│   ├── ui.js              # UI management
│   ├── colors.js          # Color palette system
│   ├── rooms.js           # Room management
│   ├── drawing.js         # Drawing engine
│   └── undo-redo.js       # Undo/redo system
└── README.md              # Documentation
```

## 🎨 Color Palette System

The application includes a comprehensive color system with multiple palettes:

### Available Palettes
- **Basic Colors**: Standard 16-color palette
- **Material Design**: Google's Material Design color system
- **Pastels**: Soft, muted colors perfect for gentle artwork
- **Neon**: Bright, vibrant colors for bold designs
- **Earth Tones**: Natural, organic colors
- **Vintage**: Retro-inspired color schemes
- **Ocean**: Blue and aqua variations
- **Sunset**: Warm oranges, reds, and yellows
- **Forest**: Green and nature-inspired colors
- **Seasonal**: Spring, Summer, Autumn, Winter themes

### Color Features
- **Custom Colors**: Add and save your own colors
- **Recent Colors**: Quick access to recently used colors
- **Color Harmonies**: Generate complementary color schemes
- **Color Search**: Find colors by name or hex value
- **Import/Export**: Share color palettes between sessions

## 🏠 Room System

### Public Rooms
- Visible in the public lobby
- Anyone can join without invitation
- Great for open collaboration and community drawing

### Private Rooms
- Hidden from public view
- Require join code or invite link
- Perfect for team collaboration and private sessions

### Room Features
- **Real-time Collaboration**: See others drawing live
- **User Management**: Track online users
- **Persistent Sessions**: Rooms stay active for 24 hours
- **Auto-cleanup**: Expired rooms are automatically removed
- **Session Recovery**: Rejoin previous rooms automatically

## 🔧 Technical Details

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance
- **Canvas Optimization**: High DPI support with efficient rendering
- **Memory Management**: Smart state compression and cleanup
- **Responsive Design**: Adapts to all screen sizes
- **Touch Optimization**: Smooth touch and stylus input

### Storage
- **Local Storage**: User preferences and room sessions
- **Session Storage**: Temporary drawing states
- **Memory Management**: Automatic cleanup of old data

## 🛠️ Development

### Local Development
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required - it's pure HTML/CSS/JS!

### Customization
The application is built with modular components that can be easily customized:

- **Themes**: Modify CSS variables in `styles.css`
- **Tools**: Add new drawing tools in `drawing.js`
- **Colors**: Extend color palettes in `colors.js`
- **UI**: Customize interface in `ui.js`

### Adding New Features
1. Create new component files in the `js/` directory
2. Initialize components in `main.js`
3. Add UI elements in `index.html`
4. Style components in `styles.css`

## 🐛 Troubleshooting

### Common Issues

**Canvas not loading**
- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

**Room not found**
- Check if the join code is correct
- Ensure the room hasn't expired (24 hours)
- Try creating a new room

**Drawing lag**
- Reduce brush size for better performance
- Close other browser tabs
- Check available system memory

**Connection issues**
- Check internet connection
- Try refreshing the page
- Clear browser cache if needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow existing code style
2. Add comments for complex functionality
3. Test on multiple browsers
4. Update documentation as needed

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Look through existing issues
3. Create a new issue with detailed information

## 🎯 Future Enhancements

- [ ] Real WebSocket integration for true real-time collaboration
- [ ] Voice chat integration
- [ ] Advanced shape tools (polygons, bezier curves)
- [ ] Animation timeline
- [ ] 3D drawing capabilities
- [ ] Mobile app versions
- [ ] Cloud storage integration
- [ ] Advanced user authentication
- [ ] Room templates and themes
- [ ] Export to various formats (SVG, PDF, etc.)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Material Design for color inspiration
- The open-source community for inspiration and tools

---

**Made with ❤️ for collaborative creativity**

*Version 2.0.0 - Enhanced with modern features and improved performance*