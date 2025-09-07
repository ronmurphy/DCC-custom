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
    // Broadcast combat stop to all connected players
    const combatStopCommand = 'COMBAT_STOP:ALL:Combat ended by StoryTeller';
    console.log('🔧 DEBUG: About to send combat stop command:', combatStopCommand);
    
    if (typeof sendChatMessageAsync === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessageAsync for stop');
        sendChatMessageAsync(combatStopCommand);
        console.log('📡 Combat stop broadcasted to all players (async)');
    } else if (typeof sendChatMessage === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessage for stop - this may not work as expected');
        sendChatMessage(combatStopCommand);
        console.log('📡 Combat stop broadcasted to all players');
    } else {
        console.error('🔧 DEBUG: No sendChatMessage function available for stop!');
    }
    
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
    
    // 🎯 NEW: Auto-add player to visual combat manager
    autoAddPlayerToCombat(initiativeData.character, initiativeData.total);
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
    
    // Handle different V4-network format: ATTACK:Testificate:26:13:Pistol
    // vs expected format: ATTACK:Testificate:Pistol:13:DamageRoll
    let attackData;
    
    if (parts.length >= 5) {
        // Check if parts[2] is a number (V4-network format)
        if (!isNaN(parseInt(parts[2]))) {
            // V4-network format: ATTACK:Testificate:TotalDamage:AttackRoll:WeaponName
            attackData = {
                character: parts[1],
                weapon: parts[4] || 'Weapon',
                attackRoll: parseInt(parts[3]),
                damageRoll: parseInt(parts[2]), // Total damage in V4 format
                timestamp: Date.now()
            };
            console.log('🔧 DEBUG: Using V4-network attack format:', attackData);
        } else {
            // Expected format: ATTACK:Testificate:Pistol:13:DamageRoll
            attackData = {
                character: parts[1],
                weapon: parts[2],
                attackRoll: parseInt(parts[3]),
                damageRoll: parseInt(parts[4]),
                timestamp: Date.now()
            };
            console.log('🔧 DEBUG: Using standard attack format:', attackData);
        }
    } else if (parts.length >= 4) {
        // Fallback for 4-part format
        attackData = {
            character: parts[1],
            weapon: parts[2] || 'Weapon',
            attackRoll: parseInt(parts[3]),
            damageRoll: parseInt(parts[3]), // Use attack roll as damage if no damage specified
            timestamp: Date.now()
        };
        console.log('🔧 DEBUG: Using fallback attack format:', attackData);
    } else {
        console.error('Invalid ATTACK command format:', commandData);
        return;
    }
    
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
    let message = `⚔️ **${attackData.character}** attacks with **${attackData.weapon}**: Attack roll **${attackData.attackRoll}**, Damage **${attackData.damageRoll}**`;
    
    // Try to apply damage to enemies in visual combat system
    let damageApplied = false;
    
    // Look for enemies to damage
    if (typeof combatEnemies !== 'undefined' && Array.isArray(combatEnemies)) {
        for (let enemy of combatEnemies) {
            if (enemy.status !== 'defeated' && enemy.status !== 'unconscious') {
                // Apply damage to the first available enemy (in real game, player would choose target)
                const oldHp = enemy.hp;
                enemy.hp = Math.max(0, enemy.hp - attackData.damageRoll);
                
                message += ` → **${enemy.name}** takes ${attackData.damageRoll} damage! (${oldHp} → ${enemy.hp} HP)`;
                
                // Check if enemy is defeated
                if (enemy.hp <= 0) {
                    enemy.status = 'defeated';
                    message += ` **${enemy.name} is defeated!**`;
                }
                
                damageApplied = true;
                console.log(`💥 Applied ${attackData.damageRoll} damage to ${enemy.name}: ${oldHp} → ${enemy.hp} HP`);
                
                // Update visual display
                if (typeof updateArena === 'function') {
                    updateArena();
                }
                
                break; // Only damage one enemy for now
            }
        }
    }
    
    // If no enemy found in visual combat, try traditional enemy system
    if (!damageApplied && typeof currentEnemy !== 'undefined' && currentEnemy && currentEnemy.hp) {
        const oldHp = currentEnemy.hp;
        currentEnemy.hp = Math.max(0, currentEnemy.hp - attackData.damageRoll);
        
        message += ` → **${currentEnemy.name}** takes ${attackData.damageRoll} damage! (${oldHp} → ${currentEnemy.hp} HP)`;
        
        if (currentEnemy.hp <= 0) {
            message += ` **${currentEnemy.name} is defeated!**`;
        }
        
        damageApplied = true;
        console.log(`💥 Applied ${attackData.damageRoll} damage to ${currentEnemy.name}: ${oldHp} → ${currentEnemy.hp} HP`);
        
        // Update enemy display
        if (typeof updateEnemyDisplay === 'function') {
            updateEnemyDisplay();
        }
    }
    
    if (!damageApplied) {
        message += ` (No valid target found)`;
        console.log('⚠️ No valid enemy target found for damage application');
    }
    
    addCombatLogEntry(message, 'attack');
    console.log('Attack processed:', attackData);
}

/**
 * Processes a spell action immediately
 */
function processSpellAction(spellData) {
    let message = `✨ **${spellData.character}** casts **${spellData.spell}**: Attack roll **${spellData.attackRoll}**, Damage **${spellData.damageRoll}**, MP Cost **${spellData.mpCost}**`;
    
    // Try to apply damage to enemies if this is a damage spell
    let damageApplied = false;
    
    if (spellData.damageRoll > 0) {
        // Look for enemies to damage in visual combat system
        if (typeof combatEnemies !== 'undefined' && Array.isArray(combatEnemies)) {
            for (let enemy of combatEnemies) {
                if (enemy.status !== 'defeated' && enemy.status !== 'unconscious') {
                    const oldHp = enemy.hp;
                    enemy.hp = Math.max(0, enemy.hp - spellData.damageRoll);
                    
                    message += ` → **${enemy.name}** takes ${spellData.damageRoll} magical damage! (${oldHp} → ${enemy.hp} HP)`;
                    
                    if (enemy.hp <= 0) {
                        enemy.status = 'defeated';
                        message += ` **${enemy.name} is defeated!**`;
                    }
                    
                    damageApplied = true;
                    console.log(`✨ Applied ${spellData.damageRoll} magical damage to ${enemy.name}: ${oldHp} → ${enemy.hp} HP`);
                    
                    if (typeof updateArena === 'function') {
                        updateArena();
                    }
                    
                    break;
                }
            }
        }
        
        // Try traditional enemy system if no visual enemy found
        if (!damageApplied && typeof currentEnemy !== 'undefined' && currentEnemy && currentEnemy.hp) {
            const oldHp = currentEnemy.hp;
            currentEnemy.hp = Math.max(0, currentEnemy.hp - spellData.damageRoll);
            
            message += ` → **${currentEnemy.name}** takes ${spellData.damageRoll} magical damage! (${oldHp} → ${currentEnemy.hp} HP)`;
            
            if (currentEnemy.hp <= 0) {
                message += ` **${currentEnemy.name} is defeated!**`;
            }
            
            damageApplied = true;
            console.log(`✨ Applied ${spellData.damageRoll} magical damage to ${currentEnemy.name}: ${oldHp} → ${currentEnemy.hp} HP`);
            
            if (typeof updateEnemyDisplay === 'function') {
                updateEnemyDisplay();
            }
        }
    }
    
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
    
    // Broadcast combat start to all connected players
    const combatStartCommand = 'COMBAT_START:ALL:Combat initiated by StoryTeller';
    console.log('🔧 DEBUG: About to send combat command:', combatStartCommand);
    
    if (typeof sendChatMessageAsync === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessageAsync');
        sendChatMessageAsync(combatStartCommand);
        console.log('📡 Combat start broadcasted to all players (async)');
    } else if (typeof sendChatMessage === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessage - this may not work as expected');
        sendChatMessage(combatStartCommand);
        console.log('📡 Combat start broadcasted to all players');
    } else {
        console.error('🔧 DEBUG: No sendChatMessage function available!');
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
    
    // Update both initiative display and visual combat arena
    updateInitiativeDisplay();
    updateArena(); // Refresh arena to show turn indicators
    
    const currentCharacter = CombatState.initiativeOrder[0];
    addCombatLogEntry(`🎯 Turn order established! ${currentCharacter.character} goes first.`, 'system');
    
    // Send turn notification through chat with enhanced messaging
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(`⚡ **Turn order locked!** ${currentCharacter.character}, it's your turn! Use your attack, spell, or skill buttons.`);
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(`⚡ **Turn order locked!** ${currentCharacter.character}, it's your turn! Use your attack, spell, or skill buttons.`);
    }
    
    // Update arena to highlight current turn
    highlightCurrentTurn();
    
    console.log('🎯 Turn order started:', CombatState.initiativeOrder.map(e => e.character));
    console.log(`🎯 Current turn: ${currentCharacter.character} (index ${CombatState.currentTurnIndex})`);
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
 * Highlights the current turn character in the visual arena
 */
function highlightCurrentTurn() {
    if (!CombatState.turnStarted || CombatState.initiativeOrder.length === 0) {
        return;
    }
    
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    if (!currentCharacter) return;
    
    // Find the character in combat arrays and mark as current turn
    const playerIndex = combatPlayers.findIndex(p => p.name === currentCharacter.character);
    const enemyIndex = combatEnemies.findIndex(e => e.name === currentCharacter.character);
    
    // Reset all turn statuses
    combatPlayers.forEach(p => p.isCurrentTurn = false);
    combatEnemies.forEach(e => e.isCurrentTurn = false);
    
    // Set current turn
    if (playerIndex >= 0) {
        combatPlayers[playerIndex].isCurrentTurn = true;
        combatPlayers[playerIndex].status = 'active';
        console.log(`🎯 Highlighted ${currentCharacter.character} as current turn (player)`);
    } else if (enemyIndex >= 0) {
        combatEnemies[enemyIndex].isCurrentTurn = true;
        combatEnemies[enemyIndex].status = 'active';
        console.log(`🎯 Highlighted ${currentCharacter.character} as current turn (enemy)`);
    }
    
    // Update arena display
    updateArena();
}
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

/**
 * Starts combat for a specific player (for split party situations)
 * @param {string} playerName - Name of the player to start combat for
 * @param {string} enemyDescription - Optional description of what they're fighting
 */
function startCombatForPlayer(playerName, enemyDescription = '') {
    if (!playerName) {
        console.error('Player name required for individual combat start');
        return;
    }
    
    const message = enemyDescription ? 
        `Combat vs ${enemyDescription} initiated for ${playerName}` :
        `Combat initiated for ${playerName}`;
    
    // Broadcast combat start to specific player
    const combatStartCommand = `COMBAT_START:${playerName}:${message}`;
    console.log('🔧 DEBUG: About to send individual combat start command:', combatStartCommand);
    
    if (typeof sendChatMessageAsync === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessageAsync for individual start');
        sendChatMessageAsync(combatStartCommand);
        console.log(`📡 Combat start broadcasted to ${playerName} (async)`);
    } else if (typeof sendChatMessage === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessage for individual start - this may not work as expected');
        sendChatMessage(combatStartCommand);
        console.log(`📡 Combat start broadcasted to ${playerName}`);
    } else {
        console.error('🔧 DEBUG: No sendChatMessage function available for individual start!');
    }
    
    // Also send a general notification to the storyteller
    const broadcastMessage = `⚔️ ${playerName} has entered combat${enemyDescription ? ` vs ${enemyDescription}` : ''}! They should roll initiative.`;
    
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(broadcastMessage);
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(broadcastMessage);
    }
    
    console.log(`🎲 Individual combat started for ${playerName}${enemyDescription ? ` vs ${enemyDescription}` : ''}`);
}

/**
 * Ends combat for a specific player (for split party situations)
 * @param {string} playerName - Name of the player to end combat for
 * @param {string} outcome - Optional outcome description
 */
function endCombatForPlayer(playerName, outcome = '') {
    if (!playerName) {
        console.error('Player name required for individual combat end');
        return;
    }
    
    const message = outcome ? 
        `Combat ended for ${playerName}: ${outcome}` :
        `Combat ended for ${playerName}`;
    
    // Broadcast combat end to specific player
    const combatEndCommand = `COMBAT_END:${playerName}:${message}`;
    console.log('🔧 DEBUG: About to send individual combat end command:', combatEndCommand);
    
    if (typeof sendChatMessageAsync === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessageAsync for individual end');
        sendChatMessageAsync(combatEndCommand);
        console.log(`📡 Combat end broadcasted to ${playerName} (async)`);
    } else if (typeof sendChatMessage === 'function') {
        console.log('🔧 DEBUG: Using sendChatMessage for individual end - this may not work as expected');
        sendChatMessage(combatEndCommand);
        console.log(`📡 Combat end broadcasted to ${playerName}`);
    } else {
        console.error('🔧 DEBUG: No sendChatMessage function available for individual end!');
    }
    
    // Also send a general notification to the storyteller
    const broadcastMessage = `🏁 ${playerName}'s combat has ended${outcome ? `: ${outcome}` : ''}.`;
    
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(broadcastMessage);
    } else if (typeof sendChatMessage === 'function') {
        sendChatMessage(broadcastMessage);
    }
    
    console.log(`🏁 Individual combat ended for ${playerName}${outcome ? `: ${outcome}` : ''}`);
}

/**
 * Helper function to check if a player name belongs to the storyteller
 * @param {string} playerName - Name to check
 * @returns {boolean} True if this is the storyteller
 */
function isStorytellerName(playerName) {
    if (!playerName) return false;
    
    // FIRST: Check the connected players list for the is_storyteller flag (most reliable)
    if (typeof getConnectedPlayersList === 'function') {
        const connectedPlayers = getConnectedPlayersList();
        const playerRecord = connectedPlayers.find(p => 
            p.name === playerName || p.character_name === playerName
        );
        
        if (playerRecord && playerRecord.is_storyteller === true) {
            console.log(`🎯 DEBUG: ${playerName} identified as storyteller via is_storyteller flag`);
            return true;
        }
    }
    
    // FALLBACK: Check name patterns (for cases where connected players isn't available)
    const storytellerNameInput = document.getElementById('storyteller-name');
    const storytellerName = storytellerNameInput?.value || window.currentCharacterName || window.playerName || 'StoryTeller';
    
    console.log(`🎯 DEBUG: isStorytellerName fallback check - "${playerName}" vs storyteller "${storytellerName}"`);
    
    // Check various common storyteller identifiers
    const lowerName = playerName.toLowerCase();
    return playerName === storytellerName ||
           lowerName.includes('storyteller') ||
           lowerName.includes('session master') ||
           lowerName.includes('dungeon master') ||
           lowerName === 'dm' ||
           lowerName === 'gm' ||
           lowerName === storytellerName?.toLowerCase();
}

/**
 * Auto-adds a player to the visual combat manager when they roll initiative
 * This is called automatically from processInitiativeCommand
 */
function autoAddPlayerToCombat(playerName, initiative) {
    console.log(`🎯 autoAddPlayerToCombat called: ${playerName}, initiative: ${initiative}`);
    
    // Don't add the storyteller to combat - they manage enemies instead
    if (isStorytellerName(playerName)) {
        console.log(`🎯 Skipping auto-add for storyteller: ${playerName}`);
        return;
    }
    
    // Only add if we have enemies in combat or combat is active
    if (combatEnemies.length === 0 && !CombatState.isActive) {
        console.log(`🎯 No enemies in combat and combat not active - skipping auto-add for ${playerName}`);
        return;
    }
    
    // Check if player already exists in combat
    const existingPlayerIndex = combatPlayers.findIndex(p => p.name === playerName);
    
    if (existingPlayerIndex >= 0) {
        // Update existing player's initiative
        combatPlayers[existingPlayerIndex].initiative = initiative;
        console.log(`🎯 Updated existing player ${playerName} initiative to ${initiative}`);
    } else {
        // Get real player data from connected players if available
        let playerData = null;
        if (typeof getConnectedPlayersList === 'function') {
            const connectedPlayers = getConnectedPlayersList();
            playerData = connectedPlayers.find(p => p.name === playerName || p.character_name === playerName);
            console.log(`🎯 Found connected player data for ${playerName}:`, playerData);
        }
        
        // Create player with real data or defaults
        const charData = playerData?.character_data || {};
        const stats = charData.stats || {};
        
        // Try to get cached avatar URL (this is already working great!)
        let avatarUrl = charData.avatar_url || playerData?.avatar_url || stats.avatar;
        
        // Check if there's a cached avatar URL available (like we saw with Testificate)
        if (typeof window.getCachedAvatarUrl === 'function') {
            const cachedAvatar = window.getCachedAvatarUrl(playerName);
            if (cachedAvatar) {
                avatarUrl = cachedAvatar;
                console.log(`🎨 Using cached avatar URL for ${playerName}: ${cachedAvatar}`);
            }
        }
        
        const player = {
            id: `player_${playerName.replace(/\s+/g, '_')}`,
            name: playerName,
            hp: stats.hitpoints || stats.current_hp || playerData?.hp || 30,
            maxHp: stats.hitpoints || stats.max_hp || playerData?.max_hp || 30,
            ac: stats.armor_class || playerData?.ac || 12,
            initiative: initiative,
            status: 'waiting',
            type: 'player',
            dex_modifier: stats.dexterity_modifier || playerData?.dex_modifier || 0,
            str_modifier: stats.strength_modifier || 0,
            level: charData.level || stats.level || 1,
            // Use the cached avatar URL instead of emoji fallback
            avatar: avatarUrl || '👤',
            // Additional character info
            class: charData.character_class || charData.class || 'Adventurer',
            background: charData.background || ''
        };
        
        combatPlayers.push(player);
        console.log(`🎯 Auto-added new player to visual combat:`, player);
    }
    
    // Update visual display
    updateArena();
    console.log(`🎯 Updated arena after auto-add. Current players: ${combatPlayers.length}, enemies: ${combatEnemies.length}`);
    
    // Check if we should announce turn order now
    if (typeof checkAndAnnounceTurnOrder === 'function') {
        checkAndAnnounceTurnOrder();
    }
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.startCombatInitiative = startCombatInitiative;
    window.clearInitiative = clearInitiative;
    window.startTurnOrder = startTurnOrder;
    window.advanceTurn = advanceTurn;
    window.processQueuedAction = processQueuedAction;
    window.selectEnemy = selectEnemy;
    
    // Auto-add player function
    window.autoAddPlayerToCombat = autoAddPlayerToCombat;
    
    // Helper functions
    window.isStorytellerName = isStorytellerName;
    
    // Combat command helpers for individual player management
    window.startCombatForPlayer = startCombatForPlayer;
    window.endCombatForPlayer = endCombatForPlayer;
    
    // Visual Combat Manager Functions
    window.loadEnemiesForLevel = loadEnemiesForLevel;
    window.loadEnemyAttacks = loadEnemyAttacks;
    window.addEnemyToCombat = addEnemyToCombat;
    window.removeEnemyFromCombat = removeEnemyFromCombat;
    window.startVisualCombat = startVisualCombat;
    window.endVisualCombat = endVisualCombat;
    window.nextTurn = nextTurn;
    window.updateEnemyAttack = updateEnemyAttack;
    window.updateEnemyTarget = updateEnemyTarget;
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
    
    // Debug function to test arena directly
    window.debugTestArena = function() {
        console.log('🔧 DEBUG: Testing arena directly');
        console.log('🔧 Current combatPlayers:', combatPlayers);
        console.log('🔧 Current combatEnemies:', combatEnemies);
        
        // Add a test player directly to the array
        if (combatPlayers.length === 0) {
            combatPlayers.push({
                id: 'test_player',
                name: 'Test Player',
                hp: 25,
                maxHp: 30,
                ac: 14,
                initiative: 15,
                status: 'waiting',
                type: 'player',
                avatar: '🧙‍♂️',
                level: 3,
                class: 'Wizard'
            });
            console.log('🔧 Added test player to combatPlayers array');
        }
        
        // Add a test enemy if none exist
        if (combatEnemies.length === 0) {
            combatEnemies.push({
                id: 'test_goblin',
                name: 'Test Goblin',
                hp: 8,
                maxHp: 12,
                ac: 13,
                initiative: 12,
                status: 'waiting',
                type: 'enemy',
                level: 1
            });
            console.log('🔧 Added test enemy to combatEnemies array');
        }
        
        updateArena();
        console.log('🔧 Arena update called');
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
        
        // Add to traditional system (always add to initiative display, even storyteller)
        addToInitiativeOrder(initiativeData);
        updateInitiativeDisplay();
        
        // Skip visual combat addition if this is the storyteller
        if (isStorytellerName(playerName)) {
            console.log(`🎯 Skipping visual combat addition for storyteller: ${playerName}`);
            return;
        }
        
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
    console.log(`🏟️ updateArena called - Players: ${combatPlayers.length}, Enemies: ${combatEnemies.length}`);
    
    const emptyState = document.getElementById('arena-empty');
    const combatantsGrid = document.getElementById('combatants-grid');
    
    console.log(`🏟️ DOM elements found - emptyState: ${!!emptyState}, combatantsGrid: ${!!combatantsGrid}`);
    
    if (!emptyState || !combatantsGrid) {
        console.error('🚨 Missing DOM elements for arena update!');
        return;
    }
    
    const hasCombatants = combatEnemies.length > 0 || combatPlayers.length > 0;
    console.log(`🏟️ Has combatants: ${hasCombatants} (players: ${combatPlayers.length}, enemies: ${combatEnemies.length})`);
    
    if (hasCombatants) {
        emptyState.style.display = 'none';
        combatantsGrid.style.display = 'grid';
        console.log(`🏟️ Showing grid, calling renderCombatants()`);
        renderCombatants();
    } else {
        emptyState.style.display = 'block';
        combatantsGrid.style.display = 'none';
        console.log(`🏟️ Showing empty state`);
    }
}

/**
 * Render combatant cards
 */
function renderCombatants() {
    console.log(`🎨 renderCombatants called`);
    const grid = document.getElementById('combatants-grid');
    if (!grid) {
        console.error('🚨 No combatants-grid element found!');
        return;
    }
    
    console.log(`🎨 Grid element found, clearing content`);
    grid.innerHTML = '';
    
    // Combine and sort by initiative
    const allCombatants = [
        ...combatPlayers.map(p => ({...p, type: 'player'})),
        ...combatEnemies.map(e => ({...e, type: 'enemy'}))
    ].sort((a, b) => b.initiative - a.initiative);
    
    console.log(`🎨 Total combatants to render: ${allCombatants.length}`, allCombatants);
    
    allCombatants.forEach((combatant, index) => {
        console.log(`🎨 Creating card for ${combatant.name} (${combatant.type})`);
        const card = createCombatantCard(combatant, index);
        grid.appendChild(card);
        console.log(`🎨 Card added to grid for ${combatant.name}`);
    });
    
    console.log(`🎨 Render complete. Grid has ${grid.children.length} children`);
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
    
    // Get targeting info for enemies
    let targetingIndicator = '';
    if (combatant.type === 'enemy' && combatant.targetId) {
        const targetPlayer = combatPlayers.find(p => p.id === combatant.targetId);
        if (targetPlayer) {
            targetingIndicator = `<div class="targeting-indicator">🎯 → ${targetPlayer.name}</div>`;
        }
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
        ${targetingIndicator}
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
    
    // Create target options from current players in combat
    const targetOptions = combatPlayers.map(player => 
        `<option value="${player.id}" ${player.id === enemy.targetId ? 'selected' : ''}>
            ${player.name}
        </option>`
    ).join('');
    
    const targetDropdown = combatPlayers.length > 0 ? `
        <select class="target-dropdown" onchange="updateEnemyTarget('${enemy.id}', this.value)">
            <option value="">Select Target...</option>
            ${targetOptions}
        </select>
    ` : '<span class="no-targets">No players in combat</span>';
    
    return `
        <div class="enemy-controls">
            <div class="control-row">
                <label>Attack:</label>
                <select class="attack-dropdown" onchange="updateEnemyAttack('${enemy.id}', this.value)">
                    ${attackOptions}
                </select>
            </div>
            <div class="control-row">
                <label>Target:</label>
                ${targetDropdown}
            </div>
            <div class="action-controls">
                <button class="action-btn" onclick="executeEnemyAttack('${enemy.id}')">Attack</button>
                <button class="action-btn" onclick="applyDamageToEnemy('${enemy.id}')">Damage</button>
            </div>
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
 * Update enemy's selected target
 */
function updateEnemyTarget(enemyId, targetId) {
    const enemy = combatEnemies.find(e => e.id === enemyId);
    if (enemy) {
        enemy.targetId = targetId;
        const targetPlayer = combatPlayers.find(p => p.id === targetId);
        const targetName = targetPlayer ? targetPlayer.name : 'No target';
        console.log(`🎯 Updated ${enemy.name} target to: ${targetName}`);
        
        // Update the arena display to show the targeting
        updateArena();
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
    
    // Get target information
    const targetPlayer = enemy.targetId ? combatPlayers.find(p => p.id === enemy.targetId) : null;
    const targetText = targetPlayer ? ` targeting ${targetPlayer.name}` : '';
    
    const roll = rollD20();
    const message = `⚔️ ${enemy.name} attacks with ${attack.name}${targetText}! Attack Roll: ${roll} (Damage: ${attack.damage})`;
    
    // Add to chat if available
    if (typeof addToChatLog === 'function') {
        addToChatLog(message, 'system');
    } else {
        console.log(message);
    }
    
    // Also send to combat chat if available
    if (typeof sendChatMessageAsync === 'function') {
        sendChatMessageAsync(message);
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
    
    // Get storyteller name from the settings input field
    const storytellerNameInput = document.getElementById('storyteller-name');
    const storytellerName = storytellerNameInput?.value || window.currentCharacterName || window.playerName || 'StoryTeller' || 'Storyteller';
    
    console.log(`🎯 DEBUG: Storyteller name detected as: "${storytellerName}"`);
    console.log(`🎯 DEBUG: Connected players:`, connectedPlayers.map(p => `${p.name} (char: ${p.character_name || 'none'}) [storyteller: ${p.is_storyteller || false}]`));
    
    // Helper function to check if a player is the storyteller
    const isStorytellerPlayer = (player) => {
        return player.name === storytellerName || 
               player.character_name === storytellerName ||
               player.is_storyteller === true ||
               player.name.toLowerCase().includes('storyteller') ||
               player.name.toLowerCase().includes('session master');
    };
    
    const expectedPlayerCount = connectedPlayers.filter(p => !isStorytellerPlayer(p)).length;
    
    console.log(`🎯 Expected players: ${expectedPlayerCount}, Players with initiative: ${combatPlayers.length}`);
    console.log(`🎯 DEBUG: Non-storyteller connected players:`, connectedPlayers.filter(p => !isStorytellerPlayer(p)).map(p => p.name));
    console.log(`🎯 DEBUG: Players in combat with initiative:`, combatPlayers.map(p => `${p.name} (${p.initiative})`));
    
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
    
    // Initialize display
    updateArena();
    updateEnemyChips();
});

// =============================================================================
// TURN-BASED ACTION PROCESSING - Phase 2
// =============================================================================

/**
 * Processes combat action commands (ATTACK, SPELL, ROLL) during active turns
 */
function processCombatAction(command, playerName, details) {
    if (!CombatState.turnStarted) {
        console.log(`⚠️ Combat action ignored - combat not active: ${command} from ${playerName}`);
        return;
    }
    
    // Check if it's this player's turn
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    if (!currentCharacter || currentCharacter.character !== playerName) {
        console.log(`⚠️ Out of turn action from ${playerName} - current turn: ${currentCharacter?.character || 'none'}`);
        sendChatMessageAsync(`${playerName}, it's not your turn yet! Current turn: ${currentCharacter?.character || 'Unknown'}`);
        return;
    }
    
    console.log(`🎲 Processing ${command} action from ${playerName}:`, details);
    
    switch (command) {
        case 'ATTACK':
            processAttackActionImmediate(playerName, details);
            break;
        case 'SPELL':
            processSpellActionImmediate(playerName, details);
            break;
        case 'ROLL':
            processRollActionImmediate(playerName, details);
            break;
        default:
            console.log(`⚠️ Unknown combat action: ${command}`);
    }
}

/**
 * Processes an attack action during combat
 */
function processAttackActionImmediate(playerName, details) {
    // Extract attack details (damage, target, etc.)
    const attackInfo = parseActionDetails(details);
    console.log(`⚔️ ${playerName} attacks:`, attackInfo);
    
    // Apply damage to target if specified
    if (attackInfo.target && attackInfo.damage) {
        applyDamage(attackInfo.target, attackInfo.damage, playerName);
    }
    
    // Announce the attack
    const message = attackInfo.target ? 
        `${playerName} attacks ${attackInfo.target} for ${attackInfo.damage || '?'} damage!` :
        `${playerName} makes an attack roll!`;
    
    sendChatMessageAsync(message);
    
    // Mark action taken and potentially advance turn
    markActionTaken(playerName);
}

/**
 * Processes a spell action during combat
 */
function processSpellActionImmediate(playerName, details) {
    const spellInfo = parseActionDetails(details);
    console.log(`✨ ${playerName} casts spell:`, spellInfo);
    
    // Apply spell effects
    if (spellInfo.target && spellInfo.damage) {
        applyDamage(spellInfo.target, spellInfo.damage, playerName);
    } else if (spellInfo.healing && spellInfo.target) {
        applyHealing(spellInfo.target, spellInfo.healing, playerName);
    }
    
    // Announce the spell
    const message = spellInfo.spell ? 
        `${playerName} casts ${spellInfo.spell}!` :
        `${playerName} casts a spell!`;
    
    sendChatMessageAsync(message);
    
    // Mark action taken
    markActionTaken(playerName);
}

/**
 * Processes a skill/ability roll during combat
 */
function processRollActionImmediate(playerName, details) {
    const rollInfo = parseActionDetails(details);
    console.log(`🎲 ${playerName} makes roll:`, rollInfo);
    
    // Announce the roll
    const message = rollInfo.skill ? 
        `${playerName} rolls ${rollInfo.skill}!` :
        `${playerName} makes a roll!`;
    
    sendChatMessageAsync(message);
    
    // Skill rolls don't always end turn (DM decision)
    // markActionTaken(playerName);
}

/**
 * Parses action details from command text
 */
function parseActionDetails(details) {
    const info = {};
    
    // Look for common patterns
    const damageMatch = details.match(/(\d+)\s*(?:damage|dmg|hp)/i);
    const targetMatch = details.match(/(?:target|to|against|vs)\s*([a-zA-Z]+)/i);
    const spellMatch = details.match(/(?:spell|cast)\s*([a-zA-Z\s]+)/i);
    const skillMatch = details.match(/(?:skill|roll)\s*([a-zA-Z\s]+)/i);
    const healMatch = details.match(/(?:heal|healing)\s*(\d+)/i);
    
    if (damageMatch) info.damage = parseInt(damageMatch[1]);
    if (targetMatch) info.target = targetMatch[1];
    if (spellMatch) info.spell = spellMatch[1].trim();
    if (skillMatch) info.skill = skillMatch[1].trim();
    if (healMatch) info.healing = parseInt(healMatch[1]);
    
    return info;
}

/**
 * Applies damage to a target (enemy or player)
 */
function applyDamage(targetName, damage, attacker) {
    console.log(`💥 Applying ${damage} damage to ${targetName} from ${attacker}`);
    
    // Find target in enemies first
    const enemyIndex = combatEnemies.findIndex(e => 
        e.name.toLowerCase().includes(targetName.toLowerCase()) ||
        targetName.toLowerCase().includes(e.name.toLowerCase())
    );
    
    if (enemyIndex >= 0) {
        const enemy = combatEnemies[enemyIndex];
        const oldHp = enemy.hp || enemy.maxHP || 100;
        const newHp = Math.max(0, oldHp - damage);
        
        enemy.hp = newHp;
        
        console.log(`🩸 ${enemy.name} HP: ${oldHp} → ${newHp}`);
        sendChatMessageAsync(`${enemy.name} takes ${damage} damage! HP: ${newHp}/${enemy.maxHP || 100}`);
        
        // Check if enemy is defeated
        if (newHp <= 0) {
            enemy.status = 'defeated';
            sendChatMessageAsync(`💀 ${enemy.name} has been defeated!`);
        }
        
        updateArena();
        return;
    }
    
    // Check players
    const playerIndex = combatPlayers.findIndex(p => 
        p.name.toLowerCase().includes(targetName.toLowerCase()) ||
        targetName.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (playerIndex >= 0) {
        const player = combatPlayers[playerIndex];
        console.log(`🩸 ${player.name} takes ${damage} damage`);
        sendChatMessageAsync(`${player.name} takes ${damage} damage!`);
        updateArena();
        return;
    }
    
    console.log(`⚠️ Target not found: ${targetName}`);
    sendChatMessageAsync(`Target "${targetName}" not found in combat.`);
}

/**
 * Applies healing to a target
 */
function applyHealing(targetName, healing, caster) {
    console.log(`💚 Applying ${healing} healing to ${targetName} from ${caster}`);
    
    // Similar logic to damage but for healing
    const playerIndex = combatPlayers.findIndex(p => 
        p.name.toLowerCase().includes(targetName.toLowerCase()) ||
        targetName.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (playerIndex >= 0) {
        console.log(`💚 ${targetName} healed for ${healing}`);
        sendChatMessageAsync(`${targetName} healed for ${healing} HP!`);
        updateArena();
    }
}

/**
 * Marks that a character has taken their action
 */
function markActionTaken(playerName) {
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    if (currentCharacter && currentCharacter.character === playerName) {
        currentCharacter.actionTaken = true;
        console.log(`✅ ${playerName} has taken their action`);
        
        // Update visual status
        const playerIndex = combatPlayers.findIndex(p => p.name === playerName);
        if (playerIndex >= 0) {
            combatPlayers[playerIndex].status = 'action-taken';
        }
        
        updateArena();
        
        // Suggest advancing turn
        sendChatMessageAsync(`${playerName} has taken their action. Click "Next Turn" to continue.`);
    }
}

/**
 * Advances to the next turn with enhanced messaging and visual updates
 */
function advanceToNextTurn() {
    if (!CombatState.turnStarted || CombatState.initiativeOrder.length === 0) {
        console.log('⚠️ Cannot advance turn - combat not active or no initiative order');
        return;
    }
    
    // Clear action taken status for current character
    const currentCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    if (currentCharacter) {
        currentCharacter.actionTaken = false;
        
        // Update player visual status
        const playerIndex = combatPlayers.findIndex(p => p.name === currentCharacter.character);
        if (playerIndex >= 0) {
            combatPlayers[playerIndex].status = 'waiting';
            combatPlayers[playerIndex].isCurrentTurn = false;
        }
    }
    
    // Advance turn index
    CombatState.currentTurnIndex++;
    
    // Check if we've completed a round
    if (CombatState.currentTurnIndex >= CombatState.initiativeOrder.length) {
        CombatState.currentTurnIndex = 0;
        CombatState.currentRound++;
        
        console.log(`🔄 Round ${CombatState.currentRound} begins!`);
        sendChatMessageAsync(`🔄 **Round ${CombatState.currentRound}** begins!`);
    }
    
    // Get new current character
    const nextCharacter = CombatState.initiativeOrder[CombatState.currentTurnIndex];
    if (nextCharacter) {
        console.log(`👆 ${nextCharacter.character}'s turn! (Turn ${CombatState.currentTurnIndex + 1})`);
        
        // Enhanced turn announcement
        const turnMessage = `👆 **${nextCharacter.character}**, it's your turn! Use your attack, spell, or skill buttons.`;
        sendChatMessageAsync(turnMessage);
        
        // Update arena to show current turn highlighting
        highlightCurrentTurn();
        
        // Refresh arena display
        updateArena();
    }
    
    // Update initiative display
    updateInitiativeDisplay();
}

// =============================================================================
// UI INTEGRATION FUNCTIONS - Phase 2
// =============================================================================

/**
 * Initializes UI event listeners for combat controls
 */
function initializeCombatUI() {
    // Next Turn button
    const nextTurnBtn = document.getElementById('next-turn-btn');
    if (nextTurnBtn) {
        nextTurnBtn.addEventListener('click', advanceToNextTurn);
    }
    
    // Clear Initiative button
    const clearBtn = document.getElementById('clear-initiative-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearInitiative);
    }
    
    // Start Combat button
    const startBtn = document.getElementById('start-combat-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startCombatInitiative);
    }
}

/**
 * Clears all initiative data
 */
function clearInitiative() {
    CombatState.initiativeOrder = [];
    CombatState.turnStarted = false;
    CombatState.currentTurnIndex = 0;
    CombatState.currentRound = 1;
    
    // Clear visual combat manager
    combatPlayers.length = 0;
    combatEnemies.length = 0;
    
    updateInitiativeDisplay();
    updateArena();
    
    console.log('🗑️ Initiative cleared');
    sendChatMessageAsync('Initiative tracker cleared.');
}

// Initialize UI when document loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCombatUI);
} else {
    initializeCombatUI();
}

// =============================================================================
// EXPORT FOR INTEGRATION - Phase 2
// =============================================================================

// Make combat functions available globally for integration
window.CombatSystem = {
    // Phase 1 Functions
    processInitiativeCommand,
    processAttackCommand,
    processSpellCommand,
    processRollCommand,
    processCombatCommand,
    startCombatInitiative,
    endCombatEncounter,
    nextTurn: advanceToNextTurn,
    previousTurn,
    clearInitiative,
    getCombatState: () => CombatState,
    
    // Phase 2 Functions - Turn-based Action Processing
    processCombatAction,
    processAttackActionImmediate,
    processSpellActionImmediate,
    processRollActionImmediate,
    parseActionDetails,
    applyDamage,
    applyHealing,
    markActionTaken,
    advanceToNextTurn,
    highlightCurrentTurn
};
