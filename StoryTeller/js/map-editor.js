// ========================================
// SIMPLE MAP EDITOR - Clean Start
// Using Michelle's sprite sheet with intuitive class names
// ========================================

// ========================================
// TILE DEFINITIONS
// ========================================

const tiles = [
    // Terrain
    { name: "Mountain", className: "mountain", category: "terrain", emoji: "🏔️" },
    { name: "Water", className: "water", category: "terrain", emoji: "🌊" },
    { name: "Grass", className: "grass", category: "terrain", emoji: "🌿" },
    { name: "Rock", className: "rock", category: "terrain", emoji: "🪨" },
    
    // Buildings
    { name: "Castle", className: "castle", category: "buildings", emoji: "🏰" },
    { name: "House", className: "house", category: "buildings", emoji: "🏠" },
    { name: "Shop", className: "shop", category: "buildings", emoji: "🏪" },
    { name: "Temple", className: "temple", category: "buildings", emoji: "🏛️" },
    
    // RPG Elements
    { name: "Dragon", className: "dragon", category: "monsters", emoji: "🐉" },
    { name: "Sword", className: "sword", category: "items", emoji: "⚔️" },
    { name: "Skull", className: "skull", category: "hazards", emoji: "💀" },
    { name: "Danger", className: "danger", category: "hazards", emoji: "⚠️" },
    
    // Special
    { name: "Tower", className: "tower", category: "buildings", emoji: "🗼" },
    { name: "Road", className: "road", category: "paths", emoji: "🛣️" },
    { name: "Door", className: "door", category: "features", emoji: "🚪" },
    { name: "Fire", className: "fire", category: "hazards", emoji: "🔥" },
    
    // Tools
    { name: "Player", className: "player", category: "tokens", emoji: "👤" },
    { name: "Clear", className: "clear", category: "tools", emoji: "❌" }
];

// ========================================
// GLOBAL STATE
// ========================================

let currentTile = tiles[0]; // Default to Mountain
let mapSize = 15; // Default 15x15 grid
let mapData = []; // Will hold the map state
let spritesEnabled = false; // Will be set after checking sprite availability

// ========================================
// SPRITE SYSTEM
// ========================================

async function checkSprites() {
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = 'assets/dungeon_sprite_sheet_ordered.png';
        });
        spritesEnabled = true;
        console.log('✅ Sprites loaded successfully!');
        return true;
    } catch (error) {
        spritesEnabled = false;
        console.log('❌ Sprites not found, using emoji fallback');
        return false;
    }
}

function updateSpriteStatus() {
    const statusElement = document.getElementById('sprite-status');
    if (statusElement) {
        statusElement.textContent = spritesEnabled ? 
            '🎨 Enhanced sprites active' : 
            '📝 Using emoji fallback';
        statusElement.className = spritesEnabled ? 
            'sprite-status-active' : 
            'sprite-status-fallback';
    }
}

// ========================================
// TILE SELECTOR
// ========================================

function createTileSelector() {
    const container = document.getElementById('tile-selector');
    console.log('🎯 createTileSelector - container found:', !!container);
    if (!container) return;
    
    container.innerHTML = '';
    
    tiles.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'selector-tile';
        if (index === 0) tileElement.classList.add('selected');
        
        // Create tile display
        if (spritesEnabled && tile.className !== 'player' && tile.className !== 'clear') {
            tileElement.innerHTML = `<div class="sprite ${tile.className}"></div>`;
            console.log(`🎨 Created sprite tile: ${tile.className}`);
        } else {
            tileElement.textContent = tile.emoji;
            console.log(`📝 Created emoji tile: ${tile.name} = ${tile.emoji}`);
        }
        
        // Add click handler
        tileElement.addEventListener('click', () => selectTile(tile, tileElement));
        
        container.appendChild(tileElement);
    });
    
    console.log(`✅ Created ${tiles.length} selector tiles`);
}

function selectTile(tile, element) {
    // Remove selection from all tiles
    document.querySelectorAll('.selector-tile').forEach(t => t.classList.remove('selected'));
    
    // Select this tile
    element.classList.add('selected');
    currentTile = tile;
    
    console.log(`Selected tile: ${tile.name}`);
}

// ========================================
// MAP GRID
// ========================================

function createMapGrid() {
    const container = document.getElementById('map-grid');
    console.log('🗺️ createMapGrid - container found:', !!container);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${mapSize}, 1fr)`;
    
    // Initialize map data
    mapData = new Array(mapSize * mapSize).fill(null);
    
    // Create grid cells
    for (let i = 0; i < mapSize * mapSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        cell.dataset.index = i;
        
        // Add click handler
        cell.addEventListener('click', () => placeTile(i));
        
        container.appendChild(cell);
    }
    
    console.log(`✅ Created ${mapSize}x${mapSize} map grid (${mapSize * mapSize} cells)`);
}

function placeTile(index) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (!cell) return;
    
    if (currentTile.className === 'clear') {
        // Clear the cell
        mapData[index] = null;
        cell.innerHTML = '';
        cell.className = 'map-cell';
    } else {
        // Place the tile
        mapData[index] = currentTile;
        cell.innerHTML = '';
        cell.className = 'map-cell';
        
        if (spritesEnabled && currentTile.className !== 'player') {
            cell.innerHTML = `<div class="sprite ${currentTile.className}"></div>`;
        } else {
            cell.textContent = currentTile.emoji;
        }
    }
}

// ========================================
// MAP CONTROLS
// ========================================

function setMapSize(size) {
    const sizeMap = { small: 10, medium: 15, large: 20 };
    mapSize = sizeMap[size] || 15;
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
    
    createMapGrid();
    console.log(`Map size set to ${mapSize}x${mapSize}`);
}

function clearMap() {
    mapData.fill(null);
    document.querySelectorAll('.map-cell').forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'map-cell';
    });
    console.log('Map cleared');
}

// ========================================
// INITIALIZATION
// ========================================

async function initializeMapEditor() {
    console.log('🗺️ Initializing Simple Map Editor...');
    
    // Check if required elements exist
    const tileSelector = document.getElementById('tile-selector');
    const mapGrid = document.getElementById('map-grid');
    const spriteStatus = document.getElementById('sprite-status');
    
    console.log('📋 Element check:');
    console.log('  - tile-selector:', !!tileSelector);
    console.log('  - map-grid:', !!mapGrid);
    console.log('  - sprite-status:', !!spriteStatus);
    
    if (!tileSelector || !mapGrid) {
        console.error('❌ Required elements not found! Cannot initialize map editor.');
        return;
    }
    
    // Check for sprites
    await checkSprites();
    updateSpriteStatus();
    
    // Create interface
    createTileSelector();
    createMapGrid();
    
    console.log('✅ Map Editor initialized successfully!');
}

// Make functions global for button clicks
window.setMapSize = setMapSize;
window.clearMap = clearMap;
window.initializeMapEditor = initializeMapEditor;

console.log('🗺️ Simple Map Editor loaded');