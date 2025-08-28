// ========================================
// MAP SYNC MANAGER MODULE
// Storyteller-side map sharing with real-time synchronization
// ========================================

class MapSyncManager {
    constructor() {
        this.supabaseClient = null;
        this.currentSession = null;
        this.currentSharedMap = null;
        this.playerPositions = new Map(); // playerId -> {x, y, timestamp}
        this.positionSubscription = null;
        this.mapSubscription = null;
        
        // Event callbacks
        this.onPlayerPositionUpdate = null;
        this.onMapSyncError = null;
        this.onMapShareSuccess = null;
        
        console.log('🗺️ MapSyncManager initialized');
    }

    // Initialize with Supabase client
    initialize(supabaseClient, sessionCode) {
        console.log('🔍 MapSyncManager.initialize called with:', {
            'supabaseClient type': typeof supabaseClient,
            'has from method': typeof supabaseClient?.from === 'function',
            'has auth property': !!supabaseClient?.auth,
            'sessionCode': sessionCode
        });
        
        if (!supabaseClient) {
            throw new Error('Supabase client is required');
        }
        
        // More flexible validation - check for either from() method or auth property
        if (typeof supabaseClient.from !== 'function' && !supabaseClient.auth) {
            console.error('❌ Invalid Supabase client - missing from() method and auth property');
            throw new Error('Valid Supabase client required - must have from() method or auth property');
        }
        
        this.supabaseClient = supabaseClient;
        this.currentSession = sessionCode;
        
        console.log('✅ MapSyncManager connected to session:', sessionCode);
        return this;
    }

    // Set event handlers
    setEventHandlers(onPlayerPositionUpdate, onMapSyncError, onMapShareSuccess) {
        this.onPlayerPositionUpdate = onPlayerPositionUpdate;
        this.onMapSyncError = onMapSyncError;
        this.onMapShareSuccess = onMapShareSuccess;
    }

    // Share a map with all players in the session
    async shareMap(mapData, mapName = 'Shared Map', options = {}) {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapSyncManager not properly initialized');
            }

            // Prepare map data for sharing
            const sharedMapData = this.prepareMapForSharing(mapData, mapName, options);
            
            // Store in database
            const { data, error } = await this.supabaseClient.getClient()
                .from('shared_maps')
                .upsert({
                    session_code: this.currentSession,
                    map_name: mapName,
                    map_data: sharedMapData,
                    shared_at: new Date().toISOString(),
                    map_settings: options
                }, {
                    onConflict: 'session_code'
                });

            if (error) throw error;

            // Send real-time notification to players
            await this.notifyPlayersMapUpdate(sharedMapData, mapName);
            
            this.currentSharedMap = sharedMapData;
            
            if (this.onMapShareSuccess) {
                this.onMapShareSuccess(mapName, sharedMapData);
            }
            
            console.log('✅ Map shared successfully:', mapName);
            return { success: true, data: sharedMapData };
            
        } catch (error) {
            console.error('❌ Failed to share map:', error);
            if (this.onMapSyncError) {
                this.onMapSyncError('share', error);
            }
            return { success: false, error: error.message };
        }
    }

    // Prepare map data in standardized format
    prepareMapForSharing(mapData, mapName, options) {
        let standardizedMap = {
            name: mapName,
            timestamp: new Date().toISOString(),
            version: '1.0',
            type: 'shared_map',
            settings: {
                allowPlayerMovement: options.allowPlayerMovement !== false,
                showPlayerPositions: options.showPlayerPositions !== false,
                gridSize: options.gridSize || 20,
                ...options
            }
        };

        // Handle different map data formats
        if (mapData.grid && mapData.tileset) {
            // New format from maps manager
            standardizedMap.grid = mapData.grid;
            standardizedMap.tileset = mapData.tileset || 'default';
            standardizedMap.size = mapData.size || mapData.grid.length;
        } else if (mapData.mapData && mapData.size) {
            // Legacy format from map-sharing.js
            standardizedMap.mapData = mapData.mapData;
            standardizedMap.size = mapData.size;
            standardizedMap.type = mapData.type || 'legacy';
            standardizedMap.playerLayer = mapData.playerLayer || [];
        } else if (Array.isArray(mapData)) {
            // Raw grid array
            standardizedMap.grid = mapData;
            standardizedMap.size = mapData.length;
            standardizedMap.tileset = 'default';
        } else {
            throw new Error('Unsupported map data format');
        }

        return standardizedMap;
    }

    // Send real-time notification to players about map update
    async notifyPlayersMapUpdate(mapData, mapName) {
        try {
            await this.supabaseClient.sendMessage(
                this.currentSession,
                'Storyteller',
                `MAP_SYNC:${JSON.stringify({
                    action: 'map_shared',
                    mapName: mapName,
                    timestamp: new Date().toISOString()
                })}`,
                'map_sync',
                true
            );
            
            console.log('📡 Map update notification sent to players');
        } catch (error) {
            console.warn('⚠️ Failed to send map notification:', error);
        }
    }

    // Subscribe to player position updates
    async subscribeToPlayerPositions() {
        try {
            if (!this.supabaseClient || !this.currentSession) {
                throw new Error('MapSyncManager not initialized');
            }

            this.positionSubscription = this.supabaseClient.getClient()
                .from('player_positions')
                .on('*', (payload) => {
                    this.handlePlayerPositionUpdate(payload);
                })
                .subscribe();

            console.log('👥 Subscribed to player position updates');
            return true;
        } catch (error) {
            console.error('❌ Failed to subscribe to player positions:', error);
            if (this.onMapSyncError) {
                this.onMapSyncError('position_subscription', error);
            }
            return false;
        }
    }

    // Handle incoming player position updates
    handlePlayerPositionUpdate(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const position = newRecord;
                if (position.session_code === this.currentSession) {
                    this.playerPositions.set(position.player_name, {
                        x: position.x,
                        y: position.y,
                        timestamp: position.updated_at
                    });

                    if (this.onPlayerPositionUpdate) {
                        this.onPlayerPositionUpdate(position.player_name, position.x, position.y);
                    }

                    console.log(`📍 Player ${position.player_name} moved to (${position.x}, ${position.y})`);
                }
            }
        } catch (error) {
            console.error('❌ Error processing player position update:', error);
        }
    }

    // Get current player positions
    getPlayerPositions() {
        return Object.fromEntries(this.playerPositions);
    }

    // Clear a player's position (when they disconnect)
    clearPlayerPosition(playerName) {
        this.playerPositions.delete(playerName);
        console.log(`🚪 Cleared position for player: ${playerName}`);
    }

    // Update map settings (grid size, permissions, etc.)
    async updateMapSettings(newSettings) {
        try {
            if (!this.currentSharedMap) {
                throw new Error('No map currently shared');
            }

            this.currentSharedMap.settings = {
                ...this.currentSharedMap.settings,
                ...newSettings
            };

            // Update in database
            await this.supabaseClient.getClient()
                .from('shared_maps')
                .update({ 
                    map_settings: this.currentSharedMap.settings,
                    updated_at: new Date().toISOString()
                })
                .eq('session_code', this.currentSession);

            // Notify players
            await this.notifyPlayersMapUpdate(this.currentSharedMap, this.currentSharedMap.name);
            
            console.log('⚙️ Map settings updated:', newSettings);
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to update map settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Stop sharing the current map
    async stopSharingMap() {
        try {
            if (!this.currentSession) {
                return { success: true, message: 'No session active' };
            }

            // Remove from database
            await this.supabaseClient.getClient()
                .from('shared_maps')
                .delete()
                .eq('session_code', this.currentSession);

            // Notify players
            await this.supabaseClient.sendMessage(
                this.currentSession,
                'Storyteller',
                'MAP_SYNC:{"action":"map_removed"}',
                'map_sync',
                true
            );

            this.currentSharedMap = null;
            this.playerPositions.clear();

            console.log('🛑 Stopped sharing map');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to stop sharing map:', error);
            return { success: false, error: error.message };
        }
    }

    // Cleanup subscriptions
    cleanup() {
        if (this.positionSubscription) {
            this.positionSubscription.unsubscribe();
            this.positionSubscription = null;
        }
        
        if (this.mapSubscription) {
            this.mapSubscription.unsubscribe();
            this.mapSubscription = null;
        }

        this.playerPositions.clear();
        console.log('🧹 MapSyncManager cleaned up');
    }

    // Setup database tables (call once during initialization)
    async setupTables() {
        try {
            const createTablesSQL = `
            -- Shared Maps Table
            CREATE TABLE IF NOT EXISTS shared_maps (
                id SERIAL PRIMARY KEY,
                session_code VARCHAR(10) NOT NULL,
                map_name VARCHAR(200) NOT NULL,
                map_data JSONB NOT NULL,
                map_settings JSONB DEFAULT '{}',
                shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(session_code)
            );

            -- Player Positions Table
            CREATE TABLE IF NOT EXISTS player_positions (
                id SERIAL PRIMARY KEY,
                session_code VARCHAR(10) NOT NULL,
                player_name VARCHAR(100) NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(session_code, player_name)
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_shared_maps_session ON shared_maps(session_code);
            CREATE INDEX IF NOT EXISTS idx_player_positions_session ON player_positions(session_code);
            CREATE INDEX IF NOT EXISTS idx_player_positions_updated ON player_positions(updated_at);
            `;

            const { error } = await this.supabaseClient.getClient().rpc('execute_sql', { sql: createTablesSQL });
            if (error) {
                console.warn('⚠️ Could not auto-create map tables (may need manual setup):', error);
            } else {
                console.log('✅ Map synchronization tables verified/created');
            }
        } catch (error) {
            console.warn('⚠️ Could not setup map tables:', error.message);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapSyncManager;
} else {
    window.MapSyncManager = MapSyncManager;
}