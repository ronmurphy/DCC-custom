/**
 * DCC COMBAT SYSTEM - StoryTeller (DM App)
 * ========================================
 * 
 * This file contains all combat-related functionality for the StoryTeller DM app.
 * Handles incoming combat commands from players and manages combat flow.
 * 
 * INTEGRATION POINTS WITH EXISTING FILES:
 * ======================================
 * 
 * 1. StoryTeller/js/supabase-chat.js:
 *    - processInitiativeCommand() function: NEW - processes INITIATIVE commands from players
 *    - processAttackCommand() function: NEW - processes ATTACK commands from players
 *    - processSpellCommand() function: NEW - processes SPELL commands from players
 *    - processRollCommand() function: NEW - processes ROLL commands from players
 *    - Message processing logic: Modified to detect and route combat commands
 * 
 * 2. StoryTeller/index.html:
 *    - Combat panel UI elements: TBD - initiative tracker, turn order display
 *    - Chat message display: Modified to show formatted combat messages
 * 
 * COMMAND FORMATS RECEIVED:
 * ========================
 * - INITIATIVE|CharacterName|Total|d20|DEX|LuckDice
 * - ATTACK|CharacterName|WeaponName|AttackRoll|DamageRoll
 * - SPELL|CharacterName|SpellName|CastingRoll|Effect
 * - ROLL|CharacterName|SkillName|RollResult|Modifier
 * 
 * COMBAT MANAGEMENT WORKFLOW:
 * ===========================
 * 1. DM starts combat encounter
 * 2. Players roll initiative → collected in initiative tracker
 * 3. DM displays turn order
 * 4. Players take actions → displayed in combat log
 * 5. DM manages combat flow and resolution
 * 
 */

// =============================================================================
// COMBAT STATE MANAGEMENT
// =============================================================================

/**
 * Global combat state for the StoryTeller app
 */
const CombatState = {
    isActive: false,
    currentTurn: 0,
    initiativeOrder: [],
    combatLog: [],
    round: 1
};

/**
 * Starts a new combat encounter
 * Resets all combat state and prepares for initiative collection
 */
function startCombatEncounter() {
    CombatState.isActive = true;
    CombatState.currentTurn = 0;
    CombatState.initiativeOrder = [];
    CombatState.combatLog = [];
    CombatState.round = 1;
    
    // Clear previous initiative display
    updateInitiativeDisplay();
    
    // Notify chat that combat has started
    addCombatLogEntry('📢 Combat encounter started! Players, roll initiative with your DEX attribute.', 'system');
    
    console.log('Combat encounter started');
}

/**
 * Ends the current combat encounter
 * Cleans up combat state
 */
function endCombatEncounter() {
    CombatState.isActive = false;
    CombatState.currentTurn = 0;
    CombatState.initiativeOrder = [];
    CombatState.round = 1;
    
    // Clear initiative display
    updateInitiativeDisplay();
    
    // Notify chat that combat has ended
    addCombatLogEntry('🏁 Combat encounter ended.', 'system');
    
    console.log('Combat encounter ended');
}

// =============================================================================
// INITIATIVE SYSTEM
// =============================================================================

/**
 * Processes INITIATIVE command from V4-network player
 * Format: INITIATIVE|CharacterName|Total|d20|DEX|LuckDice
 * 
 * @param {string} commandData - Raw command string
 */
function processInitiativeCommand(commandData) {
    const parts = commandData.split('|');
    
    if (parts.length < 6) {
        console.error('Invalid INITIATIVE command format:', commandData);
        return;
    }
    
    const initiativeData = {
        character: parts[1],
        total: parseInt(parts[2]),
        d20: parseInt(parts[3]),
        dexModifier: parseInt(parts[4]),
        luckDice: parts[5] ? parts[5].split(',').map(d => parseInt(d)) : [],
        timestamp: Date.now()
    };
    
    // Add to initiative order (or update if character already exists)
    addToInitiativeOrder(initiativeData);
    
    // Format display message
    const luckDisplay = initiativeData.luckDice.length > 0 
        ? ` + luck(${initiativeData.luckDice.join('+')})` 
        : '';
    
    const message = `🎲 **${initiativeData.character}** rolled initiative: **${initiativeData.total}** (d20: ${initiativeData.d20} + DEX: ${initiativeData.dexModifier}${luckDisplay})`;
    
    // Add to combat log
    addCombatLogEntry(message, 'initiative');
    
    // Update initiative display
    updateInitiativeDisplay();
}

/**
 * Adds character to initiative order, maintaining sorted order
 * 
 * @param {Object} initiativeData - Initiative roll data
 */
function addToInitiativeOrder(initiativeData) {
    // Remove existing entry for this character (if any)
    CombatState.initiativeOrder = CombatState.initiativeOrder.filter(
        entry => entry.character !== initiativeData.character
    );
    
    // Add new entry
    CombatState.initiativeOrder.push(initiativeData);
    
    // Sort by total (highest first)
    CombatState.initiativeOrder.sort((a, b) => b.total - a.total);
}

/**
 * Updates the initiative display in the UI
 */
function updateInitiativeDisplay() {
    // This will need to be integrated with StoryTeller UI
    // For now, log to console
    console.log('Initiative Order:', CombatState.initiativeOrder);
    
    // TODO: Update actual UI elements when initiative tracker is built
    // Example:
    // const initiativeContainer = document.getElementById('initiative-tracker');
    // if (initiativeContainer) {
    //     initiativeContainer.innerHTML = generateInitiativeHTML();
    // }
}

// =============================================================================
// COMBAT ACTION PROCESSING
// =============================================================================

/**
 * Processes ATTACK command from V4-network player
 * Format: ATTACK|CharacterName|WeaponName|AttackRoll|DamageRoll
 * 
 * @param {string} commandData - Raw command string
 */
function processAttackCommand(commandData) {
    const parts = commandData.split('|');
    
    if (parts.length < 5) {
        console.error('Invalid ATTACK command format:', commandData);
        return;
    }
    
    const attackData = {
        character: parts[1],
        weapon: parts[2],
        attackRoll: parseInt(parts[3]),
        damageRoll: parseInt(parts[4]),
        timestamp: Date.now()
    };
    
    // Format display message
    const message = `⚔️ **${attackData.character}** attacks with **${attackData.weapon}**: Attack roll **${attackData.attackRoll}**, Damage **${attackData.damageRoll}**`;
    
    // Add to combat log
    addCombatLogEntry(message, 'attack');
    
    console.log('Attack processed:', attackData);
}

/**
 * Processes SPELL command from V4-network player
 * Format: SPELL|CharacterName|SpellName|CastingRoll|Effect
 * 
 * @param {string} commandData - Raw command string
 */
function processSpellCommand(commandData) {
    const parts = commandData.split('|');
    
    if (parts.length < 5) {
        console.error('Invalid SPELL command format:', commandData);
        return;
    }
    
    const spellData = {
        character: parts[1],
        spell: parts[2],
        castingRoll: parseInt(parts[3]),
        effect: parts[4],
        timestamp: Date.now()
    };
    
    // Format display message
    const message = `✨ **${spellData.character}** casts **${spellData.spell}**: Casting roll **${spellData.castingRoll}** - ${spellData.effect}`;
    
    // Add to combat log
    addCombatLogEntry(message, 'spell');
    
    console.log('Spell processed:', spellData);
}

/**
 * Processes ROLL command from V4-network player
 * Format: ROLL|CharacterName|SkillName|RollResult|Modifier
 * 
 * @param {string} commandData - Raw command string
 */
function processRollCommand(commandData) {
    const parts = commandData.split('|');
    
    if (parts.length < 5) {
        console.error('Invalid ROLL command format:', commandData);
        return;
    }
    
    const rollData = {
        character: parts[1],
        skill: parts[2],
        rollResult: parseInt(parts[3]),
        modifier: parseInt(parts[4]),
        timestamp: Date.now()
    };
    
    // Format display message  
    const modifierDisplay = rollData.modifier >= 0 ? `+${rollData.modifier}` : `${rollData.modifier}`;
    const message = `🎯 **${rollData.character}** rolls **${rollData.skill}**: **${rollData.rollResult}** (${rollData.rollResult - rollData.modifier}${modifierDisplay})`;
    
    // Add to combat log
    addCombatLogEntry(message, 'roll');
    
    console.log('Skill roll processed:', rollData);
}

// =============================================================================
// COMBAT LOG MANAGEMENT
// =============================================================================

/**
 * Adds entry to combat log and displays in chat
 * 
 * @param {string} message - Formatted message to display
 * @param {string} type - Type of combat action (initiative, attack, spell, roll, system)
 */
function addCombatLogEntry(message, type) {
    const logEntry = {
        message: message,
        type: type,
        timestamp: Date.now(),
        round: CombatState.round
    };
    
    // Add to combat log
    CombatState.combatLog.push(logEntry);
    
    // Display in chat (integrate with existing chat system)
    displayCombatMessage(logEntry);
    
    // Limit log size to prevent memory issues
    if (CombatState.combatLog.length > 100) {
        CombatState.combatLog = CombatState.combatLog.slice(-50);
    }
}

/**
 * Displays combat message in the chat interface
 * This needs to integrate with the existing StoryTeller chat system
 * 
 * @param {Object} logEntry - Combat log entry
 */
function displayCombatMessage(logEntry) {
    // TODO: Integrate with actual StoryTeller chat display
    // For now, log to console
    console.log(`[${logEntry.type}] ${logEntry.message}`);
    
    // Example integration with chat system:
    // if (typeof addMessageToChat === 'function') {
    //     addMessageToChat({
    //         message: logEntry.message,
    //         type: 'combat',
    //         timestamp: logEntry.timestamp
    //     });
    // }
}

// =============================================================================
// TURN MANAGEMENT
// =============================================================================

/**
 * Advances to the next turn in combat
 */
function nextTurn() {
    if (!CombatState.isActive || CombatState.initiativeOrder.length === 0) {
        return;
    }
    
    CombatState.currentTurn++;
    
    // Check if we've completed a round
    if (CombatState.currentTurn >= CombatState.initiativeOrder.length) {
        CombatState.currentTurn = 0;
        CombatState.round++;
        addCombatLogEntry(`🔄 **Round ${CombatState.round}** begins!`, 'system');
    }
    
    // Announce current turn
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurn];
    if (currentCharacter) {
        addCombatLogEntry(`👆 **${currentCharacter.character}'s** turn!`, 'system');
    }
    
    // Update UI
    updateInitiativeDisplay();
}

/**
 * Goes back to the previous turn in combat
 */
function previousTurn() {
    if (!CombatState.isActive || CombatState.initiativeOrder.length === 0) {
        return;
    }
    
    CombatState.currentTurn--;
    
    // Check if we need to go back a round
    if (CombatState.currentTurn < 0) {
        CombatState.currentTurn = CombatState.initiativeOrder.length - 1;
        if (CombatState.round > 1) {
            CombatState.round--;
            addCombatLogEntry(`🔄 Back to **Round ${CombatState.round}**`, 'system');
        }
    }
    
    // Announce current turn
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurn];
    if (currentCharacter) {
        addCombatLogEntry(`👆 **${currentCharacter.character}'s** turn!`, 'system');
    }
    
    // Update UI
    updateInitiativeDisplay();
}

// =============================================================================
// COMMAND ROUTER
// =============================================================================

/**
 * Main command processor for incoming combat commands
 * This should be called from the existing chat message processing system
 * 
 * @param {string} message - Full message from chat
 * @returns {boolean} True if message was a combat command and processed
 */
function processCombatCommand(message) {
    if (!message || typeof message !== 'string') {
        return false;
    }
    
    // Check if message starts with a combat command
    const commandPrefixes = ['INITIATIVE|', 'ATTACK|', 'SPELL|', 'ROLL|'];
    
    for (const prefix of commandPrefixes) {
        if (message.startsWith(prefix)) {
            const commandType = prefix.replace('|', '');
            
            try {
                switch (commandType) {
                    case 'INITIATIVE':
                        processInitiativeCommand(message);
                        break;
                    case 'ATTACK':
                        processAttackCommand(message);
                        break;
                    case 'SPELL':
                        processSpellCommand(message);
                        break;
                    case 'ROLL':
                        processRollCommand(message);
                        break;
                }
                
                return true; // Command was processed
            } catch (error) {
                console.error(`Error processing ${commandType} command:`, error);
                return false;
            }
        }
    }
    
    return false; // Not a combat command
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets the current initiative order as formatted text
 * 
 * @returns {string} Formatted initiative order
 */
function getInitiativeOrderText() {
    if (CombatState.initiativeOrder.length === 0) {
        return 'No initiative rolls yet.';
    }
    
    let text = '**Initiative Order:**\n';
    CombatState.initiativeOrder.forEach((entry, index) => {
        const indicator = index === CombatState.currentTurn ? '👆 ' : '';
        text += `${indicator}${index + 1}. **${entry.character}** (${entry.total})\n`;
    });
    
    return text;
}

/**
 * Clears initiative for a specific character
 * 
 * @param {string} characterName - Name of character to remove
 */
function removeCharacterInitiative(characterName) {
    CombatState.initiativeOrder = CombatState.initiativeOrder.filter(
        entry => entry.character !== characterName
    );
    
    // Adjust current turn if necessary
    if (CombatState.currentTurn >= CombatState.initiativeOrder.length) {
        CombatState.currentTurn = 0;
    }
    
    updateInitiativeDisplay();
    addCombatLogEntry(`❌ Removed **${characterName}** from initiative order.`, 'system');
}

// =============================================================================
// EXPORTS FOR GLOBAL ACCESS
// =============================================================================

// Make functions available globally for integration with existing StoryTeller code
if (typeof window !== 'undefined') {
    window.CombatSystemST = {
        // Combat state management
        startCombatEncounter,
        endCombatEncounter,
        CombatState,
        
        // Command processing
        processCombatCommand,
        processInitiativeCommand,
        processAttackCommand,
        processSpellCommand,
        processRollCommand,
        
        // Turn management
        nextTurn,
        previousTurn,
        
        // Utility functions
        getInitiativeOrderText,
        removeCharacterInitiative,
        updateInitiativeDisplay,
        addCombatLogEntry
    };
}
