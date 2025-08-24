/**
 * COMMAND INTERCEPTOR SYSTEM
 * ========================
 * 
 * This file intercepts chat messages AFTER supabase processes them but BEFORE they display.
 * It provides "distributed computing" style command processing where:
 * - Generic commands are sent via chat (e.g., "LOOT:PlayerName:handful_gold")
 * - Each client calculates specific results based on their perspective
 * - Players see personal results, storyteller sees details, others see generic descriptions
 * 
 * IMPORTANT: This file does NOT modify supabase-chat.js or any supabase files.
 * It works by hooking into the display function to intercept messages before rendering.
 * 
 * Commands supported:
 * - LOOT:PlayerName:loot_type (gives randomized loot to specific player)
 * - ACHIEVEMENT:PlayerName:achievement_name (awards achievement)
 * - LEVELUP:PlayerName:new_level (handles level progression)
 * 
 * Integration approach:
 * 1. Override the displayChatMessage function to intercept messages
 * 2. Check if message contains a command pattern
 * 3. Process command and show appropriate results based on user role
 * 4. Fall back to normal message display for non-commands
 */

// Global variables for command processing
let originalDisplayChatMessage = null;
let commandParser = null;

/**
 * Initialize the command interceptor system
 * Call this after supabase-chat.js is loaded but before connecting
 */
function initializeCommandInterceptor() {
    console.log('🎯 Initializing Command Interceptor...');
    
    // Store reference to original display function
    if (typeof displayChatMessage === 'function') {
        originalDisplayChatMessage = displayChatMessage;
        
        // Override the display function with our interceptor
        window.displayChatMessage = interceptChatMessage;
        
        console.log('✅ Command Interceptor hooked into displayChatMessage');
    } else {
        console.warn('⚠️ displayChatMessage function not found - interceptor not active');
        return false;
    }
    
    // Initialize command parser if available
    if (typeof ChatCommandParser !== 'undefined') {
        commandParser = new ChatCommandParser();
        console.log('✅ Command Parser initialized');
    } else {
        console.warn('⚠️ ChatCommandParser not available - commands will pass through unprocessed');
    }
    
    return true;
}

/**
 * Intercept chat messages before they display
 * This is the main hook that processes commands without modifying supabase
 */
async function interceptChatMessage(message) {
    // Check if this looks like a command
    if (message.message_text && isCommandMessage(message.message_text)) {
        console.log('🎯 Command detected:', message.message_text);
        
        // Process the command and get the appropriate display version
        const processedMessage = await processCommandMessage(message);
        
        // Display the processed version
        originalDisplayChatMessage(processedMessage);
    } else {
        // Not a command - display normally
        originalDisplayChatMessage(message);
    }
}

/**
 * Check if a message contains a command pattern
 */
function isCommandMessage(messageText) {
    // Look for patterns like: COMMAND:PlayerName or COMMAND:PlayerName:parameters
    const commandPattern = /^(LOOT|ACHIEVEMENT|LEVELUP|ITEM|SKILL|EXP|GOLD|HEALTH|STAT):[^:]+/;
    return commandPattern.test(messageText);
}

/**
 * Process a command message and return the appropriate display version
 * based on the current user's role (player, storyteller, or observer)
 */
async function processCommandMessage(message) {
    const messageText = message.message_text;
    const currentPlayer = window.playerName;
    const isStoryteller = window.isStoryteller || window.isStoryTeller;
    
    // Parse the command
    const commandParts = messageText.split(':');
    if (commandParts.length < 2) {
        // Malformed command - display as-is
        return message;
    }
    
    const command = commandParts[0];
    const targetPlayer = commandParts[1];
    const parameters = commandParts.length > 2 ? commandParts.slice(2).join(':') : null;
    
    // Determine what version to show based on user role
    let displayText;
    let messageType = 'command';
    
    if (targetPlayer === currentPlayer) {
        // This command is for the current player - show personal results
        displayText = await generatePersonalResult(command, parameters);
        messageType = 'personal-result';
    } else if (isStoryteller) {
        // Storyteller sees detailed results
        displayText = generateStorytelleroResult(command, targetPlayer, parameters);
        messageType = 'storyteller-result';
    } else {
        // Other players see generic description
        displayText = generateGenericResult(command, targetPlayer, parameters);
        messageType = 'generic-result';
    }
    
    // Return modified message
    return {
        ...message,
        message_text: displayText,
        message_type: messageType,
        original_command: messageText
    };
}

/**
 * Generate personal result for the target player
 */
async function generatePersonalResult(command, parameters) {
    if (!commandParser) {
        return `You received a ${command} command${parameters ? ': ' + parameters : ''}`;
    }
    
    switch (command) {
        case 'LOOT':
            return await generatePersonalLoot(parameters);
        case 'ACHIEVEMENT':
            return `🏆 Achievement Unlocked: ${parameters}!`;
        case 'LEVELUP':
            return `🎉 Congratulations! You've leveled up!`;
        case 'HEALTH':
            const healthAmount = parseInt(parameters);
            if (healthAmount > 0) {
                return `🩹 You were healed for ${healthAmount} health!`;
            } else {
                return `💥 You took ${Math.abs(healthAmount)} damage!`;
            }
        case 'EXP':
            return `⭐ You gained ${parameters} experience points!`;
        case 'SKILL':
            const skillParts = parameters ? parameters.split(':') : [];
            const skillName = skillParts[0] || 'Unknown Skill';
            const skillExp = skillParts[1] || 'some';
            return `📚 You trained ${skillName} and gained ${skillExp} experience!`;
        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            const statName = statParts[0] || 'a stat';
            const statChange = parseInt(statParts[1]) || 1;
            return `📊 Your ${statName} ${statChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(statChange)}!`;
        case 'GOLD':
            const goldAmount = parseInt(parameters) || 0;
            return `💰 You ${goldAmount > 0 ? 'gained' : 'lost'} ${Math.abs(goldAmount)} gold!`;
        default:
            return `You received: ${command}${parameters ? ' - ' + parameters : ''}`;
    }
}

/**
 * Generate storyteller result with details
 */
function generateStorytelleroResult(command, targetPlayer, parameters) {
    switch (command) {
        case 'LOOT':
            return `📋 ${targetPlayer} received loot (${parameters}) - see their screen for details`;
        case 'ACHIEVEMENT':
            return `📋 ${targetPlayer} earned achievement: ${parameters}`;
        case 'LEVELUP':
            return `📋 ${targetPlayer} leveled up to level null`;
        case 'HEALTH':
            const healthAmount = parseInt(parameters);
            return `📋 ${targetPlayer} ${healthAmount > 0 ? 'healed' : 'took damage'}: ${Math.abs(healthAmount)} HP`;
        case 'EXP':
            return `📋 ${targetPlayer} gained ${parameters} experience`;
        case 'SKILL':
            const skillParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer} trained ${skillParts[0] || 'a skill'}`;
        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer}'s ${statParts[0] || 'stat'} changed by ${statParts[1] || '1'}`;
        case 'GOLD':
            return `📋 ${targetPlayer} ${parseInt(parameters) > 0 ? 'gained' : 'lost'} ${Math.abs(parseInt(parameters))} gold`;
        default:
            return `📋 ${targetPlayer} received ${command}: ${parameters}`;
    }
}

/**
 * Generate generic result for other players
 */
function generateGenericResult(command, targetPlayer, parameters) {
    switch (command) {
        case 'LOOT':
            return `${targetPlayer} found some treasure`;
        case 'ACHIEVEMENT':
            return `${targetPlayer} accomplished something noteworthy`;
        case 'LEVELUP':
            return `${targetPlayer} has grown stronger`;
        default:
            return `${targetPlayer} received a ${command.toLowerCase()}`;
    }
}

/**
 * Generate specific loot results for the target player
 * Uses the ChatCommandParser if available
 */
async function generatePersonalLoot(lootType) {
    if (!commandParser) {
        return `💰 You found some ${lootType}!`;
    }
    
    try {
        // Ensure current player is registered (with minimal data for now)
        const currentPlayer = window.playerName;
        if (!commandParser.getPlayer(currentPlayer)) {
            // Register player with basic data structure
            commandParser.registerPlayer(currentPlayer, {
                name: currentPlayer,
                level: 1,
                gold: 0,
                inventory: [],
                attributes: {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10
                }
            });
        }
        
        // Use the command parser to generate specific loot
        const result = await commandParser.processMessage(`LOOT:${currentPlayer}:${lootType}`, 'StoryTeller');
        
        if (result && result.success && result.message) {
            // Extract just the loot part for the player
            return `💰 ${result.message.replace(currentPlayer + ' ', 'You ')}`;
        } else {
            // Fallback to simple description
            return `💰 You found some ${lootType}!`;
        }
    } catch (error) {
        console.warn('Error generating personal loot:', error);
        return `💰 You found some ${lootType}!`;
    }
}

// Auto-initialize when the script loads (after a short delay to ensure other scripts are ready)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeCommandInterceptor();
    }, 1000);
});

console.log('📜 Command Interceptor script loaded - waiting for initialization');
