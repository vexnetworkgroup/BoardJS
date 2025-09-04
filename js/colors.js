// Comprehensive Color Palette with JSON Structure
const ColorPalette = {
    basic: [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080'
    ],
    
    material: {
        red: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
        pink: ['#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
        purple: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
        deepPurple: ['#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92'],
        indigo: ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E'],
        blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
        lightBlue: ['#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B'],
        cyan: ['#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40'],
        teal: ['#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40'],
        green: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
        lightGreen: ['#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E'],
        lime: ['#F9FBE7', '#F0F4C3', '#E6EE9C', '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717'],
        yellow: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#F9A825', '#F57F17', '#FF6F00'],
        amber: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00'],
        orange: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
        deepOrange: ['#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C'],
        brown: ['#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723'],
        grey: ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'],
        blueGrey: ['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238']
    },
    
    pastels: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D4BAFF', '#FFBAF3', '#F0F8FF',
        '#FFEAA7', '#DDA0DD', '#98FB98', '#F0E68C', '#FFB6C1', '#87CEEB', '#DEB887', '#F5DEB3',
        '#FFC0CB', '#E6E6FA', '#B0E0E6', '#AFEEEE', '#F0FFFF', '#F5FFFA', '#FDF5E6', '#FAF0E6',
        '#FFE4E1', '#FFEFD5', '#FFF8DC', '#F5FFFA', '#F0FFF0', '#F0FFFF', '#F5F5DC', '#FDF5E6'
    ],
    
    neon: [
        '#FF073A', '#FF6B35', '#F7931E', '#FFD23F', '#39FF14', '#00FFFF', '#0080FF', '#8A2BE2',
        '#FF1493', '#FF4500', '#FFD700', '#ADFF2F', '#00FF7F', '#00CED1', '#1E90FF', '#9400D3',
        '#FF69B4', '#FF8C00', '#FFFF00', '#32CD32', '#00FA9A', '#40E0D0', '#4169E1', '#DA70D6'
    ],
    
    earth: [
        '#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F',
        '#696969', '#708090', '#778899', '#B0C4DE', '#E6E6FA', '#F5F5DC', '#FDF5E6', '#FAF0E6',
        '#8B7355', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F'
    ],
    
    vintage: [
        '#704214', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C',
        '#5D4E37', '#8B7D6B', '#A0826D', '#BC9A6A', '#C19A6B', '#D2B48C', '#DDB76F', '#F5DEB3'
    ],
    
    ocean: [
        '#006994', '#1B8EAD', '#4FB3D9', '#87CEEB', '#B0E0E6', '#AFEEEE', '#E0FFFF', '#F0F8FF',
        '#003366', '#0066CC', '#3399FF', '#66B2FF', '#99CCFF', '#CCE5FF', '#E6F2FF', '#F0F8FF'
    ],
    
    sunset: [
        '#FF6B35', '#F7931E', '#FFD23F', '#FFAB00', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500',
        '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FFCCCB', '#FFE4E1', '#FFF0F5', '#FFFAFA'
    ],
    
    forest: [
        '#013220', '#2D5016', '#4F7942', '#6B8E23', '#8FBC8F', '#90EE90', '#98FB98', '#ADFF2F',
        '#228B22', '#32CD32', '#50C878', '#7CFC00', '#9ACD32', '#ADFF2F', '#CCFF99', '#F0FFF0'
    ],
    
    gradients: [
        { name: 'Sunset', colors: ['#FF512F', '#F09819'], angle: 45 },
        { name: 'Ocean', colors: ['#667eea', '#764ba2'], angle: 135 },
        { name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
        { name: 'Fire', colors: ['#f12711', '#f5af19'], angle: 45 },
        { name: 'Purple Rain', colors: ['#667eea', '#764ba2'], angle: 180 },
        { name: 'Pink Dream', colors: ['#ffecd2', '#fcb69f'], angle: 45 },
        { name: 'Blue Sky', colors: ['#74b9ff', '#0984e3'], angle: 90 },
        { name: 'Green Nature', colors: ['#00b894', '#00cec9'], angle: 135 },
        { name: 'Orange Burst', colors: ['#fdcb6e', '#e17055'], angle: 45 },
        { name: 'Purple Night', colors: ['#6c5ce7', '#a29bfe'], angle: 180 },
        { name: 'Red Passion', colors: ['#e17055', '#d63031'], angle: 90 },
        { name: 'Teal Wave', colors: ['#00cec9', '#55a3ff'], angle: 135 }
    ],
    
    seasonal: {
        spring: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE5CC', '#E5CCFF', '#CCFFE5', '#FFE5E5'],
        summer: ['#FF6B35', '#FFD23F', '#39FF14', '#00FFFF', '#FF1493', '#FFD700', '#32CD32', '#1E90FF'],
        autumn: ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#A0522D', '#F4A460', '#BC8F8F', '#D2B48C'],
        winter: ['#B0E0E6', '#E6E6FA', '#F0F8FF', '#F5F5F5', '#DCDCDC', '#C0C0C0', '#A9A9A9', '#778899']
    }
};

class ColorManager {
    constructor() {
        this.currentColor = '#000000';
        this.customColors = JSON.parse(localStorage.getItem('customColors')) || [];
        this.recentColors = JSON.parse(localStorage.getItem('recentColors')) || [];
        this.favoriteColors = JSON.parse(localStorage.getItem('favoriteColors')) || [];
        this.maxRecentColors = 16;
        this.maxCustomColors = 32;
        
        this.initializeColorPalette();
        this.setupColorHistory();
    }

    initializeColorPalette() {
        this.renderBasicColors();
        this.renderMaterialColors();
        this.renderPastelColors();
        this.renderCustomColors();
        this.setupColorPicker();
        this.setupColorSearch();
    }

    renderBasicColors() {
        const container = document.getElementById('basicColors');
        if (!container) return;
        
        container.innerHTML = '';
        
        ColorPalette.basic.forEach(color => {
            const colorElement = this.createColorElement(color);
            container.appendChild(colorElement);
        });
    }

    renderMaterialColors() {
        const container = document.getElementById('materialColors');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show primary colors from each material color family
        Object.keys(ColorPalette.material).forEach(colorFamily => {
            const primaryColor = ColorPalette.material[colorFamily][5]; // Middle shade
            const colorElement = this.createColorElement(primaryColor);
            colorElement.title = `${colorFamily} - ${primaryColor}`;
            
            // Add click handler to show all shades
            colorElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showColorShades(colorFamily, ColorPalette.material[colorFamily]);
            });
            
            container.appendChild(colorElement);
        });
    }

    renderPastelColors() {
        const container = document.getElementById('pastelColors');
        if (!container) return;
        
        container.innerHTML = '';
        
        ColorPalette.pastels.slice(0, 16).forEach(color => {
            const colorElement = this.createColorElement(color);
            container.appendChild(colorElement);
        });
    }

    renderCustomColors() {
        const container = document.getElementById('customColors');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Add recent colors section
        if (this.recentColors.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.className = 'color-subsection';
            recentSection.innerHTML = '<small style="color: var(--text-secondary); font-size: 11px;">Recent</small>';
            const recentGrid = document.createElement('div');
            recentGrid.className = 'color-grid';
            
            this.recentColors.slice(0, 8).forEach(color => {
                const colorElement = this.createColorElement(color);
                colorElement.classList.add('recent-color');
                recentGrid.appendChild(colorElement);
            });
            
            recentSection.appendChild(recentGrid);
            container.appendChild(recentSection);
        }
        
        // Add custom colors section
        if (this.customColors.length > 0) {
            const customSection = document.createElement('div');
            customSection.className = 'color-subsection';
            customSection.innerHTML = '<small style="color: var(--text-secondary); font-size: 11px;">Custom</small>';
            const customGrid = document.createElement('div');
            customGrid.className = 'color-grid';
            
            this.customColors.forEach(color => {
                const colorElement = this.createColorElement(color);
                colorElement.classList.add('custom-color');
                colorElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.removeCustomColor(color);
                });
                customGrid.appendChild(colorElement);
            });
            
            customSection.appendChild(customGrid);
            container.appendChild(customSection);
        }
    }

    createColorElement(color) {
        const element = document.createElement('div');
        element.className = 'color-option';
        element.style.backgroundColor = color;
        element.title = color;
        element.dataset.color = color;
        
        // Add accessibility attributes
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', `Select color ${color}`);
        
        // Event listeners
        element.addEventListener('click', () => this.selectColor(color));
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.selectColor(color);
            }
        });
        
        // Double-click to add to favorites
        element.addEventListener('dblclick', () => {
            this.addToFavorites(color);
        });
        
        if (color === this.currentColor) {
            element.classList.add('active');
        }
        
        return element;
    }

    selectColor(color) {
        this.currentColor = color;
        this.addToRecentColors(color);
        
        // Update active state
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.remove('active');
        });
        
        document.querySelectorAll(`.color-option[data-color="${color}"]`).forEach(el => {
            el.classList.add('active');
        });
        
        // Update color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.value = color;
        }
        
        // Notify drawing engine
        if (window.drawingEngine) {
            window.drawingEngine.setColor(color);
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('colorChanged', { detail: { color } }));
    }

    addCustomColor(color) {
        if (!this.customColors.includes(color)) {
            this.customColors.unshift(color);
            
            // Limit custom colors
            if (this.customColors.length > this.maxCustomColors) {
                this.customColors = this.customColors.slice(0, this.maxCustomColors);
            }
            
            localStorage.setItem('customColors', JSON.stringify(this.customColors));
            this.renderCustomColors();
            
            this.showNotification(`Added ${color} to custom colors`, 'success');
        }
    }

    removeCustomColor(color) {
        const index = this.customColors.indexOf(color);
        if (index > -1) {
            this.customColors.splice(index, 1);
            localStorage.setItem('customColors', JSON.stringify(this.customColors));
            this.renderCustomColors();
            
            this.showNotification(`Removed ${color} from custom colors`, 'info');
        }
    }

    addToRecentColors(color) {
        // Remove if already exists
        const index = this.recentColors.indexOf(color);
        if (index > -1) {
            this.recentColors.splice(index, 1);
        }
        
        // Add to beginning
        this.recentColors.unshift(color);
        
        // Limit recent colors
        if (this.recentColors.length > this.maxRecentColors) {
            this.recentColors = this.recentColors.slice(0, this.maxRecentColors);
        }
        
        localStorage.setItem('recentColors', JSON.stringify(this.recentColors));
    }

    addToFavorites(color) {
        if (!this.favoriteColors.includes(color)) {
            this.favoriteColors.push(color);
            localStorage.setItem('favoriteColors', JSON.stringify(this.favoriteColors));
            this.showNotification(`Added ${color} to favorites`, 'success');
        }
    }

    setupColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        const addButton = document.getElementById('addCustomColor');
        
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.selectColor(e.target.value);
            });
            
            colorPicker.addEventListener('input', (e) => {
                // Real-time preview while dragging
                if (window.drawingEngine) {
                    window.drawingEngine.setColor(e.target.value);
                }
            });
        }
        
        if (addButton) {
            addButton.addEventListener('click', () => {
                const color = colorPicker ? colorPicker.value : this.currentColor;
                this.addCustomColor(color);
                this.selectColor(color);
            });
        }
    }

    setupColorSearch() {
        // Add color search functionality if needed
        const searchInput = document.getElementById('colorSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchColors(e.target.value);
            });
        }
    }

    setupColorHistory() {
        // Setup undo/redo for color changes
        this.colorHistory = [];
        this.colorHistoryIndex = -1;
        
        document.addEventListener('colorChanged', (e) => {
            this.saveColorState(e.detail.color);
        });
    }

    saveColorState(color) {
        // Remove future states if we're not at the end
        this.colorHistory = this.colorHistory.slice(0, this.colorHistoryIndex + 1);
        
        // Add new state
        this.colorHistory.push(color);
        this.colorHistoryIndex++;
        
        // Limit history
        if (this.colorHistory.length > 50) {
            this.colorHistory.shift();
            this.colorHistoryIndex--;
        }
    }

    showColorShades(familyName, shades) {
        // Create a modal or tooltip showing all shades
        const modal = document.createElement('div');
        modal.className = 'color-shades-modal';
        modal.innerHTML = `
            <div class="color-shades-content">
                <h4>${familyName} Shades</h4>
                <div class="shades-grid">
                    ${shades.map(shade => `
                        <div class="shade-item" style="background-color: ${shade}" 
                             title="${shade}" data-color="${shade}">
                            <span class="shade-label">${shade}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="close-shades">×</button>
            </div>
        `;
        
        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-shades-modal') || 
                e.target.classList.contains('close-shades')) {
                modal.remove();
            } else if (e.target.dataset.color) {
                this.selectColor(e.target.dataset.color);
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    }

    searchColors(query) {
        if (!query) return;
        
        const results = [];
        
        // Search in all color palettes
        Object.values(ColorPalette).forEach(palette => {
            if (Array.isArray(palette)) {
                palette.forEach(color => {
                    if (color.toLowerCase().includes(query.toLowerCase())) {
                        results.push(color);
                    }
                });
            } else if (typeof palette === 'object') {
                Object.values(palette).forEach(colors => {
                    if (Array.isArray(colors)) {
                        colors.forEach(color => {
                            if (color.toLowerCase().includes(query.toLowerCase())) {
                                results.push(color);
                            }
                        });
                    }
                });
            }
        });
        
        return results;
    }

    getCurrentColor() {
        return this.currentColor;
    }

    getColorInfo(color) {
        // Convert color to different formats
        const hex = color.startsWith('#') ? color : this.rgbToHex(color);
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        return {
            hex,
            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
            brightness: this.getBrightness(rgb),
            isLight: this.isLightColor(rgb)
        };
    }

    // Color conversion utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(rgb) {
        const match = rgb.match(/\d+/g);
        if (!match) return rgb;
        
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    getBrightness(rgb) {
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }

    isLightColor(rgb) {
        return this.getBrightness(rgb) > 128;
    }

    // Generate color harmonies
    generateColorHarmony(baseColor, type = 'complementary') {
        const rgb = this.hexToRgb(baseColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        const harmonies = {
            complementary: [(hsl.h + 180) % 360],
            triadic: [(hsl.h + 120) % 360, (hsl.h + 240) % 360],
            analogous: [(hsl.h + 30) % 360, (hsl.h - 30 + 360) % 360],
            splitComplementary: [(hsl.h + 150) % 360, (hsl.h + 210) % 360],
            tetradic: [(hsl.h + 90) % 360, (hsl.h + 180) % 360, (hsl.h + 270) % 360]
        };
        
        return harmonies[type]?.map(h => 
            this.hslToHex(h, hsl.s, hsl.l)
        ) || [];
    }

    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Export color palette for sharing/saving
    exportPalette() {
        return {
            basic: ColorPalette.basic,
            material: ColorPalette.material,
            pastels: ColorPalette.pastels,
            neon: ColorPalette.neon,
            earth: ColorPalette.earth,
            vintage: ColorPalette.vintage,
            ocean: ColorPalette.ocean,
            sunset: ColorPalette.sunset,
            forest: ColorPalette.forest,
            gradients: ColorPalette.gradients,
            seasonal: ColorPalette.seasonal,
            custom: this.customColors,
            recent: this.recentColors,
            favorites: this.favoriteColors,
            currentColor: this.currentColor
        };
    }

    // Import color palette
    importPalette(paletteData) {
        if (paletteData.custom) {
            this.customColors = paletteData.custom;
            localStorage.setItem('customColors', JSON.stringify(this.customColors));
        }
        
        if (paletteData.recent) {
            this.recentColors = paletteData.recent;
            localStorage.setItem('recentColors', JSON.stringify(this.recentColors));
        }
        
        if (paletteData.favorites) {
            this.favoriteColors = paletteData.favorites;
            localStorage.setItem('favoriteColors', JSON.stringify(this.favoriteColors));
        }
        
        if (paletteData.currentColor) {
            this.selectColor(paletteData.currentColor);
        }
        
        this.renderCustomColors();
    }

    // Random color generator
    generateRandomColor(type = 'any') {
        const generators = {
            any: () => {
                const colors = [
                    ...ColorPalette.basic,
                    ...Object.values(ColorPalette.material).flat(),
                    ...ColorPalette.pastels,
                    ...ColorPalette.neon
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            },
            pastel: () => ColorPalette.pastels[Math.floor(Math.random() * ColorPalette.pastels.length)],
            neon: () => ColorPalette.neon[Math.floor(Math.random() * ColorPalette.neon.length)],
            material: () => {
                const families = Object.keys(ColorPalette.material);
                const family = families[Math.floor(Math.random() * families.length)];
                const colors = ColorPalette.material[family];
                return colors[Math.floor(Math.random() * colors.length)];
            },
            random: () => {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
        };
        
        return generators[type] ? generators[type]() : generators.any();
    }

    showNotification(message, type = 'info') {
        // Create notification if notification system exists
        if (window.roomManager && typeof window.roomManager.showNotification === 'function') {
            window.roomManager.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.selectColor(this.generateRandomColor());
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            navigator.clipboard.writeText(this.currentColor);
                            this.showNotification(`Copied ${this.currentColor} to clipboard`, 'success');
                        }
                        break;
                }
            }
        });
    }
}

// Add CSS for color shades modal
const colorModalCSS = `
.color-shades-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
}

.color-shades-content {
    background: var(--surface);
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    position: relative;
    box-shadow: var(--shadow-lg);
}

.color-shades-content h4 {
    margin-bottom: 16px;
    text-transform: capitalize;
    color: var(--text-primary);
}

.shades-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 16px;
}

.shade-item {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: var(--transition);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 4px;
}

.shade-item:hover {
    transform: scale(1.1);
    border-color: var(--text-primary);
    z-index: 1;
}

.shade-label {
    font-size: 8px;
    color: white;
    text-shadow: 0 0 2px rgba(0,0,0,0.8);
    opacity: 0;
    transition: var(--transition);
}

.shade-item:hover .shade-label {
    opacity: 1;
}

.close-shades {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-secondary);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-shades:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
}

.color-subsection {
    margin-bottom: 12px;
}

.color-subsection small {
    display: block;
    margin-bottom: 6px;
}
`;

// Add CSS to document
const style = document.createElement('style');
style.textContent = colorModalCSS;
document.head.appendChild(style);

// Initialize color manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.colorManager = new ColorManager();
    window.colorManager.setupKeyboardShortcuts();
});

// Export for external use
window.ColorManager = ColorManager;
window.ColorPalette = ColorPalette;