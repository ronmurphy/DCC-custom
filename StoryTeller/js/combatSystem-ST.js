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
 * - INITIATIVE:CharacterName:Total:Details (preferred) or INITIATIVE|CharacterName|Total|d20|DEX|LuckDice (legacy)
 * - ATTACK:CharacterName:WeaponName:AttackRoll:DamageRoll (preferred) or ATTACK|... (legacy)
 * - SPELL:CharacterName:SpellName:CastingRoll:Effect:MPCost (preferred) or SPELL|... (legacy)
 * - ROLL:CharacterName:SkillName:RollResult:Modifier (preferred) or ROLL|... (legacy)
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
    turnStarted: false,
    currentTurn: 0,
    currentTurnIndex: 0,
    currentRound: 1,
    initiativeOrder: [],
    actionQueue: [], // New: stores queued actions for each player
    combatLog: [],
    round: 1
};

/**
 * Starts a new combat encounter
 * Resets all combat state and prepares for initiative collection
 */
function startCombatEncounter() {
    CombatState.isActive = true;
    CombatState.turnStarted = false;
    CombatState.currentTurn = 0;
    CombatState.currentTurnIndex = 0;
    CombatState.currentRound = 1;
    CombatState.initiativeOrder = [];
    CombatState.actionQueue = [];

    // Clear previous initiative display
    updateInitiativeDisplay();

    // Add to combat log
    addCombatLogEntry('📢 Combat encounter started! Players, roll initiative with your DEX attribute.', 'system');
}

/**
 * Ends the current combat encounter
 * Resets all combat state
 */
function endCombatEncounter() {
    CombatState.isActive = false;
    CombatState.turnStarted = false;
    CombatState.currentTurn = 0;
    CombatState.currentTurnIndex = 0;
    CombatState.currentRound = 1;
    CombatState.initiativeOrder = [];
    CombatState.actionQueue = [];

    // Clear initiative display
    updateInitiativeDisplay();

    // Add to combat log
    addCombatLogEntry('🏁 Combat encounter ended.', 'system');
}

// =============================================================================
// INITIATIVE SYSTEM
// =============================================================================

/**
 * Processes INITIATIVE command from V4-network player
 * Format: INITIATIVE:CharacterName:Total:Details
 * 
 * @param {string} commandData - Raw command string
 */
function processInitiativeCommand(commandData) {
    // Handle both old pipe format and new colon format
    let parts;
    if (commandData.includes('|')) {
        // Old format: INITIATIVE|CharacterName|Total|d20|DEX|LuckDice
        parts = commandData.split('|');
        if (parts.length < 6) {
            console.error('Invalid INITIATIVE command format (pipe):', commandData);
            return;
        }
    } else {
        // New format: INITIATIVE:CharacterName:Total:Details
        parts = commandData.split(':');
        if (parts.length < 4) {
            console.error('Invalid INITIATIVE command format (colon):', commandData);
            return;
        }
    }
    
    const initiativeData = {
        character: parts[1],
        total: parseInt(parts[2]),
        d20: 0, // Will be extracted from details
        dexModifier: 0, // Will be extracted from details
        luckDice: [],
        details: parts[3] || '',
        timestamp: Date.now()
    };
    
    // Parse details if available (format: "d20(12) + DEX(10) + luck(8) = 30")
    if (parts.length > 3 && parts[3]) {
        const details = parts[3];
        const d20Match = details.match(/d20\((\d+)\)/);
        const dexMatch = details.match(/DEX\(([+-]?\d+)\)/);
        const luckMatch = details.match(/luck\((\d+)\)/);
        
        if (d20Match) initiativeData.d20 = parseInt(d20Match[1]);
        if (dexMatch) initiativeData.dexModifier = parseInt(dexMatch[1]);
        if (luckMatch) initiativeData.luckDice = [parseInt(luckMatch[1])];
    }
    
    // Handle old pipe format fields
    if (commandData.includes('|') && parts.length >= 6) {
        initiativeData.d20 = parseInt(parts[3]) || 0;
        initiativeData.dexModifier = parseInt(parts[4]) || 0;
        initiativeData.luckDice = parts[5] ? parts[5].split(',').map(d => parseInt(d)) : [];
    }
    
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
    const initiativeContainer = document.getElementById('initiative-tracker');
    const statusBar = document.getElementById('combat-status-bar');
    const clearBtn = document.getElementById('clear-initiative-btn');
    const startBtn = document.getElementById('start-combat-btn');
    const nextBtn = document.getElementById('next-turn-btn');
    
    if (!initiativeContainer) return;
    
    console.log('Updating combat display:', CombatState);
    
    if (CombatState.initiativeOrder.length === 0) {
        // Empty state
        initiativeContainer.className = 'initiative-tracker empty';
        initiativeContainer.innerHTML = `
            <div class="empty-state">
                <i class="ra ra-lightning-bolt" style="font-size: 32px; color: #bdc3c7; margin-bottom: 12px;"></i>
                <h6>Ready for Combat</h6>
                <p>Click "Start Combat" to begin collecting initiative rolls</p>
                <p style="font-size: 11px; color: #95a5a6;">Players will use their DEX attribute button to roll initiative</p>
            </div>
        `;
        
        if (statusBar) statusBar.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (startBtn) {
            startBtn.style.display = 'flex';
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="ra ra-horn-call"></i>Start Combat';
            startBtn.onclick = () => startCombatInitiative();
        }
        
    } else if (CombatState.isActive && !CombatState.turnStarted) {
        // Collecting initiative
        initiativeContainer.className = 'initiative-tracker collecting';
        initiativeContainer.innerHTML = generateCombatHTML();
        
        if (statusBar) statusBar.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'none';
        if (startBtn) {
            startBtn.innerHTML = '<i class="material-icons">play_arrow</i>Start Turn Order';
            startBtn.onclick = () => startTurnOrder();
        }
        
    } else if (CombatState.isActive && CombatState.turnStarted) {
        // Active combat
        initiativeContainer.className = 'initiative-tracker active';
        initiativeContainer.innerHTML = generateCombatHTML();
        
        if (statusBar) {
            statusBar.style.display = 'flex';
            updateCombatStatusBar();
        }
        if (clearBtn) clearBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
        if (startBtn) startBtn.style.display = 'none';
    }
}

/**
 * Generates HTML for the unified combat display
 */
function generateCombatHTML() {
    if (CombatState.initiativeOrder.length === 0) return '';
    
    return `
        <div class="combat-list">
            ${CombatState.initiativeOrder.map((participant, index) => {
                const isCurrentTurn = CombatState.turnStarted && index === CombatState.currentTurnIndex;
                const isPlayer = !participant.character.toLowerCase().includes('enemy') && 
                               !participant.character.toLowerCase().includes('goblin') && 
                               !participant.character.toLowerCase().includes('orc') &&
                               !participant.character.toLowerCase().includes('skeleton');
                
                // Check for queued actions
                const queuedAction = getQueuedAction(participant.character);
                const hasAction = queuedAction !== null;
                const canProcess = isCurrentTurn && hasAction;
                
                const luckDisplay = participant.luckDice && participant.luckDice.length > 0 
                    ? ` + luck(${participant.luckDice.join('+')})` 
                    : '';
                
                return `
                    <div class="combat-participant ${isCurrentTurn ? 'current-turn' : ''} ${isPlayer ? 'player' : 'enemy'} ${hasAction ? 'has-action' : ''} ${participant.isNew ? 'new-entry' : ''}">
                        <div class="participant-info">
                            <div class="participant-rank">${index + 1}</div>
                            <div class="participant-details">
                                <div class="participant-name">${participant.character}</div>
                                <div class="participant-stats">
                                    <span>Initiative: ${participant.total}</span>
                                    <span>d20:${participant.d20} + DEX:${participant.dexModifier}${luckDisplay}</span>
                                    <span class="participant-type">${isPlayer ? 'Player' : 'Enemy'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="action-status">
                            ${generateActionStatus(participant.character, isCurrentTurn, hasAction, queuedAction)}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Generates action status display for a participant
 */
function generateActionStatus(characterName, isCurrentTurn, hasAction, queuedAction) {
    if (!hasAction) {
        return `
            <div class="action-indicator waiting">Waiting</div>
        `;
    }
    
    if (isCurrentTurn) {
        return `
            <div class="action-indicator ready">READY TO PROCESS</div>
            <div class="action-preview">${queuedAction.type}: ${queuedAction.preview}</div>
            <button class="process-action-btn" onclick="processQueuedAction('${characterName}')">Process</button>
        `;
    } else {
        return `
            <div class="action-indicator queued">Queued</div>
            <div class="action-preview">${queuedAction.type}: ${queuedAction.preview}</div>
        `;
    }
}

/**
 * Updates the combat status bar
 */
function updateCombatStatusBar() {
    const currentTurnName = document.getElementById('current-turn-name');
    const roundDisplay = document.getElementById('combat-round-display');
    const queuedCount = document.getElementById('queued-count');
    
    if (currentTurnName && CombatState.initiativeOrder.length > 0) {
        const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
        currentTurnName.textContent = currentCharacter ? currentCharacter.character : 'Unknown';
    }
    
    if (roundDisplay) {
        roundDisplay.textContent = CombatState.currentRound;
    }
    
    if (queuedCount) {
        queuedCount.textContent = CombatState.actionQueue.length;
    }
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
    // Handle both colon and pipe formats
    let parts;
    if (commandData.includes(':')) {
        parts = commandData.split(':');
    } else {
        parts = commandData.split('|');
    }
    
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
    
    // Check if it's this character's turn
    if (CombatState.turnStarted && isCurrentTurn(attackData.character)) {
        // Process immediately
        processAttackAction(attackData);
    } else {
        // Queue the action
        queueAction({
            character: attackData.character,
            type: 'ATTACK',
            data: attackData,
            preview: `${attackData.weapon} (${attackData.attackRoll}/${attackData.damageRoll})`
        });
        
        // Format display message for chat
        const message = `⏳ **${attackData.character}** queued attack with **${attackData.weapon}**: Attack roll **${attackData.attackRoll}**, Damage **${attackData.damageRoll}** (waiting for turn)`;
        addCombatLogEntry(message, 'attack-queued');
    }
    
    updateInitiativeDisplay();
}

/**
 * Processes SPELL command from V4-network player
 * Format: SPELL:CharacterName:SpellName:AttackRoll:DamageRoll:MPCost
 * 
 * @param {string} commandData - Raw command string
 */
function processSpellCommand(commandData) {
    // Handle both colon and pipe formats
    let parts;
    if (commandData.includes(':')) {
        parts = commandData.split(':');
    } else {
        parts = commandData.split('|');
    }
    
    if (parts.length < 6) {
        console.error('Invalid SPELL command format:', commandData);
        return;
    }
    
    const spellData = {
        character: parts[1],
        spell: parts[2],
        attackRoll: parseInt(parts[3]),
        damageRoll: parseInt(parts[4]),
        mpCost: parseInt(parts[5]),
        timestamp: Date.now()
    };
    
    // Check if it's this character's turn
    if (CombatState.turnStarted && isCurrentTurn(spellData.character)) {
        // Process immediately
        processSpellAction(spellData);
    } else {
        // Queue the action
        queueAction({
            character: spellData.character,
            type: 'SPELL',
            data: spellData,
            preview: `${spellData.spell} (${spellData.attackRoll}/${spellData.damageRoll}) ${spellData.mpCost}MP`
        });
        
        // Format display message for chat
        const message = `⏳ **${spellData.character}** queued spell **${spellData.spell}**: Attack roll **${spellData.attackRoll}**, Damage **${spellData.damageRoll}**, MP Cost **${spellData.mpCost}** (waiting for turn)`;
        addCombatLogEntry(message, 'spell-queued');
    }
    
    updateInitiativeDisplay();
}

/**
 * Processes ROLL command from V4-network player
 * Format: ROLL:CharacterName:SkillName:Result:Stat
 * 
 * @param {string} commandData - Raw command string
 */
function processRollCommand(commandData) {
    // Handle both colon and pipe formats
    let parts;
    if (commandData.includes(':')) {
        parts = commandData.split(':');
    } else {
        parts = commandData.split('|');
    }
    
    if (parts.length < 5) {
        console.error('Invalid ROLL command format:', commandData);
        return;
    }
    
    const rollData = {
        character: parts[1],
        skill: parts[2],
        result: parseInt(parts[3]),
        stat: parts[4],
        timestamp: Date.now()
    };
    
    // Check if it's this character's turn
    if (CombatState.turnStarted && isCurrentTurn(rollData.character)) {
        // Process immediately
        processRollAction(rollData);
    } else {
        // Queue the action
        queueAction({
            character: rollData.character,
            type: 'SKILL',
            data: rollData,
            preview: `${rollData.skill} (${rollData.result})`
        });
        
        // Format display message for chat
        const message = `⏳ **${rollData.character}** queued skill check **${rollData.skill}** (${rollData.stat}): **${rollData.result}** (waiting for turn)`;
        addCombatLogEntry(message, 'skill-queued');
    }
    
    updateInitiativeDisplay();
}

// =============================================================================
// ACTION QUEUE MANAGEMENT
// =============================================================================

/**
 * Queues an action for later processing
 */
function queueAction(actionData) {
    // Remove any existing action for this character
    CombatState.actionQueue = CombatState.actionQueue.filter(
        action => action.character !== actionData.character
    );
    
    // Add new action
    CombatState.actionQueue.push(actionData);
    
    console.log(`Queued action for ${actionData.character}:`, actionData);
}

/**
 * Gets queued action for a character
 */
function getQueuedAction(characterName) {
    return CombatState.actionQueue.find(action => action.character === characterName) || null;
}

/**
 * Checks if it's currently the specified character's turn
 */
function isCurrentTurn(characterName) {
    if (!CombatState.turnStarted || CombatState.initiativeOrder.length === 0) {
        return false;
    }
    
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    return currentCharacter && currentCharacter.character === characterName;
}

/**
 * Processes a queued action when it's the character's turn
 */
function processQueuedAction(characterName) {
    const queuedAction = getQueuedAction(characterName);
    if (!queuedAction) {
        console.log(`No queued action found for ${characterName}`);
        return;
    }
    
    // Remove from queue
    CombatState.actionQueue = CombatState.actionQueue.filter(
        action => action.character !== characterName
    );
    
    // Process based on type
    switch (queuedAction.type) {
        case 'ATTACK':
            processAttackAction(queuedAction.data);
            break;
        case 'SPELL':
            processSpellAction(queuedAction.data);
            break;
        case 'SKILL':
            processRollAction(queuedAction.data);
            break;
        default:
            console.log('Unknown action type:', queuedAction.type);
    }
    
    updateInitiativeDisplay();
}

/**
 * Processes an attack action immediately
 */
function processAttackAction(attackData) {
    const message = `⚔️ **${attackData.character}** attacks with **${attackData.weapon}**: Attack roll **${attackData.attackRoll}**, Damage **${attackData.damageRoll}**`;
    addCombatLogEntry(message, 'attack');
    console.log('Attack processed:', attackData);
}

/**
 * Processes a spell action immediately
 */
function processSpellAction(spellData) {
    const message = `✨ **${spellData.character}** casts **${spellData.spell}**: Attack roll **${spellData.attackRoll}**, Damage **${spellData.damageRoll}**, MP Cost **${spellData.mpCost}**`;
    addCombatLogEntry(message, 'spell');
    console.log('Spell processed:', spellData);
}

/**
 * Processes a skill roll action immediately
 */
function processRollAction(rollData) {
    const message = `🎲 **${rollData.character}** rolled **${rollData.skill}** (${rollData.stat}): **${rollData.result}**`;
    addCombatLogEntry(message, 'skill');
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
    
    // Check if message starts with a combat command (support both : and | formats)
    const commandPrefixes = ['INITIATIVE:', 'ATTACK:', 'SPELL:', 'ROLL:', 'INITIATIVE|', 'ATTACK|', 'SPELL|', 'ROLL|'];
    
    for (const prefix of commandPrefixes) {
        if (message.startsWith(prefix)) {
            const commandType = prefix.replace(/[:|]/, '');
            
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

// =============================================================================
// UI CONTROL FUNCTIONS - Phase 1.2 Initiative Tracker
// =============================================================================

/**
 * Starts combat and prompts players for initiative
 */
function startCombatInitiative() {
    // Check if there are any combatants (enemies or players)
    if (combatEnemies.length === 0 && combatPlayers.length === 0) {
        alert('Please add enemies to combat before starting.');
        return;
    }
    
    // Start the unified combat system
    startVisualCombat();
    
    // Also trigger traditional combat if an enemy is selected
    if (currentEnemy) {
        startCombatEncounter();
        rollEnemyInitiative();
    }
    
    // Update UI state
    updateInitiativeDisplay();
    updateEnemyDisplay();
    
    // Update compact status bar
    const combatActiveStatus = document.getElementById('combat-active-status');
    const combatRound = document.getElementById('combat-round');
    if (combatActiveStatus) combatActiveStatus.textContent = 'Yes';
    if (combatRound) combatRound.textContent = CombatState.round;
    
    // Send prompt to all players through chat
    const enemyList = combatEnemies.length > 0 ? 
        combatEnemies.map(e => e.name).join(', ') : 
        (currentEnemy ? currentEnemy.name : 'unknown enemies');
    
    const broadcastMessage = `📢 Combat vs ${enemyList} has begun! All players, please roll initiative using your DEX attribute button.`;
    
    // Try multiple broadcast methods
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(broadcastMessage);
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(broadcastMessage);
    } else if (window.supabaseChat && typeof window.supabaseChat.sendChatMessage === 'function') {
        window.supabaseChat.sendChatMessage(broadcastMessage);
    } else {
        console.log(`Chat not available - would send: ${broadcastMessage}`);
    }
    
    console.log(`🎲 Visual combat initiative phase started vs ${enemyList} - waiting for player rolls`);
}

/**
 * Clears all initiative data and resets combat
 */
function clearInitiative() {
    if (confirm('Clear all initiative data and reset combat?')) {
        // End both visual and traditional combat
        endVisualCombat();
        endCombatEncounter();
        
        // Clear visual combat data
        combatEnemies = [];
        combatPlayers = [];
        currentEnemyData = null;
        
        // Update displays
        updateInitiativeDisplay();
        updateArena();
        updateEnemyChips();
        
        // Reset status bar
        const combatActiveStatus = document.getElementById('combat-active-status');
        const combatRound = document.getElementById('combat-round');
        const currentTurnName = document.getElementById('current-turn-name');
        if (combatActiveStatus) combatActiveStatus.textContent = 'No';
        if (combatRound) combatRound.textContent = '0';
        if (currentTurnName) currentTurnName.textContent = '-';
        
        // Reset button visibility
        const startBtn = document.getElementById('start-combat-btn');
        const nextBtn = document.getElementById('next-turn-btn');
        const clearBtn = document.getElementById('clear-initiative-btn');
        const turnOrderBtn = document.getElementById('announce-turn-btn');
        
        if (startBtn) startBtn.style.display = 'inline-block';
        if (turnOrderBtn) turnOrderBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        
        console.log('🧹 Visual combat system cleared');
        
        // Also clear combat log
        const combatLog = document.getElementById('combat-log');
        if (combatLog) {
            combatLog.innerHTML = '<div class="log-entry">⚔️ Combat system ready - add enemies to begin</div>';
        }
    }
}

/**
 * Starts the turn order after collecting all initiative rolls
 */
function startTurnOrder() {
    if (CombatState.initiativeOrder.length === 0) {
        alert('No initiative rolls collected yet. Wait for players to roll initiative.');
        return;
    }
    
    CombatState.turnStarted = true;
    CombatState.currentTurnIndex = 0;
    CombatState.currentRound = 1;
    
    updateInitiativeDisplay();
    
    const currentCharacter = CombatState.initiativeOrder[0];
    addCombatLogEntry(`🎯 Turn order established! ${currentCharacter.character} goes first.`, 'system');
    
    // Send turn notification through chat
    if (typeof sendChatMessage === 'function') {
        sendChatMessage(`⚡ Turn order locked! ${currentCharacter.character}, it's your turn!`);
    }
    
    console.log('🎯 Turn order started:', CombatState.initiativeOrder.map(e => e.character));
}

/**
 * Advances to the next turn in initiative order
 */
function advanceTurn() {
    // Use visual combat system if active
    if (CombatState.isActive) {
        nextTurn();
        return;
    }
    
    // Fallback to traditional system
    if (!CombatState.turnStarted || CombatState.initiativeOrder.length === 0) {
        return;
    }
    
    CombatState.currentTurnIndex++;
    
    // Check if we've completed a round
    if (CombatState.currentTurnIndex >= CombatState.initiativeOrder.length) {
        CombatState.currentTurnIndex = 0;
        CombatState.currentRound++;
        addCombatLogEntry(`🔄 Round ${CombatState.currentRound} begins!`, 'system');
    }
    
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    updateInitiativeDisplay();
    
    addCombatLogEntry(`⚡ ${currentCharacter.character}'s turn begins.`, 'turn');
    
    // Send turn notification through chat
    if (typeof sendChatMessage === 'function') {
        sendChatMessage(`⚡ ${currentCharacter.character}, it's your turn!`);
    }
    
    console.log(`⚡ Turn advanced to: ${currentCharacter.character} (Round ${CombatState.currentRound})`);
}

/**
 * Updates combat state when a new initiative entry is added
 */
function addToInitiativeOrder(initiativeData) {
    // Remove existing entry for this character (if any)
    CombatState.initiativeOrder = CombatState.initiativeOrder.filter(
        entry => entry.character !== initiativeData.character
    );
    
    // Mark as new for animation
    initiativeData.isNew = true;
    
    // Add new entry
    CombatState.initiativeOrder.push(initiativeData);
    
    // Sort by total (highest first)
    CombatState.initiativeOrder.sort((a, b) => b.total - a.total);
    
    // Remove new flag after a short delay for animation
    setTimeout(() => {
        initiativeData.isNew = false;
    }, 500);
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.startCombatInitiative = startCombatInitiative;
    window.clearInitiative = clearInitiative;
    window.startTurnOrder = startTurnOrder;
    window.advanceTurn = advanceTurn;
    window.processQueuedAction = processQueuedAction;
    window.selectEnemy = selectEnemy;
    
    // Visual Combat Manager Functions
    window.loadEnemiesForLevel = loadEnemiesForLevel;
    window.loadEnemyAttacks = loadEnemyAttacks;
    window.addEnemyToCombat = addEnemyToCombat;
    window.removeEnemyFromCombat = removeEnemyFromCombat;
    window.startVisualCombat = startVisualCombat;
    window.endVisualCombat = endVisualCombat;
    window.nextTurn = nextTurn;
    window.updateEnemyAttack = updateEnemyAttack;
    window.executeEnemyAttack = executeEnemyAttack;
    window.applyDamageToEnemy = applyDamageToEnemy;
    window.applyDamageToPlayer = applyDamageToPlayer;
    window.setPlayerStatus = setPlayerStatus;
    window.clearAllEnemies = clearAllEnemies;
    window.announceTurnOrder = announceTurnOrder;
    window.checkAndAnnounceTurnOrder = checkAndAnnounceTurnOrder;
    
    // Debug function to manually test player addition
    window.debugAddPlayer = function(playerName, initiative) {
        console.log(`🔧 DEBUG: Manually adding player ${playerName} with initiative ${initiative}`);
        window.addToInitiativeTracker(playerName, initiative, `Debug roll`);
    };
    
    // Bridge function for supabase-chat.js compatibility
    window.addToInitiativeTracker = function(playerName, roll, details) {
        console.log(`🎯 addToInitiativeTracker called: ${playerName}, ${roll}, ${details}`);
        
        // Convert to our format and add to initiative order
        const initiativeData = {
            character: playerName,
            total: roll,
            d20: 0, // We don't have breakdown from the old format
            dexModifier: 0,
            luckDice: [],
            details: details,
            timestamp: Date.now()
        };
        
        // Add to traditional system
        addToInitiativeOrder(initiativeData);
        updateInitiativeDisplay();
        
        // Add to visual combat system if active OR if enemies have been added
        if (CombatState.isActive || combatEnemies.length > 0 || document.getElementById('start-combat-btn')?.style.display === 'none') {
            console.log(`🎯 Adding ${playerName} to visual combat system`);
            
            // Get real player data from connected players
            let playerData = null;
            if (typeof getConnectedPlayersList === 'function') {
                const connectedPlayers = getConnectedPlayersList();
                playerData = connectedPlayers.find(p => p.name === playerName || p.character_name === playerName);
                console.log(`🎯 Found player data:`, playerData);
            }
            
            // Check if player already exists
            const existingPlayerIndex = combatPlayers.findIndex(p => p.name === playerName);
            
            if (existingPlayerIndex >= 0) {
                // Update existing player's initiative
                combatPlayers[existingPlayerIndex].initiative = roll;
                console.log(`🎯 Updated existing player ${playerName} initiative to ${roll}`);
            } else {
                // Create player with real data or defaults
                const charData = playerData?.character_data || {};
                const stats = charData.stats || {};
                
                const player = {
                    id: `player_${playerName.replace(/\s+/g, '_')}`,
                    name: playerName,
                    hp: stats.hitpoints || stats.current_hp || playerData?.hp || 30,
                    maxHp: stats.hitpoints || stats.max_hp || playerData?.max_hp || 30,
                    ac: stats.armor_class || playerData?.ac || 12,
                    initiative: roll,
                    status: 'waiting',
                    type: 'player',
                    dex_modifier: stats.dexterity_modifier || playerData?.dex_modifier || 0,
                    str_modifier: stats.strength_modifier || 0,
                    level: charData.level || stats.level || 1,
                    // Handle avatar - can be URL or emoji
                    avatar: charData.avatar_url || playerData?.avatar_url || stats.avatar || '👤',
                    // Additional character info
                    class: charData.character_class || charData.class || 'Adventurer',
                    background: charData.background || ''
                };
                combatPlayers.push(player);
                console.log(`🎯 Added new player to visual combat:`, player);
            }
            
            // Update visual display
            updateArena();
            console.log(`🎯 Updated arena. Current players:`, combatPlayers.length, `enemies:`, combatEnemies.length);
            
            // Check if we should announce turn order now
            checkAndAnnounceTurnOrder();
        } else {
            console.log(`🎯 Visual combat not active and no enemies - player not added to arena`);
        }
        
        console.log(`📊 Added ${playerName} to initiative tracker: ${roll}`);
    };
}

// =============================================================================
// ENEMY MANAGEMENT SYSTEM
// =============================================================================

/**
 * Basic enemy database - this could be loaded from JSON in the future
 */
const EnemyDatabase = {
    'goblin-warrior': {
        name: 'Goblin Warrior',
        hp: 12,
        maxHp: 12,
        ac: 13,
        dex: 2,
        level: 2
    },
    'orc-raider': {
        name: 'Orc Raider',
        hp: 18,
        maxHp: 18,
        ac: 14,
        dex: 1,
        level: 3
    },
    'skeleton-archer': {
        name: 'Skeleton Archer',
        hp: 8,
        maxHp: 8,
        ac: 12,
        dex: 3,
        level: 1
    },
    'kobold-scout': {
        name: 'Kobold Scout',
        hp: 6,
        maxHp: 6,
        ac: 11,
        dex: 4,
        level: 1
    },
    'dire-wolf': {
        name: 'Dire Wolf',
        hp: 22,
        maxHp: 22,
        ac: 12,
        dex: 3,
        level: 4
    }
};

let currentEnemy = null;

/**
 * Populates the enemy selector dropdown
 */
function populateEnemySelector() {
    const selector = document.getElementById('enemy-selector');
    if (!selector) return;
    
    // Clear existing options except the first
    selector.innerHTML = '<option value="">Select Enemy...</option>';
    
    // Add enemies from database
    Object.keys(EnemyDatabase).forEach(enemyId => {
        const enemy = EnemyDatabase[enemyId];
        const option = document.createElement('option');
        option.value = enemyId;
        option.textContent = `${enemy.name} (HP: ${enemy.hp}, AC: ${enemy.ac})`;
        selector.appendChild(option);
    });
}

/**
 * Handles enemy selection
 */
function selectEnemy(enemyId) {
    if (!enemyId) {
        currentEnemy = null;
        updateEnemyDisplay();
        return;
    }
    
    const enemy = EnemyDatabase[enemyId];
    if (!enemy) {
        console.error('Enemy not found:', enemyId);
        return;
    }
    
    currentEnemy = { ...enemy, id: enemyId };
    updateEnemyDisplay();
    
    console.log('Selected enemy:', currentEnemy);
}

/**
 * Updates the enemy stats display
 */
function updateEnemyDisplay() {
    const enemyStats = document.getElementById('enemy-stats');
    const enemyName = document.getElementById('current-enemy-name');
    const enemyHp = document.getElementById('enemy-hp');
    const enemyMaxHp = document.getElementById('enemy-max-hp');
    const enemyAc = document.getElementById('enemy-ac');
    const combatActiveStatus = document.getElementById('combat-active-status');
    
    if (currentEnemy) {
        if (enemyStats) enemyStats.style.display = 'inline';
        if (enemyName) enemyName.textContent = currentEnemy.name;
        if (enemyHp) enemyHp.textContent = currentEnemy.hp;
        if (enemyMaxHp) enemyMaxHp.textContent = currentEnemy.maxHp;
        if (enemyAc) enemyAc.textContent = currentEnemy.ac;
        
        // Update combat status to show enemy selected
        if (combatActiveStatus && !CombatState.isActive) {
            combatActiveStatus.textContent = 'Ready';
        }
    } else {
        if (enemyStats) enemyStats.style.display = 'none';
        if (enemyName) enemyName.textContent = 'None';
        if (enemyHp) enemyHp.textContent = '0';
        if (enemyMaxHp) enemyMaxHp.textContent = '0';
        if (enemyAc) enemyAc.textContent = '10';
        
        // Update combat status
        if (combatActiveStatus && !CombatState.isActive) {
            combatActiveStatus.textContent = 'No';
        }
    }
}

/**
 * Auto-rolls initiative for the current enemy when combat starts
 */
function rollEnemyInitiative() {
    if (!currentEnemy) return null;
    
    // Calculate luck dice based on enemy level
    const luckDiceCount = Math.ceil(currentEnemy.level / 10);
    const luckDice = [];
    let luckTotal = 0;
    
    for (let i = 0; i < luckDiceCount; i++) {
        const roll = Math.floor(Math.random() * 10) + 1;
        luckDice.push(roll);
        luckTotal += roll;
    }
    
    // Roll d20 + DEX + luck
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + currentEnemy.dex + luckTotal;
    
    const enemyInitiative = {
        character: currentEnemy.name,
        total: total,
        d20: d20,
        dexModifier: currentEnemy.dex,
        luckDice: luckDice,
        timestamp: Date.now(),
        isEnemy: true
    };
    
    addToInitiativeOrder(enemyInitiative);
    
    console.log(`🎲 ${currentEnemy.name} rolled initiative: ${total} (d20:${d20} + DEX:${currentEnemy.dex} + luck:${luckTotal})`);
    return enemyInitiative;
}

// Initialize enemy selector when the script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            populateEnemySelector();
            updateEnemyDisplay();
        }, 100);
    });
}

// =============================================================================
// VISUAL COMBAT MANAGER FUNCTIONS
// =============================================================================

let currentEnemyData = null;
let combatEnemies = [];
let combatPlayers = [];

/**
 * Load enemies for selected level
 */
async function loadEnemiesForLevel(levelKey) {
    if (!levelKey) {
        const enemySelector = document.getElementById('enemy-selector');
        enemySelector.innerHTML = '<option value="">Choose Enemy...</option>';
        enemySelector.disabled = true;
        return;
    }

    try {
        const response = await fetch('/StoryTeller/data/enemies.json');
        const enemyData = await response.json();
        
        const levelData = enemyData[levelKey];
        if (!levelData || !levelData.enemies) {
            console.warn(`No enemies found for ${levelKey}`);
            return;
        }

        const enemySelector = document.getElementById('enemy-selector');
        enemySelector.innerHTML = '<option value="">Choose Enemy...</option>';
        
        Object.keys(levelData.enemies).forEach(enemyKey => {
            const enemy = levelData.enemies[enemyKey];
            const option = document.createElement('option');
            option.value = enemyKey;
            option.textContent = `${enemy.name} (Lvl ${enemy.level})`;
            option.dataset.floor = levelKey;
            enemySelector.appendChild(option);
        });
        
        enemySelector.disabled = false;
        currentEnemyData = levelData.enemies;
        
    } catch (error) {
        console.error('Error loading enemies:', error);
    }
}

/**
 * Load attacks for selected enemy
 */
function loadEnemyAttacks(enemyKey) {
    const attackSelector = document.getElementById('enemy-attack-selector');
    const addButton = document.getElementById('add-enemy-btn');
    
    if (!enemyKey || !currentEnemyData) {
        attackSelector.innerHTML = '<option value="">Default Attack</option>';
        attackSelector.disabled = true;
        addButton.disabled = true;
        return;
    }

    const enemy = currentEnemyData[enemyKey];
    if (!enemy || !enemy.attacks) {
        attackSelector.innerHTML = '<option value="">Default Attack</option>';
        attackSelector.disabled = true;
        addButton.disabled = true;
        return;
    }

    attackSelector.innerHTML = '<option value="">Default Attack</option>';
    
    enemy.attacks.forEach((attack, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${attack.name} (${attack.damage})`;
        attackSelector.appendChild(option);
    });
    
    attackSelector.disabled = false;
    addButton.disabled = false;
}

/**
 * Add enemy to combat
 */
function addEnemyToCombat() {
    const levelSelector = document.getElementById('level-selector');
    const enemySelector = document.getElementById('enemy-selector');
    const attackSelector = document.getElementById('enemy-attack-selector');
    
    const levelKey = levelSelector.value;
    const enemyKey = enemySelector.value;
    const attackIndex = attackSelector.value;
    
    if (!levelKey || !enemyKey || !currentEnemyData) return;
    
    const enemyTemplate = currentEnemyData[enemyKey];
    if (!enemyTemplate) return;
    
    // Create unique enemy instance
    const enemyId = `${enemyKey}_${Date.now()}`;
    const enemy = {
        id: enemyId,
        name: enemyTemplate.name,
        level: enemyTemplate.level,
        hp: enemyTemplate.hp,
        maxHp: enemyTemplate.hp,
        ac: enemyTemplate.ac,
        attacks: enemyTemplate.attacks,
        selectedAttack: attackIndex ? parseInt(attackIndex) : 0,
        stats: enemyTemplate.stats,
        initiative: 0,
        status: 'waiting'
    };
    
    combatEnemies.push(enemy);
    updateEnemyChips();
    updateArena();
    
    console.log(`Added ${enemy.name} to combat`, enemy);
}

/**
 * Remove enemy from combat
 */
function removeEnemyFromCombat(enemyId) {
    combatEnemies = combatEnemies.filter(e => e.id !== enemyId);
    updateEnemyChips();
    updateArena();
}

/**
 * Update enemy chips display
 */
function updateEnemyChips() {
    const container = document.getElementById('current-enemies');
    if (!container) return;
    
    container.innerHTML = '';
    
    combatEnemies.forEach(enemy => {
        const chip = document.createElement('div');
        chip.className = 'enemy-chip';
        chip.innerHTML = `
            <span class="name">${enemy.name}</span>
            <span class="level">L${enemy.level}</span>
            <button class="remove" onclick="removeEnemyFromCombat('${enemy.id}')" title="Remove">×</button>
        `;
        container.appendChild(chip);
    });
}

/**
 * Update the main arena display
 */
function updateArena() {
    const emptyState = document.getElementById('arena-empty');
    const combatantsGrid = document.getElementById('combatants-grid');
    
    if (!emptyState || !combatantsGrid) return;
    
    const hasCombatants = combatEnemies.length > 0 || combatPlayers.length > 0;
    
    if (hasCombatants) {
        emptyState.style.display = 'none';
        combatantsGrid.style.display = 'grid';
        renderCombatants();
    } else {
        emptyState.style.display = 'block';
        combatantsGrid.style.display = 'none';
    }
}

/**
 * Render combatant cards
 */
function renderCombatants() {
    const grid = document.getElementById('combatants-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Combine and sort by initiative
    const allCombatants = [
        ...combatPlayers.map(p => ({...p, type: 'player'})),
        ...combatEnemies.map(e => ({...e, type: 'enemy'}))
    ].sort((a, b) => b.initiative - a.initiative);
    
    allCombatants.forEach((combatant, index) => {
        const card = createCombatantCard(combatant, index);
        grid.appendChild(card);
    });
}

/**
 * Create a combatant card
 */
function createCombatantCard(combatant, position) {
    const card = document.createElement('div');
    card.className = `combatant-card ${combatant.type}`;
    card.id = `card-${combatant.id}`;
    
    if (CombatState.isActive && position === CombatState.currentTurnIndex) {
        card.classList.add('current-turn');
    }
    
    const hpPercent = (combatant.hp / combatant.maxHp) * 100;
    
    // Handle avatar - could be emoji, URL, or default
    let avatarElement;
    if (combatant.type === 'player') {
        const avatar = combatant.avatar || '👤';
        if (avatar.startsWith('http') || avatar.startsWith('/')) {
            // URL avatar
            avatarElement = `<img src="${avatar}" alt="${combatant.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`;
        } else {
            // Emoji or text avatar
            avatarElement = avatar;
        }
    } else {
        // Enemy emoji avatar
        avatarElement = getEnemyAvatar(combatant.name);
    }
    
    card.innerHTML = `
        <div class="status-indicator status-${combatant.status}">${combatant.status}</div>
        <div class="card-header">
            <div class="avatar">${avatarElement}</div>
            <div class="combatant-info">
                <h4 class="combatant-name">${combatant.name}</h4>
                <div class="combatant-stats">
                    <span>AC: ${combatant.ac}</span>
                    ${combatant.level ? `<span>Lvl: ${combatant.level}</span>` : ''}
                </div>
            </div>
            <div class="initiative-badge">${combatant.initiative}</div>
        </div>
        <div class="hp-container">
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="hp-text">
                <span>HP: ${combatant.hp}/${combatant.maxHp}</span>
                <span>${Math.round(hpPercent)}%</span>
            </div>
        </div>
        ${combatant.type === 'enemy' ? createEnemyControls(combatant) : createPlayerControls(combatant)}
    `;
    
    return card;
}

/**
 * Create enemy-specific controls
 */
function createEnemyControls(enemy) {
    if (!enemy.attacks || enemy.attacks.length === 0) {
        return '<div class="action-controls"><span class="no-attacks">No attacks available</span></div>';
    }
    
    const attackOptions = enemy.attacks.map((attack, index) => 
        `<option value="${index}" ${index === enemy.selectedAttack ? 'selected' : ''}>
            ${attack.name} (${attack.damage})
        </option>`
    ).join('');
    
    return `
        <select class="attack-dropdown" onchange="updateEnemyAttack('${enemy.id}', this.value)">
            ${attackOptions}
        </select>
        <div class="action-controls">
            <button class="action-btn" onclick="executeEnemyAttack('${enemy.id}')">Attack</button>
            <button class="action-btn" onclick="applyDamageToEnemy('${enemy.id}')">Damage</button>
        </div>
    `;
}

/**
 * Create player-specific controls
 */
function createPlayerControls(player) {
    return `
        <div class="action-controls">
            <button class="action-btn" onclick="setPlayerStatus('${player.id}', 'ready')">Ready</button>
            <button class="action-btn" onclick="setPlayerStatus('${player.id}', 'waiting')">Wait</button>
            <button class="action-btn" onclick="applyDamageToPlayer('${player.id}')">Damage</button>
        </div>
    `;
}

/**
 * Get emoji avatar for enemy type
 */
function getEnemyAvatar(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('goblin')) return '👹';
    if (lowerName.includes('rat')) return '🐀';
    if (lowerName.includes('orc')) return '👺';
    if (lowerName.includes('skeleton')) return '💀';
    if (lowerName.includes('kobold')) return '🦎';
    if (lowerName.includes('wolf')) return '🐺';
    if (lowerName.includes('dragon')) return '🐉';
    if (lowerName.includes('spider')) return '🕷️';
    return '👹'; // Default monster emoji
}

/**
 * Update enemy's selected attack
 */
function updateEnemyAttack(enemyId, attackIndex) {
    const enemy = combatEnemies.find(e => e.id === enemyId);
    if (enemy) {
        enemy.selectedAttack = parseInt(attackIndex);
        console.log(`Updated ${enemy.name} attack to: ${enemy.attacks[attackIndex].name}`);
    }
}

/**
 * Execute enemy attack
 */
function executeEnemyAttack(enemyId) {
    const enemy = combatEnemies.find(e => e.id === enemyId);
    if (!enemy || !enemy.attacks || enemy.attacks.length === 0) return;
    
    const attack = enemy.attacks[enemy.selectedAttack];
    if (!attack) return;
    
    const roll = rollD20();
    const message = `${enemy.name} attacks with ${attack.name}! Roll: ${roll}`;
    
    // Add to chat if available
    if (typeof addToChatLog === 'function') {
        addToChatLog(message, 'system');
    } else {
        console.log(message);
    }
    
    enemy.status = 'acted';
    updateArena();
}

/**
 * Apply damage to enemy
 */
function applyDamageToEnemy(enemyId) {
    const damage = prompt('Enter damage amount:');
    if (!damage || isNaN(damage)) return;
    
    const enemy = combatEnemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    const damageAmount = parseInt(damage);
    enemy.hp = Math.max(0, enemy.hp - damageAmount);
    
    if (enemy.hp === 0) {
        enemy.status = 'defeated';
        const message = `${enemy.name} has been defeated!`;
        if (typeof addToChatLog === 'function') {
            addToChatLog(message, 'system');
        }
    }
    
    updateArena();
    console.log(`Applied ${damageAmount} damage to ${enemy.name}`);
}

/**
 * Apply damage to player
 */
function applyDamageToPlayer(playerId) {
    const damage = prompt('Enter damage amount:');
    if (!damage || isNaN(damage)) return;
    
    const player = combatPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    const damageAmount = parseInt(damage);
    player.hp = Math.max(0, player.hp - damageAmount);
    
    if (player.hp === 0) {
        player.status = 'unconscious';
        const message = `${player.name} has fallen unconscious!`;
        if (typeof addToChatLog === 'function') {
            addToChatLog(message, 'system');
        }
    }
    
    updateArena();
    console.log(`Applied ${damageAmount} damage to ${player.name}`);
}

/**
 * Set player status
 */
function setPlayerStatus(playerId, status) {
    const player = combatPlayers.find(p => p.id === playerId);
    if (player) {
        player.status = status;
        updateArena();
        console.log(`Set ${player.name} status to: ${status}`);
    }
}

/**
 * Roll initiative for all combatants
 */
function rollAllInitiative() {
    console.log('🎲 Rolling initiative for all combatants...');
    
    // Roll for enemies
    combatEnemies.forEach(enemy => {
        const initiative = rollD20() + (enemy.stats?.dex_modifier || 0);
        enemy.initiative = initiative;
        console.log(`🎲 ${enemy.name} rolled initiative: ${initiative}`);
    });
    
    // Roll for players (only if they haven't rolled yet)
    combatPlayers.forEach(player => {
        if (!player.initiative || player.initiative === 0) {
            player.initiative = rollD20() + (player.dex_modifier || 0);
            console.log(`🎲 ${player.name} auto-rolled initiative: ${player.initiative}`);
        }
    });
    
    updateArena();
    
    // DON'T auto-announce turn order yet - wait for players to roll manually
    console.log('🎲 Initiative rolled for enemies. Waiting for players to roll manually...');
}

/**
 * Check if all expected players have rolled initiative and announce turn order
 * This should be called after each player rolls
 */
function checkAndAnnounceTurnOrder() {
    // Only check if we have enemies (combat has been started)
    if (combatEnemies.length === 0) return;
    
    // Get connected players count (minus storyteller)
    const connectedPlayers = typeof getConnectedPlayersList === 'function' ? getConnectedPlayersList() : [];
    const storytellerName = window.currentCharacterName || 'StoryTeller';
    const expectedPlayerCount = connectedPlayers.filter(p => 
        p.name !== storytellerName && 
        p.character_name !== storytellerName
    ).length;
    
    console.log(`🎯 Expected players: ${expectedPlayerCount}, Players with initiative: ${combatPlayers.length}`);
    
    // Check if all expected players have rolled initiative
    const playersWithInitiative = combatPlayers.filter(p => p.initiative && p.initiative > 0);
    
    if (expectedPlayerCount > 0 && playersWithInitiative.length >= expectedPlayerCount) {
        console.log('🎯 All expected players have rolled initiative. Announcing turn order in 2 seconds...');
        setTimeout(() => {
            announceTurnOrder();
        }, 2000);
    } else if (playersWithInitiative.length > 0) {
        console.log(`🎯 ${playersWithInitiative.length}/${expectedPlayerCount} players have rolled initiative. Waiting for more...`);
    } else {
        console.log('🎯 Still waiting for players to roll initiative...');
    }
}

/**
 * Announce the current turn order to all players
 */
function announceTurnOrder() {
    const allCombatants = [...combatPlayers, ...combatEnemies]
        .filter(c => c.status !== 'defeated' && c.status !== 'unconscious')
        .sort((a, b) => b.initiative - a.initiative);
    
    if (allCombatants.length === 0) return;
    
    const turnOrderText = allCombatants
        .map((c, index) => `${index + 1}. ${c.name} (${c.initiative})`)
        .join('\n');
    
    const message = `⚔️ **Turn Order:**\n${turnOrderText}\n\n🎯 ${allCombatants[0].name} goes first!`;
    
    // Send to chat
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(message);
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(message);
    }
    
    console.log('🎯 Turn order announced:', message);
}

/**
 * Start visual combat
 */
function startVisualCombat() {
    if (combatEnemies.length === 0 && combatPlayers.length === 0) {
        alert('Add combatants before starting combat!');
        return;
    }
    
    rollAllInitiative();
    
    CombatState.isActive = true;
    CombatState.currentTurnIndex = 0;
    CombatState.round = 1;
    
    // Update button visibility
    const startBtn = document.getElementById('start-combat-btn');
    const nextBtn = document.getElementById('next-turn-btn');
    const clearBtn = document.getElementById('clear-initiative-btn');
    const turnOrderBtn = document.getElementById('announce-turn-btn');
    
    if (startBtn) startBtn.style.display = 'none';
    if (turnOrderBtn) turnOrderBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'inline-block';
    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    updateArena();
    updateCombatStatus();
    
    const message = 'Combat has begun! Initiative rolled.';
    if (typeof addToChatLog === 'function') {
        addToChatLog(message, 'system');
    }
    console.log(message);
}

/**
 * End visual combat
 */
function endVisualCombat() {
    CombatState.isActive = false;
    CombatState.currentTurnIndex = 0;
    CombatState.round = 1;
    
    // Reset all statuses
    [...combatEnemies, ...combatPlayers].forEach(combatant => {
        if (combatant.status !== 'defeated' && combatant.status !== 'unconscious') {
            combatant.status = 'waiting';
        }
    });
    
    // Update button visibility
    const startBtn = document.getElementById('start-combat-btn');
    const nextBtn = document.getElementById('next-turn-btn');
    const clearBtn = document.getElementById('clear-initiative-btn');
    
    if (startBtn) startBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    
    updateArena();
    updateCombatStatus();
    
    const message = 'Combat has ended.';
    if (typeof addToChatLog === 'function') {
        addToChatLog(message, 'system');
    }
    console.log(message);
}

/**
 * Next turn in combat
 */
function nextTurn() {
    if (!CombatState.isActive) return;
    
    const allCombatants = [...combatPlayers, ...combatEnemies]
        .filter(c => c.status !== 'defeated' && c.status !== 'unconscious')
        .sort((a, b) => b.initiative - a.initiative);
    
    if (allCombatants.length === 0) {
        endVisualCombat();
        return;
    }
    
    CombatState.currentTurnIndex = (CombatState.currentTurnIndex + 1) % allCombatants.length;
    
    if (CombatState.currentTurnIndex === 0) {
        CombatState.round++;
        // Reset statuses for new round
        [...combatEnemies, ...combatPlayers].forEach(combatant => {
            if (combatant.status === 'acted') {
                combatant.status = 'waiting';
            }
        });
    }
    
    updateArena();
    updateCombatStatus();
    
    const currentCombatant = allCombatants[CombatState.currentTurnIndex];
    const message = `Round ${CombatState.round}: ${currentCombatant.name}'s turn`;
    if (typeof addToChatLog === 'function') {
        addToChatLog(message, 'system');
    }
    console.log(message);
}

/**
 * Update combat status display
 */
function updateCombatStatus() {
    // Update compact status bar elements
    const combatActiveStatus = document.getElementById('combat-active-status');
    const combatRound = document.getElementById('combat-round');
    const currentTurnName = document.getElementById('current-turn-name');
    
    if (!CombatState.isActive) {
        if (combatActiveStatus) combatActiveStatus.textContent = 'No';
        if (combatRound) combatRound.textContent = '0';
        if (currentTurnName) currentTurnName.textContent = '-';
        return;
    }
    
    // Update basic status
    if (combatActiveStatus) combatActiveStatus.textContent = 'Yes';
    if (combatRound) combatRound.textContent = CombatState.round;
    
    // Find current combatant
    const allCombatants = [...combatPlayers, ...combatEnemies]
        .filter(c => c.status !== 'defeated' && c.status !== 'unconscious')
        .sort((a, b) => b.initiative - a.initiative);
    
    if (allCombatants.length === 0) {
        if (currentTurnName) currentTurnName.textContent = 'No Active Combatants';
        return;
    }
    
    const currentCombatant = allCombatants[CombatState.currentTurnIndex];
    if (currentTurnName) currentTurnName.textContent = currentCombatant.name;
}

/**
 * Clear all enemies from combat
 */
function clearAllEnemies() {
    if (confirm('Remove all enemies from combat?')) {
        combatEnemies = [];
        updateEnemyChips();
        updateArena();
    }
}

/**
 * Utility function for D20 rolls
 */
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// Initialize visual combat when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up level selector change handler
    const levelSelector = document.getElementById('level-selector');
    if (levelSelector) {
        levelSelector.addEventListener('change', function() {
            loadEnemiesForLevel(this.value);
        });
    }
    
    // Set up enemy selector change handler
    const enemySelector = document.getElementById('enemy-selector');
    if (enemySelector) {
        enemySelector.addEventListener('change', function() {
            loadEnemyAttacks(this.value);
        });
    }
    
    // Initial arena update
    updateArena();
});
