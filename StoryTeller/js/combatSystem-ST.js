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
 * Format: SPELL|CharacterName|SpellName|AttackRoll|DamageRoll|MPCost
 * 
 * @param {string} commandData - Raw command string
 */
function processSpellCommand(commandData) {
    const parts = commandData.split('|');
    
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
 * Format: ROLL|CharacterName|SkillName|Result|Stat
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

// =============================================================================
// UI CONTROL FUNCTIONS - Phase 1.2 Initiative Tracker
// =============================================================================

/**
 * Starts combat and prompts players for initiative
 */
function startCombatInitiative() {
    startCombatEncounter();
    
    // Update UI state
    updateInitiativeDisplay();
    
    // Send prompt to all players through chat
    if (typeof sendChatMessage === 'function') {
        sendChatMessage('📢 Combat has begun! All players, please roll initiative using your DEX attribute button.');
    } else {
        console.log('Chat not available - would send: Combat has begun! All players, please roll initiative using your DEX attribute button.');
    }
    
    console.log('🎲 Combat initiative phase started - waiting for player rolls');
}

/**
 * Clears all initiative data and resets combat
 */
function clearInitiative() {
    if (confirm('Clear all initiative data and reset combat?')) {
        endCombatEncounter();
        updateInitiativeDisplay();
        console.log('🧹 Initiative tracker cleared');
        
        // Also clear combat log
        const combatLog = document.getElementById('combat-log');
        if (combatLog) {
            combatLog.innerHTML = '<div class="log-entry">⚔️ Combat system ready - select an enemy to begin</div>';
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
    
    // Bridge function for supabase-chat.js compatibility
    window.addToInitiativeTracker = function(playerName, roll, details) {
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
        
        addToInitiativeOrder(initiativeData);
        updateInitiativeDisplay();
        
        console.log(`📊 Added ${playerName} to initiative tracker: ${roll}`);
    };
}
