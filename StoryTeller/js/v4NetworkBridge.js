// ========================================
// V4-NETWORK BRIDGE
// Real-time communication between V4-network and StoryTeller
// ========================================

class V4NetworkBridge {
    constructor() {
        this.isListening = false;
        this.v4Window = null;
        this.connectionStatus = 'disconnected';
        this.messageHandlers = new Map();
        
        this.setupEventListeners();
        console.log('🌉 V4NetworkBridge initialized');
    }

    /**
     * Setup cross-frame communication listeners
     */
    setupEventListeners() {
        // Listen for messages from V4-network
        window.addEventListener('message', (event) => {
            this.handleIncomingMessage(event);
        });

        // Listen for storage events (if both apps are open in same browser)
        window.addEventListener('storage', (event) => {
            this.handleStorageEvent(event);
        });
    }

    /**
     * Handle incoming messages from V4-network
     */
    handleIncomingMessage(event) {
        // Verify origin for security
        const allowedOrigins = [
            'http://localhost:8000',
            'http://localhost:3000',
            'http://127.0.0.1:8000',
            window.location.origin
        ];

        if (!allowedOrigins.includes(event.origin)) {
            console.warn('🚫 Rejected message from unauthorized origin:', event.origin);
            return;
        }

        const { type, data, source } = event.data;

        if (source !== 'v4-network') return;

        console.log('📨 Received message from V4-network:', type, data);

        switch (type) {
            case 'character-export':
                this.handleCharacterExport(data);
                break;
            case 'character-update':
                this.handleCharacterUpdate(data);
                break;
            case 'ping':
                this.sendResponse('pong', { status: 'connected' });
                break;
            case 'handshake':
                this.handleHandshake(data);
                break;
            default:
                console.warn('🤷 Unknown message type:', type);
        }
    }

    /**
     * Handle character export from V4-network
     */
    async handleCharacterExport(characterData) {
        try {
            console.log('📥 Importing character from V4-network:', characterData.name);

            // Use our CharacterImportProfile system
            if (window.CharacterImportProfile) {
                const importProfile = new window.CharacterImportProfile();
                const normalized = importProfile.normalizeCharacter(characterData);
                
                // Import to StoryTeller
                if (window.storyTellerPlayersPanel) {
                    const success = window.storyTellerPlayersPanel.importCharacter(normalized);
                    
                    if (success) {
                        this.showImportNotification(normalized);
                        this.sendResponse('import-success', { 
                            characterId: normalized.id,
                            characterName: normalized.name 
                        });
                    } else {
                        throw new Error('Failed to import character');
                    }
                } else {
                    throw new Error('StoryTeller Players Panel not available');
                }
            } else {
                throw new Error('Character Import Profile not available');
            }

        } catch (error) {
            console.error('❌ Character import failed:', error);
            this.sendResponse('import-error', { 
                error: error.message,
                characterName: characterData.name || 'Unknown'
            });
            
            window.showNotification('error', 'Import Failed', 
                `Failed to import character: ${error.message}`, 
                'Check console for details');
        }
    }

    /**
     * Handle character updates from V4-network
     */
    handleCharacterUpdate(data) {
        console.log('🔄 Character update received:', data);
        // Handle real-time character updates
        if (window.storyTellerPlayersPanel && data.characterId) {
            window.storyTellerPlayersPanel.updateCharacter(data.characterId, data.updates);
        }
    }

    /**
     * Handle handshake from V4-network
     */
    handleHandshake(data) {
        console.log('🤝 Handshake received from V4-network');
        this.connectionStatus = 'connected';
        this.v4Window = data.windowRef;
        
        this.sendResponse('handshake-ack', {
            capabilities: ['character-import', 'real-time-updates'],
            version: '1.0.0'
        });

        window.showNotification('success', 'V4-Network Connected', 
            'Real-time character import enabled', 
            'Characters exported from V4-network will automatically appear here');
    }

    /**
     * Send response back to V4-network
     */
    sendResponse(type, data) {
        const message = {
            type,
            data,
            source: 'storyteller',
            timestamp: Date.now()
        };

        // Send to parent window if we're in an iframe
        if (window.parent !== window) {
            window.parent.postMessage(message, '*');
        }

        // Send to opener window if we were opened by another window
        if (window.opener) {
            window.opener.postMessage(message, '*');
        }

        // Broadcast to all windows (for same-origin)
        window.postMessage(message, window.location.origin);
    }

    /**
     * Handle storage events for same-browser communication
     */
    handleStorageEvent(event) {
        if (event.key === 'v4-character-export') {
            try {
                const data = JSON.parse(event.newValue);
                this.handleCharacterExport(data);
                // Clean up the storage event
                localStorage.removeItem('v4-character-export');
            } catch (error) {
                console.error('❌ Storage event parsing failed:', error);
            }
        }
    }

    /**
     * Show import notification with details
     */
    showImportNotification(character) {
        const level = character.level || 1;
        const className = character.class || 'Unknown';
        const race = character.race || 'Unknown';

        window.showNotification('success', 'Character Imported', 
            `${character.name} (Level ${level} ${race} ${className})`,
            'Character automatically imported from V4-network');
    }

    /**
     * Start listening for V4-network connections
     */
    startListening() {
        if (this.isListening) return;
        
        this.isListening = true;
        console.log('👂 Started listening for V4-network connections');
        
        // Announce our presence
        this.sendResponse('storyteller-ready', {
            capabilities: ['character-import', 'real-time-updates'],
            version: '1.0.0'
        });
    }

    /**
     * Stop listening
     */
    stopListening() {
        this.isListening = false;
        this.connectionStatus = 'disconnected';
        console.log('🔇 Stopped listening for V4-network connections');
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isListening: this.isListening,
            connectionStatus: this.connectionStatus,
            hasV4Window: !!this.v4Window
        };
    }
}

// ========================================
// GLOBAL INITIALIZATION
// ========================================
window.v4NetworkBridge = new V4NetworkBridge();

// Auto-start listening when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.v4NetworkBridge.startListening();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = V4NetworkBridge;
}
