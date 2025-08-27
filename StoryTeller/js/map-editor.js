// ========================================
// MAP EDITOR - Modal Version
// Based on StoryTeller.mobile.old with Michelle's sprites
// ========================================

// ========================================
// TILE DEFINITIONS
// ========================================
const tileOptions = [
    // Terrain with Michelle's sprites
    { type: "sprite", value: "mountain", name: "Mountain", category: "terrain", emoji: "🏔️" },
    { type: "sprite", value: "water", name: "Water", category: "terrain", emoji: "🌊" },
    { type: "sprite", value: "grass", name: "Grass", category: "terrain", emoji: "🌿" },
    { type: "sprite", value: "rock", name: "Rock", category: "terrain", emoji: "🪨" },
    
    // Buildings with Michelle's sprites
    { type: "sprite", value: "castle", name: "Castle", category: "buildings", emoji: "🏰" },
    { type: "sprite", value: "house", name: "House", category: "buildings", emoji: "🏠" },
    { type: "sprite", value: "shop", name: "Shop", category: "buildings", emoji: "🏪" },
    { type: "sprite", value: "temple", name: "Temple", category: "buildings", emoji: "🏛️" },
    
    // RPG Elements with Michelle's sprites
    { type: "sprite", value: "dragon", name: "Dragon", category: "monsters", emoji: "🐉" },
    { type: "sprite", value: "sword", name: "Sword", category: "items", emoji: "⚔️" },
    { type: "sprite", value: "skull", name: "Skull", category: "hazards", emoji: "💀" },
    { type: "sprite", value: "danger", name: "Danger", category: "hazards", emoji: "⚠️" },
    
    // Special with Michelle's sprites
    { type: "sprite", value: "tower", name: "Tower", category: "buildings", emoji: "🗼" },
    { type: "sprite", value: "road", name: "Road", category: "paths", emoji: "🛣️" },
    { type: "sprite", value: "door", name: "Door", category: "features", emoji: "🚪" },
    { type: "sprite", value: "fire", name: "Fire", category: "hazards", emoji: "🔥" },
    
    // Tools (always emoji)
    { type: "player", value: "👤", name: "Player", category: "tokens", emoji: "👤" },
    { type: "clear", value: "", name: "Clear", category: "tools", emoji: "❌" }
];

// ========================================
// MAP STATE
// ========================================
let currentMap = {
    size: 15,
    mapData: [],
    playerLayer: [],
    name: "Untitled Map",
    type: "dungeon"
};

let currentSelection = tileOptions[0];
let isDragging = false;
let spritesEnabled = false;

// ========================================
// TILESET SYSTEM
// ========================================
let currentTileset = 'default';
let availableTilesets = [];
let tilesetData = null;

async function loadAvailableTilesets() {
    // Try to load known tilesets
    const knownTilesets = ['default', 'forest'];
    availableTilesets = {};
    
    for (const tileset of knownTilesets) {
        try {
            // Check if both PNG and JSON exist by trying to load the JSON
            const response = await fetch(`assets/${tileset}.json`);
            if (response.ok) {
                const config = await response.json();
                availableTilesets[tileset] = config;
                console.log(`✅ Found tileset: ${tileset}`);
            }
        } catch (error) {
            console.log(`⚠️ Tileset ${tileset} not available`);
        }
    }
    
    // Load custom tilesets from IndexedDB
    await loadCustomTilesetsOnInit();
    
    // Ensure default is always available as fallback
    if (!availableTilesets.default) {
        availableTilesets.default = {
            name: "Default",
            description: "Default dungeon tileset",
            backgroundColors: {},
            sprites: {}
        };
    }
    
    console.log('📁 Available tilesets:', Object.keys(availableTilesets));
    return availableTilesets;
}

async function loadTilesetData(tilesetName) {
    try {
        // Check if it's a custom tileset first
        if (availableTilesets[tilesetName] && availableTilesets[tilesetName].imageUrl) {
            // Custom tileset from IndexedDB
            tilesetData = availableTilesets[tilesetName];
            console.log(`✅ Loaded custom tileset data: ${tilesetData.name}`);
            return tilesetData;
        } else {
            // Regular tileset from assets folder
            const response = await fetch(`assets/${tilesetName}.json`);
            tilesetData = await response.json();
            console.log(`✅ Loaded tileset data: ${tilesetData.name}`);
            return tilesetData;
        }
    } catch (error) {
        console.error(`❌ Failed to load tileset data for ${tilesetName}:`, error);
        return null;
    }
}

async function switchTileset(tilesetName) {
    currentTileset = tilesetName;
    
    // Load tileset data
    await loadTilesetData(tilesetName);
    
    // Remove any existing tileset styles to prevent conflicts
    const existingStyles = document.querySelectorAll('style[data-tileset-style]');
    existingStyles.forEach(style => style.remove());
    
    // Update CSS to use new sprite sheet
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-tileset-style', 'true'); // Mark for easy removal
    const imageUrl = (tilesetData && tilesetData.imageUrl) ? 
        tilesetData.imageUrl : 
        `../assets/${tilesetName}.png`;
    styleElement.textContent = `.sprite { background-image: url('${imageUrl}') !important; }`;
    document.head.appendChild(styleElement);
    
    console.log(`🎨 Updated sprite CSS to use: ${imageUrl}`);
    
    // Update tile selector
    const modal = document.getElementById('map-editor-modal');
    if (modal && modal.style.display === 'flex') {
        createModalTileSelector();
        resizeModalMap();
    }
    
    console.log(`🔄 Switched to tileset: ${tilesetName}`);
}

// ========================================
// MODAL MANAGEMENT
// ========================================
function openMapModal() {
    console.log('🗺️ openMapModal called!');
    
    const modal = document.getElementById('map-editor-modal');
    if (modal) {
        modal.remove();
    }
    
    // Create a new full-screen modal from scratch
    const newModal = document.createElement('div');
    newModal.id = 'map-editor-modal';
    newModal.className = 'map-editor-modal';
    newModal.onclick = function(event) { closeMapModal(event); };
    
    newModal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important;
        z-index: 999999 !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        padding: 20px !important;
        box-sizing: border-box !important;
    `;
    
    newModal.innerHTML = `
        <div class="modal-content map-editor-modal-content" onclick="event.stopPropagation()" style="
            background: var(--bg-primary, #ffffff) !important;
            border: 2px solid var(--border-color, #ccc) !important;
            width: 98vw !important;
            height: 95vh !important;
            display: flex !important;
            flex-direction: column !important;
            visibility: visible !important;
            opacity: 1 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        ">
            <!-- Modal Header -->
            <div class="modal-header" style="
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 16px 24px !important;
                background: var(--bg-secondary, #f8f9fa) !important;
                border-bottom: 2px solid var(--border-color, #ccc) !important;
                min-height: 60px !important;
            ">
                <h2 style="margin: 0 !important; color: var(--text-primary, #333) !important; font-size: 1.5rem !important;">🗺️ Map Editor</h2>
                <div style="display: flex !important; align-items: center !important; gap: 16px !important;">
                    <div class="tileset-dropdown">
                        <select id="tileset-selector" onchange="switchTileset(this.value)">
                            <option value="default">Default Tileset</option>
                        </select>
                    </div>
                    <button class="import-tileset-btn" onclick="importCustomTileset()">
                        📁 Import Tileset
                    </button>
                    <input type="file" class="import-tileset-input" id="tileset-file-input" accept=".png,.json" multiple onchange="handleTilesetFiles(this.files)">
                    <div id="modal-sprite-status" style="
                        padding: 4px 8px !important;
                        background: #28a745 !important;
                        color: white !important;
                        border-radius: 4px !important;
                        font-size: 0.8rem !important;
                    ">Sprites Ready</div>
                    <button onclick="closeMapModal()" style="
                        background: #dc3545 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 12px !important;
                        font-size: 18px !important;
                        border-radius: 4px !important;
                        cursor: pointer !important;
                        width: 32px !important;
                        height: 32px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">×</button>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="modal-body" style="
                flex: 1 !important;
                display: flex !important;
                padding: 16px !important;
                gap: 16px !important;
                overflow: hidden !important;
            ">
                <!-- Left Panel - Controls -->
                <div style="
                    width: 300px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 16px !important;
                    overflow-y: auto !important;
                ">
                    <!-- Map Size Controls -->
                    <div style="
                        background: var(--bg-secondary, #f8f9fa) !important;
                        padding: 16px !important;
                        border-radius: 8px !important;
                        border: 1px solid var(--border-color, #ccc) !important;
                    ">
                        <h4 style="margin: 0 0 12px 0 !important; color: var(--text-primary, #333) !important;">Map Size:</h4>
                        <div style="display: flex !important; gap: 8px !important; flex-wrap: wrap !important;">
                            <button class="size-btn" data-size="small" onclick="setMapSize('small')" style="
                                padding: 8px 12px !important;
                                background: #007bff !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">10×10</button>
                            <button class="size-btn active" data-size="medium" onclick="setMapSize('medium')" style="
                                padding: 8px 12px !important;
                                background: #28a745 !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">15×15</button>
                            <button class="size-btn" data-size="large" onclick="setMapSize('large')" style="
                                padding: 8px 12px !important;
                                background: #007bff !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 4px !important;
                                cursor: pointer !important;
                                font-size: 0.9rem !important;
                            ">20×20</button>
                        </div>
                        <button onclick="clearMap()" style="
                            margin-top: 12px !important;
                            padding: 8px 16px !important;
                            background: #ffc107 !important;
                            color: #000 !important;
                            border: none !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            width: 100% !important;
                        ">🗑️ Clear Map</button>
                    </div>
                    
                    <!-- Tile Selector -->
                    <div style="
                        background: var(--bg-secondary, #f8f9fa) !important;
                        padding: 16px !important;
                        border-radius: 8px !important;
                        border: 1px solid var(--border-color, #ccc) !important;
                        flex: 1 !important;
                    ">
                        <h4 style="margin: 0 0 12px 0 !important; color: var(--text-primary, #333) !important;">Select Tile:</h4>
                        <div id="modal-tile-selector" style="
                            display: grid !important;
                            grid-template-columns: repeat(3, 1fr) !important;
                            gap: 4px !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        "></div>
                    </div>
                </div>
                
                <!-- Right Panel - Map Grid -->
                <div style="
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    background: var(--bg-secondary, #f8f9fa) !important;
                    border-radius: 8px !important;
                    border: 1px solid var(--border-color, #ccc) !important;
                    padding: 16px !important;
                ">
                    <div style="
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        margin-bottom: 16px !important;
                    ">
                        <input type="text" id="modal-map-name" placeholder="Enter map name..." value="Untitled Map" style="
                            padding: 8px 12px !important;
                            border: 1px solid var(--border-color, #ccc) !important;
                            border-radius: 4px !important;
                            font-size: 14px !important;
                            background: white !important;
                            flex: 1 !important;
                            margin-right: 12px !important;
                        ">
                        <button onclick="saveMapAsFile()" style="
                            padding: 8px 16px !important;
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                        ">💾 Save Map</button>
                    </div>
                    
                    <div style="
                        flex: 1 !important;
                        overflow: auto !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">
                        <div id="modal-map-grid" style="
                            display: grid !important;
                            gap: 1px !important;
                            background: #ddd !important;
                            padding: 1px !important;
                            border-radius: 4px !important;
                        "></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(newModal);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Full-screen map editor modal created');
    
    // Initialize the map editor components
    initializeModalMapEditor();
}

function closeMapModal(event) {
    // If clicking on modal content, don't close
    if (event && event.target !== event.currentTarget) return;
    
    console.log('❌ closeMapModal called!');
    
    const modal = document.getElementById('map-editor-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        console.log('✅ Modal hidden');
    }
}

// ========================================
// SPRITE SYSTEM
// ========================================
async function checkSprites() {
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            
            // Use custom tileset URL if available, otherwise default to assets folder
            const imageUrl = (tilesetData && tilesetData.imageUrl) ? 
                tilesetData.imageUrl : 
                `assets/${currentTileset}.png`;
            img.src = imageUrl;
        });
        spritesEnabled = true;
        console.log(`✅ Sprites loaded successfully: ${currentTileset}`);
        return true;
    } catch (error) {
        spritesEnabled = false;
        console.log(`❌ Sprites not found for ${currentTileset}, using emoji fallback`);
        return false;
    }
}

function updateSpriteStatus() {
    const statusElement = document.getElementById('modal-sprite-status');
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
// MAP INITIALIZATION
// ========================================
async function initializeModalMapEditor() {
    console.log('🗺️ Initializing Modal Map Editor...');
    
    // Load available tilesets and populate dropdown
    await loadAvailableTilesets();
    populateTilesetDropdown();
    
    // Load current tileset data
    await loadTilesetData(currentTileset);
    
    // Check for sprites first
    await checkSprites();
    updateSpriteStatus();
    
    // Initialize components
    createModalTileSelector();
    resizeModalMap();
    
    console.log('✅ Modal Map editor initialized successfully!');
}

function populateTilesetDropdown() {
    const dropdown = document.getElementById('tileset-selector');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    for (const [tilesetKey, tilesetConfig] of Object.entries(availableTilesets)) {
        const option = document.createElement('option');
        option.value = tilesetKey;
        option.textContent = tilesetConfig.name || (tilesetKey.charAt(0).toUpperCase() + tilesetKey.slice(1) + ' Tileset');
        if (tilesetKey === currentTileset) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    }
}

function createModalTileSelector() {
    const selector = document.getElementById('modal-tile-selector');
    if (!selector) {
        console.error('❌ modal-tile-selector element not found!');
        return;
    }
    
    selector.innerHTML = '';
    
    tileOptions.forEach((opt, i) => {
        const tile = document.createElement('div');
        tile.className = 'selector-tile';
        if (i === 0) tile.classList.add('selected');
        
        // Create tile display
        if (opt.type === "sprite" && spritesEnabled) {
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${opt.value}`;
            
            // Apply background color from tileset data
            if (tilesetData && tilesetData.backgroundColors && tilesetData.backgroundColors[opt.value]) {
                tile.style.backgroundColor = tilesetData.backgroundColors[opt.value];
            }
            
            tile.appendChild(spriteDiv);
        } else if (opt.type === "player") {
            const player = document.createElement('div');
            player.classList.add('player-icon');
            player.textContent = opt.value;
            tile.appendChild(player);
        } else if (opt.type === "clear") {
            tile.innerHTML = '🗑️';
            tile.style.background = 'var(--danger)';
        } else {
            // Fallback to emoji
            tile.textContent = opt.emoji || opt.value;
        }
        
        tile.title = opt.name;
        tile.onclick = () => selectTile(opt, tile);
        
        selector.appendChild(tile);
    });
    
    console.log(`✅ Created ${tileOptions.length} modal selector tiles`);
}

function selectTile(option, element) {
    document.querySelectorAll('.selector-tile').forEach(t => t.classList.remove('selected'));
    element.classList.add('selected');
    currentSelection = option;
    
    console.log(`Selected tile: ${option.name}`);
}

// ========================================
// MAP GRID MANAGEMENT
// ========================================
function resizeModalMap() {
    const size = currentMap.size;
    const totalTiles = size * size;
    
    // Resize data arrays
    currentMap.mapData = Array(totalTiles).fill(null);
    currentMap.playerLayer = Array(totalTiles).fill(null);
    
    // Update grid
    const grid = document.getElementById('modal-map-grid');
    if (!grid) {
        console.error('❌ modal-map-grid element not found!');
        return;
    }
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    
    // Create tiles
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'map-tile';
        tile.dataset.idx = i;
        
        // Mouse events for drawing
        tile.addEventListener('mousedown', () => {
            isDragging = true;
            placeTile(i);
        });
        
        tile.addEventListener('mouseenter', () => {
            if (isDragging) placeTile(i);
        });
        
        tile.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        renderTile(tile, null, null);
        grid.appendChild(tile);
    }
    
    // Global mouse up to stop dragging
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    console.log(`✅ Created ${size}x${size} modal map grid (${totalTiles} tiles)`);
}

function placeTile(index) {
    const tile = document.querySelector(`[data-idx="${index}"]`);
    
    if (currentSelection.type === "clear") {
        currentMap.mapData[index] = null;
        currentMap.playerLayer[index] = null;
    } else if (currentSelection.type === "player") {
        currentMap.playerLayer[index] = currentSelection;
    } else {
        currentMap.mapData[index] = currentSelection;
        currentMap.playerLayer[index] = null; // Clear player when placing terrain
    }
    
    renderTile(tile, currentMap.mapData[index], currentMap.playerLayer[index]);
}

function renderTile(tile, mapData, playerData) {
    tile.innerHTML = '';
    tile.className = 'map-tile';
    
    // Render map data (terrain/buildings)
    if (mapData) {
        if (mapData.type === "sprite" && spritesEnabled) {
            const spriteDiv = document.createElement('div');
            spriteDiv.className = `sprite ${mapData.value}`;
            
            // Apply background color to the sprite div, not the tile container
            if (tilesetData && tilesetData.backgroundColors && tilesetData.backgroundColors[mapData.value]) {
                spriteDiv.style.backgroundColor = tilesetData.backgroundColors[mapData.value];
            }
            
            tile.appendChild(spriteDiv);
        } else {
            // Fallback to emoji
            tile.textContent = mapData.emoji || mapData.value;
        }
    } else {
        // Clear background color when no map data (erase tool)
        // Clear both tile and any existing sprite background colors
        tile.style.backgroundColor = '';
        const sprites = tile.querySelectorAll('.sprite');
        sprites.forEach(sprite => sprite.style.backgroundColor = '');
    }
    
    // Render player data (overlay)
    if (playerData) {
        const player = document.createElement('div');
        player.classList.add('player-overlay');
        player.textContent = playerData.value;
        tile.appendChild(player);
    }
}

// ========================================
// MAP CONTROLS
// ========================================
function setMapSize(size) {
    const sizeMap = { small: 10, medium: 15, large: 20 };
    currentMap.size = sizeMap[size] || 15;
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
    
    resizeModalMap();
    console.log(`Map size set to ${currentMap.size}x${currentMap.size}`);
}

function clearMap() {
    currentMap.mapData.fill(null);
    currentMap.playerLayer.fill(null);
    
    document.querySelectorAll('.map-tile').forEach(tile => {
        renderTile(tile, null, null);
    });
    
    console.log('Map cleared');
}

// ========================================
// FILE OPERATIONS
// ========================================
function saveMapAsFile() {
    const mapName = document.getElementById('modal-map-name').value || 'untitled-map';
    currentMap.name = mapName;
    
    // Create map data structure
    const mapData = {
        name: currentMap.name,
        size: currentMap.size,
        type: currentMap.type,
        created: new Date().toISOString(),
        mapData: currentMap.mapData,
        playerLayer: currentMap.playerLayer,
        version: "1.0"
    };
    
    // Create and download file
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    link.click();
    
    console.log(`💾 Saved map: ${mapName}`);
    
    // Update current map display in panel
    updateCurrentMapDisplay(mapData);
}

function updateCurrentMapDisplay(mapData) {
    const display = document.getElementById('current-map-display');
    if (display) {
        const placedTiles = mapData.mapData.filter(t => t !== null).length + 
                           mapData.playerLayer.filter(t => t !== null).length;
        
        display.innerHTML = `
            <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">${mapData.name}</h4>
            <p style="margin: 0; color: var(--text-secondary);">
                ${mapData.size}×${mapData.size} grid • ${placedTiles} tiles placed<br>
                Created: ${new Date(mapData.created).toLocaleDateString()}
            </p>
        `;
    }
}

// ========================================
// PANEL INTEGRATION
// ========================================
function initializeMapEditor() {
    console.log('🗺️ Map editor panel initialization started...');
    
    // Set up the "Open Map Editor" button
    setTimeout(() => {
        const openButton = document.getElementById('open-map-modal');
        console.log('🔍 Looking for open-map-modal button:', !!openButton);
        
        if (openButton) {
            openButton.onclick = openMapModal;
            console.log('✅ Map editor panel button initialized');
        } else {
            console.error('❌ open-map-modal button not found!');
        }
        
        // Set up modal close button
        const closeButton = document.getElementById('close-map-modal');
        console.log('🔍 Looking for close-map-modal button:', !!closeButton);
        
        if (closeButton) {
            closeButton.onclick = closeMapModal;
            console.log('✅ Close button initialized');
        }
        
        // Check if modal exists
        const modal = document.getElementById('map-editor-modal');
        console.log('🔍 Looking for map-editor-modal:', !!modal);
        
    }, 500); // Increased delay to ensure DOM is ready
}

// ========================================
// CUSTOM TILESET IMPORT SYSTEM
// ========================================

// IndexedDB setup for storing custom tilesets
let tilesetDB;

function initTilesetDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MapEditorTilesets', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            tilesetDB = request.result;
            resolve(tilesetDB);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('tilesets')) {
                const store = db.createObjectStore('tilesets', { keyPath: 'name' });
                store.createIndex('name', 'name', { unique: true });
            }
        };
    });
}

function saveCustomTileset(name, imageBlob, configData) {
    return new Promise((resolve, reject) => {
        if (!tilesetDB) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = tilesetDB.transaction(['tilesets'], 'readwrite');
        const store = transaction.objectStore('tilesets');
        
        const tilesetData = {
            name: name,
            image: imageBlob,
            config: configData,
            dateAdded: new Date().toISOString()
        };
        
        const request = store.put(tilesetData);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(tilesetData);
    });
}

function loadCustomTilesets() {
    return new Promise((resolve, reject) => {
        if (!tilesetDB) {
            resolve([]);
            return;
        }
        
        const transaction = tilesetDB.transaction(['tilesets'], 'readonly');
        const store = transaction.objectStore('tilesets');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

function importCustomTileset() {
    const fileInput = document.getElementById('tileset-file-input');
    fileInput.click();
}

async function handleTilesetFiles(files) {
    if (!files || files.length === 0) return;
    
    try {
        // Initialize DB if needed
        if (!tilesetDB) {
            await initTilesetDB();
        }
        
        let pngFile = null;
        let jsonFile = null;
        
        // Find PNG and JSON files
        for (const file of files) {
            if (file.type === 'image/png') {
                pngFile = file;
            } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                jsonFile = file;
            }
        }
        
        if (!pngFile) {
            alert('Please select a PNG image file for the tileset.');
            return;
        }
        
        // Generate tileset name from PNG filename
        const tilesetName = pngFile.name.replace('.png', '');
        
        let configData = null;
        if (jsonFile) {
            // Read JSON config
            const jsonText = await readFileAsText(jsonFile);
            try {
                configData = JSON.parse(jsonText);
            } catch (e) {
                console.warn('Invalid JSON config file, using default sprite layout');
            }
        }
        
        // If no JSON config, create a default one
        if (!configData) {
            configData = generateDefaultTilesetConfig(tilesetName);
        }
        
        // Save to IndexedDB
        await saveCustomTileset(tilesetName, pngFile, configData);
        
        // Add to available tilesets
        availableTilesets[tilesetName] = configData;
        
        // Update dropdown
        populateTilesetDropdown();
        
        // Switch to the new tileset
        await switchTileset(tilesetName);
        
        console.log(`✅ Custom tileset "${tilesetName}" imported successfully`);
        
        // Show success message
        const statusDiv = document.getElementById('modal-sprite-status');
        if (statusDiv) {
            const originalText = statusDiv.textContent;
            statusDiv.textContent = 'Tileset Imported!';
            statusDiv.style.background = '#28a745';
            setTimeout(() => {
                statusDiv.textContent = originalText;
                statusDiv.style.background = '#28a745';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error importing tileset:', error);
        alert('Error importing tileset: ' + error.message);
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function generateDefaultTilesetConfig(name) {
    return {
        name: name,
        description: "Custom imported tileset",
        backgroundColors: {},
        sprites: {}
    };
}

// Load custom tilesets on initialization
async function loadCustomTilesetsOnInit() {
    try {
        await initTilesetDB();
        const customTilesets = await loadCustomTilesets();
        
        for (const tileset of customTilesets) {
            // Create blob URL for the image
            const imageUrl = URL.createObjectURL(tileset.image);
            
            // Add to available tilesets with the blob URL
            availableTilesets[tileset.name] = {
                ...tileset.config,
                imageUrl: imageUrl
            };
        }
        
        console.log(`📁 Loaded ${customTilesets.length} custom tilesets from storage`);
    } catch (error) {
        console.warn('Could not load custom tilesets:', error);
    }
}

// ========================================
// GLOBAL FUNCTIONS
// ========================================
window.openMapModal = openMapModal;
window.closeMapModal = closeMapModal;
window.setMapSize = setMapSize;
window.clearMap = clearMap;
window.saveMapAsFile = saveMapAsFile;
window.initializeMapEditor = initializeMapEditor;
window.importCustomTileset = importCustomTileset;
window.handleTilesetFiles = handleTilesetFiles;

console.log('🗺️ Map Editor loaded (modal version)');