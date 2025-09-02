// ========================================
// CHARACTER SYNC SYSTEM
// Real-time character synchronization via Supabase chat
// ========================================

class CharacterSyncManager {
    constructor() {
        this.localCharacters = new Map(); // character_name -> { hash, data, lastSync }
        this.syncRequests = new Map(); // character_name -> pending request
        this.isStoryTeller = false;
        this.playerName = '';
        this.sessionCode = '';
        
        // Enable debug mode for testing
        this.debugMode = true;
        
        console.log('🔄 CharacterSyncManager initialized');
    }

    /**
     * Initialize character sync when joining chat
     */
    initialize(playerName, sessionCode, isStoryTeller = false) {
        this.playerName = playerName;
        this.sessionCode = sessionCode;
        this.isStoryTeller = isStoryTeller;
        
        console.log(`🔄 Character sync initialized for ${playerName} (${isStoryTeller ? 'StoryTeller' : 'Player'})`);
        
        // Show connection notification for StoryTeller
        if (isStoryTeller && typeof showNotification === 'function') {
            showNotification('success', 'Character Sync Ready', 
                'Auto-import from players enabled', 
                'Player characters will automatically appear here');
        }
        
        // Auto-sync current character when joining
        if (!isStoryTeller) {
            this.announcePlayerCharacter();
        }
    }

    /**
     * Generate hash for character data (for change detection)
     */
    generateCharacterHash(character) {
        // Create a normalized version for hashing
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
        
        // Simple hash function (could use crypto.subtle.digest for better hashing)
        const str = JSON.stringify(normalized, Object.keys(normalized).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Announce current character when joining session
     */
    async announcePlayerCharacter() {
        try {
            // Get current character from V4-network
            if (typeof getCurrentCharacter === 'function') {
                const character = getCurrentCharacter();
                if (character && character.name) {
                    const hash = this.generateCharacterHash(character);
                    
                    await this.sendCharacterAnnouncement(character.name, hash);
                    this.localCharacters.set(character.name, {
                        hash,
                        data: character,
                        lastSync: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('❌ Failed to announce character:', error);
        }
    }

    /**
     * Send character announcement via Supabase
     */
    async sendCharacterAnnouncement(characterName, characterHash) {
        const message = {
            type: 'character_announcement',
            character_name: characterName,
            character_hash: characterHash,
            player_name: this.playerName,
            timestamp: Date.now()
        };

        await this.sendSystemMessage(`CHAR_ANNOUNCE:${JSON.stringify(message)}`);
        console.log(`📢 Announced character: ${characterName} (${characterHash})`);
    }

    /**
     * Request character data from specific player
     */
    async requestCharacterData(characterName, fromPlayer) {
        const message = {
            type: 'character_request',
            character_name: characterName,
            from_player: this.playerName,
            to_player: fromPlayer,
            timestamp: Date.now()
        };

        await this.sendSystemMessage(`CHAR_REQUEST:${JSON.stringify(message)}`);
        
        // Track pending request
        this.syncRequests.set(characterName, {
            fromPlayer,
            timestamp: Date.now()
        });
        
        console.log(`📨 Requested character data: ${characterName} from ${fromPlayer}`);
    }

    /**
     * Send character data to requesting player
     */
    async sendCharacterData(characterName, toPlayer) {
        try {
            let character = null;
            
            // Get character data from V4-network or StoryTeller
            if (typeof getCurrentCharacter === 'function') {
                const current = getCurrentCharacter();
                if (current && current.name === characterName) {
                    character = current;
                }
            }
            
            // Fallback: get from character manager
            if (!character && typeof getCharacterById === 'function') {
                // Try to find by name in character list
                const characters = getAllCharacters ? getAllCharacters() : [];
                character = characters.find(c => c.name === characterName);
            }

            if (!character) {
                console.warn(`⚠️ Character not found: ${characterName}`);
                return;
            }

            // Prepare character for transmission
            const cleanCharacter = {
                ...character,
                id: undefined, // Remove ID to prevent conflicts
                lastModified: new Date().toISOString()
            };

            const message = {
                type: 'character_data',
                character_name: characterName,
                character_data: cleanCharacter,
                to_player: toPlayer,
                from_player: this.playerName,
                timestamp: Date.now()
            };

            await this.sendSystemMessage(`CHAR_DATA:${JSON.stringify(message)}`);
            console.log(`📤 Sent character data: ${characterName} to ${toPlayer}`);

        } catch (error) {
            console.error(`❌ Failed to send character data for ${characterName}:`, error);
        }
    }

    /**
     * Handle incoming character sync messages
     */
    async handleCharacterSyncMessage(messageText, senderName) {
        try {
            if (!messageText.includes('CHAR_')) return false;

            let message;
            if (messageText.startsWith('CHAR_ANNOUNCE:')) {
                message = JSON.parse(messageText.replace('CHAR_ANNOUNCE:', ''));
                await this.handleCharacterAnnouncement(message, senderName);
                return true;
            }
            
            if (messageText.startsWith('CHAR_REQUEST:')) {
                message = JSON.parse(messageText.replace('CHAR_REQUEST:', ''));
                await this.handleCharacterRequest(message, senderName);
                return true;
            }
            
            if (messageText.startsWith('CHAR_DATA:')) {
                message = JSON.parse(messageText.replace('CHAR_DATA:', ''));
                await this.handleCharacterData(message, senderName);
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Failed to handle character sync message:', error);
            return false;
        }
    }

    /**
     * Handle character announcement from another player
     */
    async handleCharacterAnnouncement(message, senderName) {
        const { character_name, character_hash, player_name } = message;
        
        console.log(`📢 Character announced: ${character_name} by ${player_name} (${character_hash})`);

        // Only StoryTeller processes character announcements
        if (!this.isStoryTeller) return;

        // Check if we already have this character
        const existingCharacter = await this.getStoredCharacter(character_name);
        
        if (!existingCharacter) {
            // We don't have this character, request it
            console.log(`📥 New character detected: ${character_name}, requesting data`);
            await this.requestCharacterData(character_name, player_name);
        } else {
            // Check if our version is up to date
            const existingHash = this.generateCharacterHash(existingCharacter);
            
            if (existingHash !== character_hash) {
                console.log(`🔄 Character update detected: ${character_name}, requesting latest data`);
                await this.requestCharacterData(character_name, player_name);
            } else {
                console.log(`✅ Character up to date: ${character_name}`);
            }
        }
    }

    /**
     * Handle character data request
     */
    async handleCharacterRequest(message, senderName) {
        const { character_name, from_player, to_player } = message;
        
        // Only respond if the request is for us
        if (to_player !== this.playerName) return;
        
        console.log(`📨 Character data requested: ${character_name} by ${from_player}`);
        await this.sendCharacterData(character_name, from_player);
    }

    /**
     * Handle incoming character data
     */
    async handleCharacterData(message, senderName) {
        const { character_name, character_data, to_player, from_player } = message;
        
        // Only process if the data is for us
        if (to_player !== this.playerName) return;
        
        console.log(`📥 Received character data: ${character_name} from ${from_player}`);

        try {
            // Import character using existing system
            if (window.CharacterImportProfile) {
                const importProfile = new window.CharacterImportProfile();
                const normalized = importProfile.normalizeCharacter(character_data);
                
                // Import to StoryTeller
                if (window.storyTellerPlayersPanel) {
                    const success = window.storyTellerPlayersPanel.importCharacter(normalized);
                    
                    if (success) {
                        // Store for future hash comparisons
                        const hash = this.generateCharacterHash(normalized);
                        this.localCharacters.set(character_name, {
                            hash,
                            data: normalized,
                            lastSync: Date.now()
                        });

                        // Show success notification
                        this.showCharacterSyncNotification(normalized, from_player);
                        
                        // Clear pending request
                        this.syncRequests.delete(character_name);
                        
                        console.log(`✅ Character imported: ${character_name}`);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Failed to import character ${character_name}:`, error);
        }
    }

    /**
     * Get stored character (from StoryTeller's storage)
     */
    async getStoredCharacter(characterName) {
        try {
            if (window.storageManager && window.storageManager.getAllCharacters) {
                const characters = await window.storageManager.getAllCharacters();
                return characters.find(c => c.name === characterName);
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to get stored character:', error);
            return null;
        }
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
     * Show character sync notification
     */
    showCharacterSyncNotification(character, fromPlayer) {
        const level = character.level || 1;
        const className = character.class || 'Unknown';
        const race = character.race || 'Unknown';

        if (typeof showNotification === 'function') {
            showNotification('success', 'Character Synced', 
                `${character.name} (Level ${level} ${race} ${className})`,
                `Automatically received from ${fromPlayer}`);
        }

        // Also add to chat if available
        if (typeof window.addMessage === 'function') {
            window.addMessage('System', 
                `📥 Character synced: ${character.name} from ${fromPlayer}`, 
                'system');
        }
    }

    /**
     * Trigger character sync when character changes in V4-network
     */
    async onCharacterUpdate(character) {
        if (!character || !character.name) return;

        const hash = this.generateCharacterHash(character);
        const stored = this.localCharacters.get(character.name);

        // If hash changed, announce the update
        if (!stored || stored.hash !== hash) {
            console.log(`🔄 Character changed: ${character.name}, announcing update`);
            
            await this.sendCharacterAnnouncement(character.name, hash);
            this.localCharacters.set(character.name, {
                hash,
                data: character,
                lastSync: Date.now()
            });
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            playerName: this.playerName,
            sessionCode: this.sessionCode,
            isStoryTeller: this.isStoryTeller,
            localCharacters: this.localCharacters.size,
            pendingRequests: this.syncRequests.size,
            characterList: Array.from(this.localCharacters.keys()),
            debugMode: this.debugMode
        };
    }

    /**
     * Manual test functions for debugging
     */
    testConnection() {
        console.log('🧪 Testing Character Sync Manager');
        console.log('Status:', this.getStatus());
        
        if (this.sessionCode) {
            console.log('✅ Connected to session:', this.sessionCode);
        } else {
            console.log('❌ Not connected to any session');
        }
        
        if (this.isStoryTeller) {
            console.log('👑 Running as StoryTeller (will receive characters)');
        } else {
            console.log('🎭 Running as Player (will send characters)');
        }
    }
}

// ========================================
// GLOBAL INITIALIZATION
// ========================================
window.characterSyncManager = new CharacterSyncManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterSyncManager;
}
