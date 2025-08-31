/**
 * COMMAND INTERCEPTOR SYSTEM
 * ========================
 * 
 * This file intercepts chat messages AFTER supabase processes them but BEFORE they display.
 * It provides "distributed computing" st        case 'STAT':
            const statParts = parameters ? parameters.split(':') : [];
            return `📋 ${targetPlayer}'s ${statParts[0] || 'stat'} changed by ${statParts[1] || '1'}`;
        case 'GOLD':
            return `📋 ${targetPlayer} ${parseInt(parameters) > 0 ? 'gained' : 'lost'} ${Math.abs(parseInt(parameters) || 0)} gold`;
        case 'CLEAN':
            return `📋 Database cleanup performed: ${parameters || 'standard cleanup'}`;
        default:
            return `📋 ${targetPlayer} received a ${command.toLowerCase()}`;mand processing where:
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

// Debug toggle - use global window variable
if (typeof window.showDebug === 'undefined') {
    window.showDebug = false;
}

/**
 * Initialize the command interceptor system
 * Call this after supabase-chat.js is loaded but before connecting
 */
function initializeCommandInterceptor() {
    console.log('🎯 Initializing Command Interceptor...');
    
    // Prevent double initialization
    if (window.commandInterceptorInitialized) {
        console.log('🎯 Command Interceptor already initialized');
        return true;
    }
    
    // Store reference to original display function
    if (typeof displayChatMessage === 'function') {
        // Make sure we're not storing a reference to ourselves
        if (displayChatMessage.name === 'interceptChatMessage') {
            console.warn('⚠️ displayChatMessage already intercepted - skipping');
            return false;
        }
        
        originalDisplayChatMessage = displayChatMessage;
        
        // Override the display function with our interceptor
        window.displayChatMessage = interceptChatMessage;
        window.commandInterceptorInitialized = true;
        
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
    // Recursion protection
    if (message._intercepted) {
        console.warn('⚠️ Message already intercepted, avoiding recursion');
        return;
    }
    
    // Mark message as intercepted
    message._intercepted = true;
    
    // Check if this looks like a command
    if (message.message_text && isCommandMessage(message.message_text)) {
        if (window.showDebug) console.log('🎯 Command detected:', message.message_text);
        
        // Process the command and get the appropriate display version
        const processedMessage = await processCommandMessage(message);
        
        // Only display if processedMessage is not null (silent commands return null)
        if (processedMessage !== null) {
            // Make sure we have the original function
            if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
                originalDisplayChatMessage(processedMessage);
            } else {
                console.error('❌ Original display function not available');
            }
        }
    } else {
        // Not a command - display normally
        if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
            originalDisplayChatMessage(message);
        } else {
            console.error('❌ Original display function not available');
        }
    }
}

/**
 * Check if a message contains a command pattern
 */
function isCommandMessage(messageText) {
    // Look for patterns like: COMMAND:PlayerName or COMMAND:PlayerName:parameters
    const commandPattern = /^(LOOT|ACHIEVEMENT|LEVELUP|ITEM|SKILL|EXP|GOLD|HEALTH|STAT|CLEAN):[^:]+/;
    // Also check for special silent commands
    const silentCommandPattern = /^\/refreshmap$|^\/sendmap$|^\/github:/;
    // Also check for map sync messages that should be hidden
    const mapSyncPattern = /^MAP_SYNC:/;
    return commandPattern.test(messageText) || silentCommandPattern.test(messageText) || mapSyncPattern.test(messageText);
}

/**
 * Process a command message and return the appropriate display version
 * based on the current user's role (player, storyteller, or observer)
 */
async function processCommandMessage(message) {
    const messageText = message.message_text;
    const currentPlayer = window.playerName;
    const isStoryteller = window.isStoryteller || window.isStoryTeller;
    
    // Handle special silent commands
    if (messageText === '/refreshmap') {
        console.log('📡 Processing silent map refresh command');
        
        // Trigger map refresh if MapSyncAdapter is available
        if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
            window.mapSyncAdapter.mapClientManager.checkForExistingMap();
            console.log('🗺️ Map refresh triggered');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle /sendmap command - storyteller shares current map
    if (messageText === '/sendmap') {
        console.log('📡 Processing sendmap command');
        
        // Only storytellers can send maps
        if (isStoryteller) {
            // Trigger the enhanced map sharing function
            if (typeof enhancedShareMapWithPlayers === 'function') {
                enhancedShareMapWithPlayers();
                console.log('🗺️ Map sharing triggered by /sendmap command');
            } else if (typeof shareMapWithPlayers === 'function') {
                shareMapWithPlayers();
                console.log('🗺️ Map sharing triggered by /sendmap command (fallback)');
            } else {
                console.warn('⚠️ Map sharing functions not available');
            }
        } else {
            // Players can request a map refresh using the new table
            if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
                const clientManager = window.mapSyncAdapter.mapClientManager;
                if (clientManager.getDBClient) {
                    clientManager.getDBClient()
                        .from('map_updates')
                        .insert([{
                            session_code: clientManager.currentSession,
                            action: 'refresh',
                            map_name: 'Player requested refresh'
                        }])
                        .then(() => console.log('📡 Refresh request sent via database'))
                        .catch(err => console.warn('⚠️ Could not send refresh request:', err));
                }
            }
            console.log('🔄 Player requested map refresh via /sendmap');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle /github:token command - storyteller distributes GitHub API token
    if (messageText.startsWith('/github:')) {
        console.log('📡 Processing GitHub token distribution command');
        
        // Only storytellers can distribute tokens
        if (isStoryteller) {
            const tokenPart = messageText.substring(8); // Remove '/github:'
            
            if (tokenPart) {
                // Store the token in IndexedDB for this storyteller
                if (window.githubTokenStorage) {
                    try {
                        await window.githubTokenStorage.storeToken(tokenPart);
                        console.log('🔑 GitHub API token stored in IndexedDB');
                    } catch (error) {
                        console.warn('⚠️ IndexedDB storage failed, using localStorage fallback');
                        localStorage.setItem('github_api_token', tokenPart);
                    }
                } else {
                    localStorage.setItem('github_api_token', tokenPart);
                }
                console.log('🔑 GitHub API token stored locally');
                
                // Initialize/update GitHubImageHost if it exists
                if (window.MultiImageHost) {
                    try {
                        // Update the GitHub configuration
                        const githubConfig = {
                            owner: 'ronmurphy',
                            repo: 'dcc-image-storage',
                            apiToken: tokenPart
                        };
                        
                        // Update existing GitHubImageHost instance
                        if (window.multiImageHost && window.multiImageHost.githubHost) {
                            window.multiImageHost.githubHost.config.apiToken = tokenPart;
                            console.log('🔑 GitHubImageHost token updated');
                        }
                        
                        console.log('✅ GitHub integration ready for image hosting');
                    } catch (error) {
                        console.warn('⚠️ Error updating GitHub configuration:', error);
                    }
                }
                
                // Show confirmation to storyteller
                if (originalDisplayChatMessage && typeof originalDisplayChatMessage === 'function') {
                    const confirmationMessage = {
                        ...message,
                        message_text: "✅ GitHub API key configured! Image hosting ready.",
                        sender_name: "System",
                        created_at: new Date().toISOString()
                    };
                    originalDisplayChatMessage(confirmationMessage);
                }
            } else {
                console.warn('⚠️ No token provided in /github: command');
            }
        } else {
            console.log('🔑 Player received GitHub token distribution (ignored)');
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // Handle MAP_SYNC messages - these should be processed but not displayed
    if (messageText.startsWith('MAP_SYNC:')) {
        console.log('📡 Processing MAP_SYNC notification');
        
        try {
            const syncData = JSON.parse(messageText.substring(9));
            if (syncData.action === 'map_shared') {
                console.log('📨 Map shared notification received:', syncData.mapName);
                // Trigger map refresh if MapSyncAdapter is available
                if (window.mapSyncAdapter && window.mapSyncAdapter.mapClientManager) {
                    window.mapSyncAdapter.mapClientManager.checkForExistingMap();
                    console.log('🗺️ Map refresh triggered by MAP_SYNC');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing MAP_SYNC message:', error);
        }
        
        // Return a null message to suppress display
        return null;
    }
    
    // If this is the StoryTeller interface, don't process commands - let them display normally
    if (isStoryteller) {
        return message; // Pass through unchanged
    }
    
    // Parse regular commands (only for player interfaces)
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
        displayText = await generatePersonalResult(command, parameters, message);
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
async function generatePersonalResult(command, parameters, message) {
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
        case 'NOTE':
            // Add to notification system if available
            if (typeof window.addReceivedNote === 'function') {
                // Extract sender name from the message context
                const senderName = (message && message.author_name) || 'Unknown';
                window.addReceivedNote(senderName, parameters, new Date().toISOString());
            }
            return `📝 You received a note: ${parameters}`;
        case 'CLEAN':
            // For players, just show a generic cleanup message
            return `🧹 The storyteller performed database maintenance`;
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
        case 'NOTE':
            return `📋 Note sent to ${targetPlayer}`;
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
        case 'NOTE':
            return `📝 Notes are being passed`;
        case 'CLEAN':
            return `🧹 Database maintenance performed`;
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
