// ========================================
// CHARACTER SYNC SYSTEM - V4 NETWORK
// Real-time character synchronization via Supabase chat
// ========================================

class V4CharacterSyncManager {
    constructor() {
        this.currentCharacterHash = null;
        this.playerName = '';
        this.sessionCode = '';
        this.isConnected = false;
        
        // Enable debug mode for testing
        this.debugMode = true;
        
        console.log('🔄 V4CharacterSyncManager initialized');
    }

    /**
     * Initialize when joining chat session
     */
    initialize(playerName, sessionCode) {
        this.playerName = playerName;
        this.sessionCode = sessionCode;
        this.isConnected = true;
        
        console.log(`🔄 V4 Character sync initialized for ${playerName}`);
        
        // Show connection notification
        if (typeof showNotification === 'function') {
            showNotification('success', 'Character Sync Active', 
                'Auto-sync to StoryTeller enabled', 
                'Characters will automatically sync via chat');
        }
        
        // Announce current character
        setTimeout(() => {
            this.announceCurrentCharacter();
        }, 2000); // Wait a bit for chat to establish
    }

    /**
     * Generate hash for character data
     */
    generateCharacterHash(character) {
        if (!character) return null;
        
        const normalized = {
            name: character.name,
            level: character.level || 1,
            class: character.class,
            race: character.race,
            stats: character.stats || {},
            skills: character.skills || [],
            equipment: character.equipment || [],
            achievements: character.achievements || [],
            hitPoints: character.hitPoints || character.hp || 0,
            lastModified: character.lastModified
        };
        
        const str = JSON.stringify(normalized, Object.keys(normalized).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    /**
     * Announce current character to StoryTeller
     */
    async announceCurrentCharacter() {
        try {
            const character = this.getCurrentCharacter();
            if (!character || !character.name) {
                console.log('⚠️ No character loaded to announce');
                return;
            }

            const hash = this.generateCharacterHash(character);
            this.currentCharacterHash = hash;

            const message = {
                type: 'character_announcement',
                character_name: character.name,
                character_hash: hash,
                player_name: this.playerName,
                timestamp: Date.now()
            };

            await this.sendSystemMessage(`CHAR_ANNOUNCE:${JSON.stringify(message)}`);
            console.log(`📢 Announced character: ${character.name} (${hash})`);

            // Also send to old bridge system for compatibility
            if (window.storyTellerBridge) {
                window.storyTellerBridge.sendCharacterToStoryTeller(character.id);
            }

        } catch (error) {
            console.error('❌ Failed to announce character:', error);
        }
    }

    /**
     * Handle incoming character sync messages
     */
    async handleCharacterSyncMessage(messageText, senderName) {
        try {
            if (!messageText.includes('CHAR_')) return false;

            // Only respond to messages directed at us or general requests
            let message;
            
            if (messageText.startsWith('CHAR_REQUEST:')) {
                message = JSON.parse(messageText.replace('CHAR_REQUEST:', ''));
                await this.handleCharacterRequest(message, senderName);
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Failed to handle character sync message:', error);
            return false;
        }
    }

    /**
     * Handle character data request from StoryTeller
     */
    async handleCharacterRequest(message, senderName) {
        const { character_name, from_player, to_player } = message;
        
        // Only respond if the request is for us
        if (to_player !== this.playerName) return;
        
        console.log(`📨 Character data requested: ${character_name} by ${from_player}`);
        
        // Send our current character if it matches
        const character = this.getCurrentCharacter();
        if (character && character.name === character_name) {
            await this.sendCharacterData(character, from_player);
        } else {
            console.warn(`⚠️ Requested character ${character_name} not currently loaded`);
        }
    }

    /**
     * Send character data to requesting player
     */
    async sendCharacterData(character, toPlayer) {
        try {
            // Clean character data for transmission
            const cleanCharacter = {
                ...character,
                id: undefined, // Remove ID to prevent conflicts
                lastModified: new Date().toISOString()
            };

            const message = {
                type: 'character_data',
                character_name: character.name,
                character_data: cleanCharacter,
                to_player: toPlayer,
                from_player: this.playerName,
                timestamp: Date.now()
            };

            await this.sendSystemMessage(`CHAR_DATA:${JSON.stringify(message)}`);
            console.log(`📤 Sent character data: ${character.name} to ${toPlayer}`);

            // Show notification
            if (typeof showNotification === 'function') {
                showNotification('success', 'Character Shared', 
                    `${character.name} sent to StoryTeller`, 
                    'Character data synchronized automatically');
            }

        } catch (error) {
            console.error(`❌ Failed to send character data for ${character.name}:`, error);
        }
    }

    /**
     * Get current character from V4-network
     */
    getCurrentCharacter() {
        // V4-network uses characterManager.currentCharacterId and global 'character' object
        if (window.characterManager && window.characterManager.currentCharacterId && window.character) {
            // Verify the character object matches the current ID
            if (character.id === characterManager.currentCharacterId) {
                return character;
            }
        }
        
        // Fallback: try to find current character in characters array
        if (window.characterManager && window.characterManager.currentCharacterId && window.characterManager.characters) {
            const currentChar = characterManager.characters.find(
                char => char.id === characterManager.currentCharacterId
            );
            if (currentChar) return currentChar;
        }
        
        // Last resort: if we have a global character object, use it
        if (window.character && window.character.id) {
            return character;
        }
        
        return null;
    }

    /**
     * Send system message via Supabase
     */
    async sendSystemMessage(messageText) {
        if (typeof sendSystemMessage === 'function') {
            await sendSystemMessage(messageText);
        } else if (typeof sendChatMessageAsync === 'function') {
            await sendChatMessageAsync(messageText);
        } else {
            console.warn('⚠️ No message sending function available');
        }
    }

    /**
     * Check if character has changed and announce if needed
     */
    async checkCharacterUpdate() {
        const character = this.getCurrentCharacter();
        if (!character) return;

        const newHash = this.generateCharacterHash(character);
        
        if (newHash !== this.currentCharacterHash) {
            console.log(`🔄 Character changed detected: ${character.name}`);
            this.currentCharacterHash = newHash;
            await this.announceCurrentCharacter();
        }
    }

    /**
     * Auto-sync character when it changes
     */
    setupAutoSync() {
        // Check for character changes every 30 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.checkCharacterUpdate();
            }
        }, 30000);

        // Also hook into character saving if possible
        const originalSaveCharacter = window.saveCharacter;
        if (originalSaveCharacter) {
            window.saveCharacter = async (...args) => {
                const result = await originalSaveCharacter.apply(this, args);
                // Trigger sync after save
                setTimeout(() => this.checkCharacterUpdate(), 1000);
                return result;
            };
        }
    }

    /**
     * Disconnect from sync
     */
    disconnect() {
        this.isConnected = false;
        this.currentCharacterHash = null;
        console.log('🔌 Character sync disconnected');
    }

    /**
     * Get sync status
     */
    getStatus() {
        const character = this.getCurrentCharacter();
        return {
            playerName: this.playerName,
            sessionCode: this.sessionCode,
            isConnected: this.isConnected,
            currentCharacter: character ? character.name : 'None',
            currentHash: this.currentCharacterHash,
            characterData: character ? {
                level: character.level,
                class: character.class,
                race: character.race
            } : null,
            debugMode: this.debugMode
        };
    }

    /**
     * Manual test functions for debugging
     */
    testConnection() {
        console.log('🧪 Testing V4 Character Sync Manager');
        console.log('Status:', this.getStatus());
        
        const character = this.getCurrentCharacter();
        if (character) {
            console.log('✅ Character loaded:', character.name);
            console.log('📊 Character hash:', this.generateCharacterHash(character));
        } else {
            console.log('❌ No character currently loaded');
        }
        
        if (this.isConnected) {
            console.log('🔗 Connected to session:', this.sessionCode);
        } else {
            console.log('🔌 Not connected to chat session');
        }
    }

    /**
     * Manual trigger for testing
     */
    forceAnnounce() {
        console.log('🔊 Force announcing character...');
        this.announceCurrentCharacter();
    }
}

// ========================================
// GLOBAL INITIALIZATION
// ========================================
window.v4CharacterSyncManager = new V4CharacterSyncManager();

// Setup auto-sync when ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.v4CharacterSyncManager) {
        window.v4CharacterSyncManager.setupAutoSync();
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = V4CharacterSyncManager;
}
