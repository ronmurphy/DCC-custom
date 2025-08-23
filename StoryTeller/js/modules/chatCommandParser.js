/**
 * Chat Command Parser Module
 * Handles hidden commands for StoryTeller to manage player rewards, achievements, etc.
 * Commands are formatted as: COMMAND:PlayerName:parameter
 */

class ChatCommandParser {
    constructor() {
        this.dccIntegration = null;
        this.skillsManager = null;
        this.characterData = null;
        
        // Command patterns
        this.commandPatterns = {
            LOOT: /^LOOT:([^:]+):(.+)$/i,
            ACHIEVEMENT: /^ACHIEVEMENT:([^:]+):(.+)$/i,
            LEVELUP: /^LEVELUP:([^:]+)$/i,
            ITEM: /^ITEM:([^:]+):(.+)$/i,
            SKILL: /^SKILL:([^:]+):([^:]+):(\d+)$/i,
            EXPERIENCE: /^EXP:([^:]+):(\d+)$/i,
            GOLD: /^GOLD:([^:]+):(\d+)$/i,
            HEALTH: /^HEALTH:([^:]+):([+-]?\d+)$/i,
            STAT: /^STAT:([^:]+):([^:]+):([+-]?\d+)$/i
        };
        
        // Active players (should be populated from session)
        this.activePlayers = new Map();
        
        // Loot generation tables
        this.lootTables = {
            handful_gold: { min: 10, max: 50, type: 'gold' },
            small_pouch: { min: 5, max: 25, type: 'gold' },
            treasure_chest: { min: 100, max: 500, type: 'gold' },
            magic_item: { type: 'item', table: 'magic_items' },
            weapon: { type: 'item', table: 'weapons' },
            armor: { type: 'item', table: 'armor' },
            potion: { type: 'item', table: 'potions' }
        };
    }

    /**
     * Initialize with DCC integration systems
     * @param {Object} dccIntegration - DCC integration instance
     * @param {Object} skillsManager - Skills manager instance
     * @param {Object} characterData - Character data instance
     */
    initialize(dccIntegration, skillsManager, characterData) {
        this.dccIntegration = dccIntegration;
        this.skillsManager = skillsManager;
        this.characterData = characterData;
        console.log('✅ Chat Command Parser initialized');
    }

    /**
     * Register an active player
     * @param {string} playerName - Player name
     * @param {Object} playerData - Player character data
     */
    registerPlayer(playerName, playerData) {
        this.activePlayers.set(playerName.toLowerCase(), playerData);
        console.log(`👤 Registered player: ${playerName}`);
    }

    /**
     * Unregister a player
     * @param {string} playerName - Player name
     */
    unregisterPlayer(playerName) {
        this.activePlayers.delete(playerName.toLowerCase());
        console.log(`👋 Unregistered player: ${playerName}`);
    }

    /**
     * Get player data
     * @param {string} playerName - Player name
     * @returns {Object|null} Player data or null
     */
    getPlayer(playerName) {
        return this.activePlayers.get(playerName.toLowerCase());
    }

    /**
     * Check if message contains a hidden command
     * @param {string} message - Chat message
     * @returns {boolean} True if message contains a command
     */
    isCommand(message) {
        return Object.keys(this.commandPatterns).some(command => 
            this.commandPatterns[command].test(message.trim())
        );
    }

    /**
     * Process a chat message for hidden commands
     * @param {string} message - Chat message
     * @param {string} senderName - Name of person sending the message
     * @returns {Object|null} Command result or null if no command
     */
    async processMessage(message, senderName = 'StoryTeller') {
        if (!this.isCommand(message)) {
            return null;
        }

        const trimmedMessage = message.trim();
        
        // Check each command pattern
        for (const [commandType, pattern] of Object.entries(this.commandPatterns)) {
            const match = trimmedMessage.match(pattern);
            if (match) {
                try {
                    const result = await this.executeCommand(commandType, match, senderName);
                    return result;
                } catch (error) {
                    console.error(`❌ Command execution failed:`, error);
                    return {
                        success: false,
                        error: error.message,
                        command: commandType,
                        originalMessage: message
                    };
                }
            }
        }

        return null;
    }

    /**
     * Execute a specific command
     * @param {string} commandType - Type of command
     * @param {Array} match - Regex match results
     * @param {string} senderName - Command sender
     * @returns {Object} Command execution result
     */
    async executeCommand(commandType, match, senderName) {
        const playerName = match[1];
        const player = this.getPlayer(playerName);

        if (!player) {
            return {
                success: false,
                error: `Player "${playerName}" not found in active session`,
                command: commandType,
                targetPlayer: playerName
            };
        }

        switch (commandType) {
            case 'LOOT':
                return await this.handleLootCommand(player, playerName, match[2], senderName);
            
            case 'ACHIEVEMENT':
                return await this.handleAchievementCommand(player, playerName, match[2], senderName);
            
            case 'LEVELUP':
                return await this.handleLevelUpCommand(player, playerName, senderName);
            
            case 'ITEM':
                return await this.handleItemCommand(player, playerName, match[2], senderName);
            
            case 'SKILL':
                return await this.handleSkillCommand(player, playerName, match[2], parseInt(match[3]), senderName);
            
            case 'EXPERIENCE':
                return await this.handleExperienceCommand(player, playerName, parseInt(match[2]), senderName);
            
            case 'GOLD':
                return await this.handleGoldCommand(player, playerName, parseInt(match[2]), senderName);
            
            case 'HEALTH':
                return await this.handleHealthCommand(player, playerName, parseInt(match[2]), senderName);
            
            case 'STAT':
                return await this.handleStatCommand(player, playerName, match[2], parseInt(match[3]), senderName);
            
            default:
                throw new Error(`Unknown command type: ${commandType}`);
        }
    }

    /**
     * Handle LOOT command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} lootType - Type of loot
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleLootCommand(player, playerName, lootType, senderName) {
        const lootData = this.lootTables[lootType];
        
        if (!lootData) {
            throw new Error(`Unknown loot type: ${lootType}`);
        }

        let result = {
            success: true,
            command: 'LOOT',
            targetPlayer: playerName,
            sender: senderName,
            lootType: lootType
        };

        if (lootData.type === 'gold') {
            const amount = Math.floor(Math.random() * (lootData.max - lootData.min + 1)) + lootData.min;
            player.gold = (player.gold || 0) + amount;
            
            result.goldAwarded = amount;
            result.totalGold = player.gold;
            result.message = `💰 ${playerName} found ${amount} gold! (Total: ${player.gold})`;
            
        } else if (lootData.type === 'item') {
            const item = await this.generateItem(lootData.table);
            if (!player.inventory) player.inventory = [];
            player.inventory.push(item);
            
            result.itemAwarded = item;
            result.message = `🎒 ${playerName} found: ${item.name}!`;
        }

        console.log(`💰 LOOT: ${result.message}`);
        return result;
    }

    /**
     * Handle ACHIEVEMENT command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} achievementId - Achievement identifier
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleAchievementCommand(player, playerName, achievementId, senderName) {
        if (!player.achievements) player.achievements = [];
        
        if (player.achievements.includes(achievementId)) {
            return {
                success: false,
                error: `${playerName} already has achievement: ${achievementId}`,
                command: 'ACHIEVEMENT',
                targetPlayer: playerName
            };
        }

        // Get achievement data
        const achievements = await this.characterData.getAchievements();
        const achievement = this.findAchievement(achievements, achievementId);
        
        if (!achievement) {
            throw new Error(`Achievement not found: ${achievementId}`);
        }

        player.achievements.push(achievementId);
        
        const result = {
            success: true,
            command: 'ACHIEVEMENT',
            targetPlayer: playerName,
            sender: senderName,
            achievementId: achievementId,
            achievement: achievement,
            message: `🏆 ${playerName} unlocked achievement: ${achievement.name}!`
        };

        console.log(`🏆 ACHIEVEMENT: ${result.message}`);
        return result;
    }

    /**
     * Handle LEVELUP command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleLevelUpCommand(player, playerName, senderName) {
        const oldLevel = player.level || 1;
        const newLevel = oldLevel + 1;
        
        player.level = newLevel;
        
        // Award skill points and proficiencies based on new level
        const skillPointsGained = 2; // Base skill points per level
        const proficienciesGained = newLevel % 3 === 0 ? 1 : 0; // Proficiency every 3 levels
        
        player.availableSkillPoints = (player.availableSkillPoints || 0) + skillPointsGained;
        player.availableProficiencies = (player.availableProficiencies || 0) + proficienciesGained;

        const result = {
            success: true,
            command: 'LEVELUP',
            targetPlayer: playerName,
            sender: senderName,
            oldLevel: oldLevel,
            newLevel: newLevel,
            skillPointsGained: skillPointsGained,
            proficienciesGained: proficienciesGained,
            message: `⬆️ ${playerName} reached Level ${newLevel}! (+${skillPointsGained} skill points${proficienciesGained > 0 ? `, +${proficienciesGained} proficiency` : ''})`
        };

        console.log(`⬆️ LEVELUP: ${result.message}`);
        return result;
    }

    /**
     * Handle SKILL command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} skillName - Skill name
     * @param {number} experience - Experience to award
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleSkillCommand(player, playerName, skillName, experience, senderName) {
        if (!this.skillsManager) {
            throw new Error('Skills manager not available');
        }

        const leveledUp = this.skillsManager.trainSkill(player, skillName, experience);
        const newLevel = this.skillsManager.getSkillLevel(player, skillName);

        const result = {
            success: true,
            command: 'SKILL',
            targetPlayer: playerName,
            sender: senderName,
            skillName: skillName,
            experienceGained: experience,
            newLevel: newLevel,
            leveledUp: leveledUp,
            message: `📚 ${playerName} gained ${experience} XP in ${skillName}${leveledUp ? ` and leveled up to ${newLevel}!` : ` (Level ${newLevel})`}`
        };

        console.log(`📚 SKILL: ${result.message}`);
        return result;
    }

    /**
     * Handle GOLD command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {number} amount - Gold amount (can be negative)
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleGoldCommand(player, playerName, amount, senderName) {
        const oldGold = player.gold || 0;
        const newGold = Math.max(0, oldGold + amount);
        player.gold = newGold;

        const result = {
            success: true,
            command: 'GOLD',
            targetPlayer: playerName,
            sender: senderName,
            goldChange: amount,
            oldGold: oldGold,
            newGold: newGold,
            message: `💰 ${playerName} ${amount >= 0 ? 'gained' : 'lost'} ${Math.abs(amount)} gold (Total: ${newGold})`
        };

        console.log(`💰 GOLD: ${result.message}`);
        return result;
    }

    /**
     * Handle HEALTH command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {number} amount - Health change (can be negative for damage)
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleHealthCommand(player, playerName, amount, senderName) {
        const oldHealth = player.health || player.maxHealth || 100;
        const maxHealth = player.maxHealth || 100;
        const newHealth = Math.max(0, Math.min(maxHealth, oldHealth + amount));
        player.health = newHealth;

        const result = {
            success: true,
            command: 'HEALTH',
            targetPlayer: playerName,
            sender: senderName,
            healthChange: amount,
            oldHealth: oldHealth,
            newHealth: newHealth,
            maxHealth: maxHealth,
            message: `🩹 ${playerName} ${amount >= 0 ? 'healed' : 'took'} ${Math.abs(amount)} damage (HP: ${newHealth}/${maxHealth})`
        };

        console.log(`🩹 HEALTH: ${result.message}`);
        return result;
    }

    /**
     * Handle STAT command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} statName - Stat name
     * @param {number} modifier - Stat modifier (can be negative)
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleStatCommand(player, playerName, statName, modifier, senderName) {
        const normalizedStat = this.normalizeStatName(statName);
        
        if (!player.attributes[normalizedStat]) {
            throw new Error(`Unknown stat: ${statName}`);
        }

        const oldValue = player.attributes[normalizedStat];
        const newValue = Math.max(1, Math.min(30, oldValue + modifier)); // Keep stats between 1-30
        player.attributes[normalizedStat] = newValue;

        const result = {
            success: true,
            command: 'STAT',
            targetPlayer: playerName,
            sender: senderName,
            statName: normalizedStat,
            statChange: modifier,
            oldValue: oldValue,
            newValue: newValue,
            message: `📊 ${playerName}'s ${normalizedStat} ${modifier >= 0 ? 'increased' : 'decreased'} by ${Math.abs(modifier)} (${oldValue} → ${newValue})`
        };

        console.log(`📊 STAT: ${result.message}`);
        return result;
    }

    /**
     * Handle ITEM command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {string} itemName - Item name
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleItemCommand(player, playerName, itemName, senderName) {
        const item = {
            name: itemName,
            type: 'item',
            description: `Given by ${senderName}`,
            timestamp: new Date().toISOString()
        };

        if (!player.inventory) player.inventory = [];
        player.inventory.push(item);

        const result = {
            success: true,
            command: 'ITEM',
            targetPlayer: playerName,
            sender: senderName,
            item: item,
            message: `🎒 ${playerName} received: ${itemName}!`
        };

        console.log(`🎒 ITEM: ${result.message}`);
        return result;
    }

    /**
     * Handle EXPERIENCE command
     * @param {Object} player - Player data
     * @param {string} playerName - Player name
     * @param {number} experience - Experience to award
     * @param {string} senderName - Command sender
     * @returns {Object} Command result
     */
    async handleExperienceCommand(player, playerName, experience, senderName) {
        const oldExp = player.experience || 0;
        const newExp = oldExp + experience;
        player.experience = newExp;

        // Check for level up (simple formula: 100 * level for next level)
        const currentLevel = player.level || 1;
        const expForNextLevel = currentLevel * 100;
        let levelUp = false;

        if (newExp >= expForNextLevel) {
            player.level = currentLevel + 1;
            player.experience = newExp - expForNextLevel;
            levelUp = true;
        }

        const result = {
            success: true,
            command: 'EXPERIENCE',
            targetPlayer: playerName,
            sender: senderName,
            experienceGained: experience,
            oldExp: oldExp,
            newExp: player.experience,
            level: player.level,
            levelUp: levelUp,
            message: `⭐ ${playerName} gained ${experience} XP${levelUp ? ` and leveled up to ${player.level}!` : ` (${player.experience} XP)`}`
        };

        console.log(`⭐ EXP: ${result.message}`);
        return result;
    }

    /**
     * Generate a random item from a table
     * @param {string} table - Item table name
     * @returns {Object} Generated item
     */
    async generateItem(table) {
        // This would typically load from the items JSON data
        // For now, return a simple item based on table
        const itemTemplates = {
            magic_items: [
                { name: 'Ring of Protection', type: 'ring', bonus: '+1 AC' },
                { name: 'Potion of Healing', type: 'potion', effect: 'Heal 2d4+2 HP' },
                { name: 'Wand of Magic Missiles', type: 'wand', charges: 7 }
            ],
            weapons: [
                { name: 'Iron Sword', type: 'weapon', damage: '1d8', bonus: '+1' },
                { name: 'Sturdy Mace', type: 'weapon', damage: '1d6', bonus: '+1' },
                { name: 'Sharp Dagger', type: 'weapon', damage: '1d4', bonus: '+2' }
            ],
            armor: [
                { name: 'Leather Armor', type: 'armor', ac: 11 },
                { name: 'Chain Mail', type: 'armor', ac: 14 },
                { name: 'Studded Leather', type: 'armor', ac: 12 }
            ]
        };

        const items = itemTemplates[table] || itemTemplates.magic_items;
        return items[Math.floor(Math.random() * items.length)];
    }

    /**
     * Find achievement in achievement data
     * @param {Object} achievements - Achievement data
     * @param {string} achievementId - Achievement ID
     * @returns {Object|null} Achievement data or null
     */
    findAchievement(achievements, achievementId) {
        // Search through all achievement categories
        for (const category of Object.values(achievements)) {
            if (Array.isArray(category)) {
                const found = category.find(ach => ach.id === achievementId);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Normalize stat name to match player attributes
     * @param {string} statName - Input stat name
     * @returns {string} Normalized stat name
     */
    normalizeStatName(statName) {
        const statMap = {
            'str': 'strength',
            'strength': 'strength',
            'dex': 'dexterity',
            'dexterity': 'dexterity',
            'con': 'constitution',
            'constitution': 'constitution',
            'int': 'intelligence',
            'intelligence': 'intelligence',
            'wis': 'wisdom',
            'wisdom': 'wisdom',
            'cha': 'charisma',
            'charisma': 'charisma'
        };
        
        return statMap[statName.toLowerCase()] || statName.toLowerCase();
    }

    /**
     * Get list of available commands
     * @returns {Array} Array of command descriptions
     */
    getAvailableCommands() {
        return [
            { command: 'LOOT:PlayerName:loot_type', description: 'Award random loot to player' },
            { command: 'ACHIEVEMENT:PlayerName:achievement_id', description: 'Unlock achievement for player' },
            { command: 'LEVELUP:PlayerName', description: 'Level up player' },
            { command: 'ITEM:PlayerName:item_name', description: 'Give specific item to player' },
            { command: 'SKILL:PlayerName:skill_name:experience', description: 'Award skill experience' },
            { command: 'EXP:PlayerName:amount', description: 'Award general experience' },
            { command: 'GOLD:PlayerName:amount', description: 'Give/take gold (use negative for taking)' },
            { command: 'HEALTH:PlayerName:amount', description: 'Heal/damage player' },
            { command: 'STAT:PlayerName:stat_name:modifier', description: 'Modify player stat' }
        ];
    }

    /**
     * Get list of available loot types
     * @returns {Array} Array of loot type names
     */
    getAvailableLootTypes() {
        return Object.keys(this.lootTables);
    }
}

// Export for use in other modules
window.ChatCommandParser = ChatCommandParser;
