// ========================================
// MAP CLIENT MANAGER MODULE
// Player-side map receiving and synchronization
// ========================================

class MapClientManager {
    constructor() {
        this.supabaseClient = null;
        this.currentSession = null;
        this.currentMap = null;
        this.mapSubscription = null;
        this.positionSubscription = null;
        this.mapContainer = null;
        this.playerPositions = new Map(); // playerId -> {x, y, element}
        this.currentPlayerPosition = { x: 0, y: 0 };
        
        // Event callbacks
        this.onMapReceived = null;
        this.onMapRemoved = null;
        this.onPlayerPositionUpdate = null;
        this.onMapError = null;
        
        console.log('🗺️ MapClientManager initialized');
    }

    // Initialize with Supabase client
    initialize(supabaseClient, sessionCode, mapContainerId) {
        // Flexible client validation - check for common Supabase methods
        const hasFromMethod = supabaseClient && typeof supabaseClient.from === 'function';
        const hasAuthProperty = supabaseClient && supabaseClient.auth;
        const hasOldIsInitialized = supabaseClient && typeof supabaseClient.isInitialized === 'function';
        
        if (!hasFromMethod && !hasAuthProperty && !hasOldIsInitialized) {
            throw new Error('Valid Supabase client required - must have .from() method or .auth property');
        }
        
        console.log('🔍 Client validation:', {
            hasFromMethod,
            hasAuthProperty, 
            hasOldIsInitialized,
            clientType: typeof supabaseClient
        });
        
        this.supabaseClient = supabaseClient;
        this.currentSession = sessionCode;
        
        // Helper method to get the actual client for database operations
        this.getDBClient = () => {
            if (this.supabaseClient.getClient && typeof this.supabaseClient.getClient === 'function') {
                return this.supabaseClient.getClient(); // Old wrapper style
            }
            return this.supabaseClient; // Direct client
        };
        
        // Get map container element
        if (mapContainerId) {
            this.mapContainer = document.getElementById(mapContainerId);
            if (!this.mapContainer) {
                console.warn(`⚠️ Map container '${mapContainerId}' not found`);
            }
        }
        
        console.log('✅ MapClientManager connected to session:', sessionCode);
        return this;
    }

    // Set event handlers
    setEventHandlers(onMapReceived, onMapRemoved, onPlayerPositionUpdate, onMapError) {
        this.onMapReceived = onMapReceived;
        this.onMapRemoved = onMapRemoved;
        this.onPlayerPositionUpdate = onPlayerPositionUpdate;
        this.onMapError = onMapError;
    }

    // Subscribe to map updates and chat messages
    async subscribeToMaps() {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapClientManager not properly initialized');
            }

            // Subscribe to map sync messages in chat
            const chatManager = this.supabaseClient.getChatManager?.() || window.globalChatManager;
            if (chatManager) {
                // Add our map sync handler to the message processing
                this.originalMessageHandler = chatManager.onMessageReceived;
                chatManager.onMessageReceived = (message) => {
                    this.handleIncomingMessage(message);
                    if (this.originalMessageHandler) {
                        this.originalMessageHandler(message);
                    }
                };
            }

            // Subscribe to shared maps table changes using new Supabase API
            this.mapSubscription = this.getDBClient()
                .channel(`map-sync-${this.currentSession}`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'shared_maps',
                        filter: `session_code=eq.${this.currentSession}`
                    }, 
                    (payload) => {
                        this.handleMapUpdate(payload);
                    }
                )
                .subscribe();

            // Subscribe to player positions using new Supabase API
            this.positionSubscription = this.getDBClient()
                .channel(`positions-${this.currentSession}`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'player_positions',
                        filter: `session_code=eq.${this.currentSession}`
                    }, 
                    (payload) => {
                        this.handlePlayerPositionUpdate(payload);
                    }
                )
                .subscribe();

            // Check for existing shared map
            await this.checkForExistingMap();

            console.log('📡 Subscribed to map updates');
            return true;
        } catch (error) {
            console.error('❌ Failed to subscribe to maps:', error);
            if (this.onMapError) {
                this.onMapError('subscription', error);
            }
            return false;
        }
    }

    // Handle incoming chat messages for map sync
    handleIncomingMessage(message) {
        try {
            if (message.message_type === 'map_sync' || 
                (message.message_text && message.message_text.startsWith('MAP_SYNC:'))) {
                
                let syncData;
                if (message.message_text.startsWith('MAP_SYNC:')) {
                    syncData = JSON.parse(message.message_text.substring(9));
                } else {
                    syncData = message.sync_data || message;
                }

                if (syncData.action === 'map_shared') {
                    console.log('📨 Received map share notification:', syncData.mapName);
                    this.checkForExistingMap(); // Refresh map data
                } else if (syncData.action === 'map_removed') {
                    console.log('📨 Received map removal notification');
                    this.handleMapRemoved();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing map sync message:', error);
        }
    }

    // Handle map table updates
    handleMapUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                if (newRecord.session_code === this.currentSession) {
                    this.loadMap(newRecord);
                }
            } else if (eventType === 'DELETE') {
                if (oldRecord.session_code === this.currentSession) {
                    this.handleMapRemoved();
                }
            }
        } catch (error) {
            console.error('❌ Error processing map update:', error);
        }
    }

    // Check for existing shared map
    async checkForExistingMap() {
        try {
            const { data, error } = await this.getDBClient()
                .from('shared_maps')
                .select('*')
                .eq('session_code', this.currentSession)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // Not found is OK
                    throw error;
                }
                console.log('📭 No shared map found');
                return null;
            }

            if (data) {
                this.loadMap(data);
                return data;
            }
        } catch (error) {
            console.error('❌ Failed to check for existing map:', error);
            if (this.onMapError) {
                this.onMapError('load', error);
            }
        }
        return null;
    }

    // Load and display a received map
    loadMap(mapRecord) {
        try {
            this.currentMap = mapRecord.map_data;
            this.currentMap.settings = mapRecord.map_settings || {};
            
            console.log('🗺️ Loading map:', this.currentMap.name);
            
            if (this.mapContainer) {
                this.renderMap(this.currentMap);
            }
            
            if (this.onMapReceived) {
                this.onMapReceived(this.currentMap, mapRecord);
            }
            
            // Load existing player positions
            this.loadPlayerPositions();
            
        } catch (error) {
            console.error('❌ Failed to load map:', error);
            if (this.onMapError) {
                this.onMapError('render', error);
            }
        }
    }

    // Render map using CSS Grid (similar to maps-manager.js)
    renderMap(mapData) {
        if (!this.mapContainer) {
            console.warn('⚠️ No map container available for rendering');
            return;
        }

        let grid = null;
        let tileset = 'default';
        let size = 0;

        // Handle different map data formats
        if (mapData.grid) {
            // New grid format
            grid = mapData.grid;
            tileset = mapData.tileset || 'default';
            size = mapData.size || grid.length;
        } else if (mapData.mapData && mapData.size) {
            // Legacy format - convert to grid
            const legacyData = mapData.mapData;
            size = mapData.size;
            grid = [];
            
            for (let i = 0; i < size; i++) {
                grid[i] = [];
                for (let j = 0; j < size; j++) {
                    const index = i * size + j;
                    grid[i][j] = legacyData[index] || 0;
                }
            }
        } else {
            console.error('❌ Unsupported map data format');
            return;
        }

        // Create map display
        this.mapContainer.innerHTML = `
            <div class="map-client-wrapper" style="
                position: relative;
                width: 100%;
                height: 400px;
                background: var(--bg-primary, white);
                border: 2px solid var(--border-color, #ccc);
                border-radius: 8px;
                overflow: hidden;
            ">
                <div class="map-client-header" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    font-size: 0.9em;
                    z-index: 10;
                ">
                    📍 ${mapData.name || 'Shared Map'} 
                    ${mapData.settings?.allowPlayerMovement ? '(Click to move)' : '(View only)'}
                </div>
                <div class="map-client-canvas" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1);
                    transform-origin: center;
                    padding-top: 35px;
                ">
                    <div class="map-client-grid" style="
                        display: grid;
                        grid-template-columns: repeat(${size}, 1fr);
                        gap: 1px;
                        background: #ddd;
                        padding: 1px;
                        border-radius: 4px;
                    "></div>
                </div>
            </div>
        `;

        const mapGrid = this.mapContainer.querySelector('.map-client-grid');
        
        // Create tiles
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const tile = document.createElement('div');
                tile.className = 'map-tile';
                tile.dataset.x = col;
                tile.dataset.y = row;
                
                const tileData = grid[row][col];
                
                // Handle different tile data formats
                if (typeof tileData === 'object' && tileData.value) {
                    // Sprite-based tile (v1_2map.json format)
                    tile.innerHTML = `<div class="sprite ${tileData.value}" title="${tileData.name || tileData.value}"></div>`;
                    tile.style.cssText = `
                        width: 100%;
                        height: 64px;
                        aspect-ratio: 1;
                        position: relative;
                        cursor: ${mapData.settings?.allowPlayerMovement ? 'pointer' : 'default'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                } else {
                    // Simple numeric tile (legacy format)
                    tile.style.cssText = `
                        width: 100%;
                        height: 64px;
                        aspect-ratio: 1;
                        background: ${this.getTileColor(tileData)};
                        border: 1px solid rgba(0, 0, 0, 0.1);
                        position: relative;
                        cursor: ${mapData.settings?.allowPlayerMovement ? 'pointer' : 'default'};
                    `;
                }
                
                // Add click handler for player movement
                if (mapData.settings?.allowPlayerMovement) {
                    tile.addEventListener('click', () => {
                        this.movePlayerTo(col, row);
                    });
                }
                
                mapGrid.appendChild(tile);
            }
        }

        console.log('🎨 Map rendered successfully');
    }

    // Get tile color based on tile value
    getTileColor(tileValue) {
        const colors = {
            0: '#f8f9fa', // Empty/void
            1: '#6c757d', // Wall/stone
            2: '#fff3cd', // Floor/path
            3: '#d4edda', // Door/entrance
            4: '#f8d7da', // Danger/trap
            5: '#d1ecf1', // Water
            6: '#d4edda', // Grass
            7: '#e2e3e5', // Rock
            8: '#fff3cd'  // Sand
        };
        
        return colors[tileValue] || '#e9ecef';
    }

    // Move player to specified position
    async movePlayerTo(x, y) {
        try {
            if (!this.currentMap?.settings?.allowPlayerMovement) {
                console.log('🚫 Player movement not allowed on this map');
                return;
            }

            // Update local position
            this.currentPlayerPosition = { x, y };
            
            // Update visual position
            this.updatePlayerPositionVisual(window.playerName || 'Player', x, y, true);
            
            // Send to server
            await this.getDBClient()
                .from('player_positions')
                .upsert({
                    session_code: this.currentSession,
                    player_name: window.playerName || 'Player',
                    x: x,
                    y: y,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'session_code,player_name'
                });

            console.log(`🚶 Moved to position (${x}, ${y})`);
        } catch (error) {
            console.error('❌ Failed to move player:', error);
            if (this.onMapError) {
                this.onMapError('movement', error);
            }
        }
    }

    // Handle player position updates
    handlePlayerPositionUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const position = newRecord;
                if (position.session_code === this.currentSession) {
                    const isCurrentPlayer = position.player_name === (window.playerName || 'Player');
                    this.updatePlayerPositionVisual(position.player_name, position.x, position.y, isCurrentPlayer);
                    
                    if (this.onPlayerPositionUpdate) {
                        this.onPlayerPositionUpdate(position.player_name, position.x, position.y);
                    }
                }
            } else if (eventType === 'DELETE') {
                if (oldRecord.session_code === this.currentSession) {
                    this.removePlayerPositionVisual(oldRecord.player_name);
                }
            }
        } catch (error) {
            console.error('❌ Error processing player position update:', error);
        }
    }

    // Update player position visual indicator
    updatePlayerPositionVisual(playerName, x, y, isCurrentPlayer = false) {
        if (!this.mapContainer) return;
        
        const mapGrid = this.mapContainer.querySelector('.map-client-grid');
        if (!mapGrid) return;
        
        const tile = mapGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!tile) return;
        
        // Remove old position marker for this player
        const oldMarker = mapGrid.querySelector(`.player-marker[data-player="${playerName}"]`);
        if (oldMarker) {
            oldMarker.remove();
        }
        
        // Create new position marker
        const marker = document.createElement('div');
        marker.className = 'player-marker';
        marker.dataset.player = playerName;
        marker.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${isCurrentPlayer ? '#007bff' : '#28a745'};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            z-index: 5;
            pointer-events: none;
        `;
        
        // Add player name tooltip
        marker.title = playerName;
        
        tile.appendChild(marker);
        
        this.playerPositions.set(playerName, { x, y, element: marker });
    }

    // Remove player position visual
    removePlayerPositionVisual(playerName) {
        const playerData = this.playerPositions.get(playerName);
        if (playerData && playerData.element) {
            playerData.element.remove();
        }
        this.playerPositions.delete(playerName);
    }

    // Load existing player positions
    async loadPlayerPositions() {
        try {
            const { data, error } = await this.getDBClient()
                .from('player_positions')
                .select('*')
                .eq('session_code', this.currentSession);

            if (error) throw error;

            if (data && data.length > 0) {
                data.forEach(position => {
                    const isCurrentPlayer = position.player_name === (window.playerName || 'Player');
                    this.updatePlayerPositionVisual(position.player_name, position.x, position.y, isCurrentPlayer);
                });
                
                console.log(`👥 Loaded ${data.length} player positions`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load player positions:', error);
        }
    }

    // Handle map removal
    handleMapRemoved() {
        this.currentMap = null;
        this.playerPositions.clear();
        
        if (this.mapContainer) {
            this.mapContainer.innerHTML = `
                <div style="
                    padding: 40px;
                    text-align: center;
                    color: #666;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                ">
                    🗺️ No map currently shared
                    <br><small>Waiting for storyteller to share a map...</small>
                </div>
            `;
        }
        
        if (this.onMapRemoved) {
            this.onMapRemoved();
        }
        
        console.log('🗑️ Map removed');
    }

    // Get current map data
    getCurrentMap() {
        return this.currentMap;
    }

    // Get current player position
    getPlayerPosition() {
        return this.currentPlayerPosition;
    }

    // Get all player positions
    getAllPlayerPositions() {
        return Object.fromEntries(this.playerPositions);
    }

    // Cleanup subscriptions
    cleanup() {
        if (this.mapSubscription) {
            this.mapSubscription.unsubscribe();
            this.mapSubscription = null;
        }
        
        if (this.positionSubscription) {
            this.positionSubscription.unsubscribe();
            this.positionSubscription = null;
        }

        this.playerPositions.clear();
        console.log('🧹 MapClientManager cleaned up');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapClientManager;
} else {
    window.MapClientManager = MapClientManager;
}