// ========================================
// MAP SYNC INTEGRATION EXAMPLE
// Simple integration with existing Storyteller app
// ========================================

// Global map sync adapter instance
let globalMapSyncAdapter = null;

// Initialize map synchronization for Storyteller
async function initializeStorytellerMapSync(sessionCode, supabaseClient) {
    try {
        if (!window.MapSyncAdapter) {
            console.warn('⚠️ MapSyncAdapter not loaded');
            return false;
        }

        // Create adapter
        globalMapSyncAdapter = new MapSyncAdapter();
        
        // Initialize for storyteller
        await globalMapSyncAdapter.initialize({
            supabaseClient: supabaseClient,
            sessionCode: sessionCode,
            playerName: 'Storyteller',
            isStoryteller: true
        });

        // Set up event handlers
        globalMapSyncAdapter.setEventHandlers(
            null, // onMapReceived (not used for storyteller)
            (mapName, mapData) => {
                console.log(`✅ Map "${mapName}" shared successfully`);
                if (typeof showNotification === 'function') {
                    showNotification(`Map "${mapName}" shared with players`, 'success');
                }
            },
            (playerName, x, y) => {
                console.log(`👤 ${playerName} moved to (${x}, ${y})`);
                // Update any visual indicators in the Storyteller UI
                updatePlayerPositionDisplay(playerName, x, y);
            },
            (category, type, error) => {
                console.error(`❌ Map sync error (${category}/${type}):`, error);
                if (typeof showNotification === 'function') {
                    showNotification(`Map sync error: ${error.message}`, 'error');
                }
            }
        );

        // Integrate with existing systems
        globalMapSyncAdapter.integrateWithMapSharing();
        
        console.log('✅ Storyteller map synchronization initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize storyteller map sync:', error);
        return false;
    }
}

// Enhanced map sharing function that uses both old and new systems
function enhancedShareMapWithPlayers() {
    // Call original map sharing if available
    if (typeof shareMapWithPlayers === 'function') {
        shareMapWithPlayers();
    }

    // Also share via new sync system
    if (globalMapSyncAdapter && window.currentMap) {
        globalMapSyncAdapter.shareMap(
            window.currentMap, 
            window.currentMap.name || 'Shared Map',
            {
                allowPlayerMovement: true,
                showPlayerPositions: true,
                gridSize: 20
            }
        ).then(result => {
            if (result.success) {
                console.log('✅ Map also shared via sync system');
            } else {
                console.warn('⚠️ Failed to share via sync system:', result.error);
            }
        }).catch(error => {
            console.error('❌ Sync system share error:', error);
        });
    }
}

// Update player position display (placeholder - adapt to your UI)
function updatePlayerPositionDisplay(playerName, x, y) {
    // Example implementation - adapt to your UI
    const statusArea = document.getElementById('player-status') || 
                      document.getElementById('chat-messages');
    
    if (statusArea) {
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] 📍 ${playerName} → (${x}, ${y})`;
        
        // Add to chat or status display
        if (typeof addChatMessage === 'function') {
            addChatMessage(message, 'system');
        } else {
            console.log(message);
        }
    }
}

// Wrapper function to stop map sharing
function stopMapSharing() {
    if (globalMapSyncAdapter) {
        globalMapSyncAdapter.stopSharingMap().then(result => {
            if (result.success) {
                console.log('✅ Map sharing stopped');
                if (typeof showNotification === 'function') {
                    showNotification('Map sharing stopped', 'info');
                }
            }
        });
    }
}

// Get current player positions
function getCurrentPlayerPositions() {
    if (globalMapSyncAdapter) {
        return globalMapSyncAdapter.getPlayerPositions();
    }
    return {};
}

// Update map settings
async function updateSharedMapSettings(settings) {
    if (globalMapSyncAdapter) {
        const result = await globalMapSyncAdapter.updateMapSettings(settings);
        if (result.success) {
            console.log('✅ Map settings updated:', settings);
            if (typeof showNotification === 'function') {
                showNotification('Map settings updated', 'success');
            }
        }
        return result;
    }
    return { success: false, error: 'Map sync not initialized' };
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.mapSync = {
        initialize: initializeStorytellerMapSync,
        shareMap: enhancedShareMapWithPlayers,
        stopSharing: stopMapSharing,
        getPlayerPositions: getCurrentPlayerPositions,
        updateSettings: updateSharedMapSettings,
        getAdapter: () => globalMapSyncAdapter
    };
}