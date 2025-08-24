// ========================================
// ✅ ACTIVE CHAT SYSTEM - SUPABASE REAL-TIME
// 
// This is the CURRENT chat system in use!
// Budget-friendly alternative to PubNub (Free vs $98/month)
// Handles real-time messaging, combat integration, and session management
// 
// Previous system: realtime-chat.js (PubNub) - archived due to cost
// ========================================

// ========================================
// SUPABASE CONFIGURATION
// ========================================
let supabase = null;
let currentConfig = null;
let currentGameSession = null;
let messagesSubscription = null;
let isStoryTeller = false;
let playerName = '';

// Initialize Supabase (free tier: 500MB database, 2GB bandwidth)
function initializeSupabase() {
    // Prevent double initialization
    if (window.supabaseInitialized) {
        console.log('Supabase already initialized');
        return true;
    }
    
    // Load configuration from storage
    if (typeof supabaseConfig !== 'undefined') {
        const configResult = supabaseConfig.loadConfig();
        
        if (!configResult.success) {
            console.warn('Supabase not configured. Please set up your API keys in the Configure tab.');
            showChatError('Chat not configured. Please visit the Configure tab to set up Supabase.');
            return false;
        }
        
        currentConfig = configResult.data;
    } else {
        console.error('Supabase configuration manager not loaded');
        showChatError('Configuration manager not loaded. Please refresh the page.');
        return false;
    }
    
    try {
        supabase = window.supabase.createClient(currentConfig.supabaseUrl, currentConfig.supabaseKey);
        
        // Clear any previous error messages
        const errorDiv = document.getElementById('chat-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        console.log('Supabase initialized for real-time gaming');
        window.supabaseInitialized = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showChatError(`Failed to connect to Supabase: ${error.message}`);
        return false;
    }
}

// ========================================
// DATABASE SETUP (RUN ONCE)
// ========================================
function createGameTables() {
    // You'll run this SQL in your Supabase dashboard:
    const setupSQL = `
    -- Game sessions table
    CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        session_code VARCHAR(10) UNIQUE NOT NULL,
        dm_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN DEFAULT true
    );

    -- Game messages table  
    CREATE TABLE IF NOT EXISTS game_messages (
        id SERIAL PRIMARY KEY,
        session_code VARCHAR(10) REFERENCES game_sessions(session_code),
        player_name VARCHAR(100) NOT NULL,
        message_type VARCHAR(50) NOT NULL, -- 'chat', 'game_command', 'system'
        message_text TEXT,
        game_data JSONB, -- For structured game commands
        is_storyteller BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Enable real-time subscriptions
    ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
    `;
    
    console.log('Run this SQL in your Supabase dashboard:', setupSQL);
}

// ========================================
// ERROR HANDLING
// ========================================
function showChatError(message) {
    let errorDiv = document.getElementById('chat-error-message');
    
    if (!errorDiv) {
        // Create error message div if it doesn't exist
        errorDiv = document.createElement('div');
        errorDiv.id = 'chat-error-message';
        errorDiv.className = 'chat-error';
        
        // Insert at the top of chat content
        const chatContent = document.getElementById('chat');
        if (chatContent) {
            chatContent.insertBefore(errorDiv, chatContent.firstChild);
        }
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="material-icons">error</i>
            <span>${message}</span>
        </div>
    `;
    errorDiv.style.display = 'block';
}

// ========================================
// UI INTERFACE FUNCTIONS
// ========================================
async function startGameSession() {
    const dmName = document.getElementById('dm-name-input').value.trim();
    const sessionCode = document.getElementById('session-code-input').value.trim();
    
    if (!dmName) {
        alert('Please enter your name');
        return;
    }
    
    if (!sessionCode) {
        alert('Please enter a session code');
        return;
    }
    
    try {
        // Set the global variables first
        window.playerName = dmName;
        await createNewGameSession();
    } catch (error) {
        console.error('Failed to start game session:', error);
        alert('Failed to start session: ' + error.message);
    }
}

async function joinGameSession() {
    const playerName = document.getElementById('dm-name-input').value.trim();
    const sessionCode = document.getElementById('session-code-input').value.trim();
    
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (!sessionCode) {
        alert('Please enter a session code');
        return;
    }
    
    if (sessionCode.length > 10) {
        alert('Session code must be 10 characters or less');
        return;
    }
    
    try {
        // Set the global player name
        window.playerName = playerName;
        await joinExistingSession(sessionCode);
    } catch (error) {
        console.error('Failed to join game session:', error);
        alert('Failed to join session: ' + error.message);
    }
}

function sendChatMessage() {
    const messageInput = document.getElementById('chat-message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    // Clear input
    messageInput.value = '';
    
    // Send the message using the existing async function
    sendChatMessageAsync(messageText);
}

// ========================================
// GAME SESSION MANAGEMENT
// ========================================
async function createNewGameSession() {
    if (!supabase) {
        showNotification('Supabase not initialized', 'error');
        return;
    }
    
    const sessionCode = generateSessionCode();
    const dmName = document.getElementById('dm-name-input').value.trim();
    
    if (!dmName) {
        showNotification('Please enter your name first', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert([{ 
                session_code: sessionCode, 
                dm_name: dmName 
            }])
            .select();
            
        if (error) throw error;
        
        currentGameSession = data[0];
        playerName = dmName;
        isStoryTeller = true;
        
        // Update UI to show we're connected
        document.getElementById('current-session-code').textContent = data[0].session_code;
        document.getElementById('chat-session-controls').style.display = 'none';
        document.getElementById('chat-messages-container').style.display = 'block';
        
        // Update chat status
        const statusElement = document.getElementById('chat-status');
        statusElement.innerHTML = `
            <span class="status-dot connected"></span>
            <span class="status-text">Connected</span>
        `;
        
        // Subscribe to real-time messages for this session
        subscribeToSession(data[0].session_code);
        
        const successMessage = `Session "${data[0].session_code}" created successfully!`;
        if (typeof showNotification === 'function') {
            showNotification(successMessage, 'success');
        } else {
            console.log(successMessage);
        }
        console.log('Game session created:', data[0].session_code);
        
    } catch (error) {
        console.error('Error creating session:', error);
        const errorMessage = 'Failed to create session: ' + (error.message || 'Unknown error');
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    }
}

async function joinGameSession() {
    if (!supabase) {
        showNotification('Supabase not initialized', 'error');
        return;
    }
    
    const name = document.getElementById('player-name-input').value.trim();
    const role = document.getElementById('role-select').value;
    const sessionCode = document.getElementById('session-code-input').value.trim().toUpperCase();
    
    if (!name || !sessionCode) {
        showNotification('Please enter your name and session code', 'error');
        return;
    }
    
    if (sessionCode.length > 10) {
        showNotification('Session code must be 10 characters or less', 'error');
        return;
    }
    
    try {
        // Check if session exists
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .eq('active', true)
            .single();
            
        if (sessionError || !session) {
            showNotification('Session not found or inactive', 'error');
            return;
        }
        
        playerName = name;
        isStoryTeller = (role === 'storyteller');
        currentGameSession = sessionCode;
        
        // Send join message
        await sendSystemMessage(`${playerName} joined as ${isStoryTeller ? 'Story Teller' : 'Player'}`);
        
        // Set up real-time listening for this session
        subscribeToSession(sessionCode);
        
        // Update UI
        updateConnectionStatus('connected');
        showChatInterface();
        
        if (isStoryTeller) {
            showGameDataCard();
            addStoryTellerQuickActions();
        } else {
            addPlayerQuickActions();
        }
        
        showNotification(`Connected to session: ${sessionCode}`, 'success');
        
    } catch (error) {
        console.error('Error joining session:', error);
        showNotification('Failed to join session', 'error');
    }
}

async function leaveGameSession() {
    if (currentGameSession && currentGameSession.code && currentGameSession.code.length <= 10) {
        // Add a fun snarky disconnect message
        const snarkMessages = [
            "🏨 You rest for the night in a safe room...",
            "🚪 Have fun with real life! (Warning: No respawns available)",
            "💤 Logging out... Dream of electric sheep and loot drops",
            "🎭 The Storyteller grants you temporary immunity from plot hooks",
            "🏃‍♂️ Disconnecting... May your real-world stats be ever in your favor!"
        ];
        const randomMessage = snarkMessages[Math.floor(Math.random() * snarkMessages.length)];
        
        try {
            await sendSystemMessage(randomMessage);
        } catch (error) {
            console.log('Could not send disconnect message:', error);
        }
        
        if (messagesSubscription) {
            console.log('🔌 Unsubscribing from real-time messages...');
            messagesSubscription.unsubscribe();
            messagesSubscription = null;
        }
    }
    
    const playerDisplayName = window.playerName || 'Player';
    const sessionCode = currentGameSession ? currentGameSession.code : 'Unknown';
    
    console.log(`🚪 ${playerDisplayName} has left the chat session: ${sessionCode}`);
    
    currentGameSession = null;
    updateConnectionStatus('offline');
    clearChatMessages(); // Clear messages on disconnect
    hideChatInterface();
    hideGameDataCard();
    
    showNotification(`${playerDisplayName} has left the chat`, 'success');
    console.log('✅ Session disconnect complete - UI reset to connection setup');
}

// ========================================
// REAL-TIME MESSAGING
// ========================================
function subscribeToSession(sessionCode) {
    console.log('Setting up real-time subscription for session:', sessionCode);
    
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
    }
    
    messagesSubscription = supabase
        .channel(`game-session-${sessionCode}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'game_messages',
                filter: `session_code=eq.${sessionCode}`
            }, 
            (payload) => {
                console.log('Real-time message received:', payload);
                handleIncomingMessage(payload.new);
            }
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });
        
    // Load recent messages
    loadRecentMessages(sessionCode);
    loadRecentMessages(sessionCode);
}

async function loadRecentMessages(sessionCode) {
    try {
        const { data: messages, error } = await supabase
            .from('game_messages')
            .select('*')
            .eq('session_code', sessionCode)
            .order('created_at', { ascending: true })
            .limit(50); // Last 50 messages
            
        if (error) throw error;
        
        // Clear existing messages
        document.getElementById('chat-messages').innerHTML = '';
        
        // Display each message
        messages.forEach(message => {
            displayChatMessage(message);
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendChatMessageAsync(messageText = null) {
    console.log('Sending message:', messageText);
    console.log('Supabase available:', !!supabase);
    console.log('Current session:', currentGameSession);
    console.log('Player name:', playerName);
    console.log('Is storyteller:', isStoryTeller);
    
    if (!supabase) {
        console.error('Supabase not initialized');
        return;
    }
    
    if (!currentGameSession) {
        console.error('No active game session');
        return;
    }
    
    if (!messageText) {
        console.error('No message text provided');
        return;
    }
    
    try {
        const messageData = {
            session_code: currentGameSession.session_code,
            player_name: playerName || 'Unknown Player',
            message_type: 'chat',
            message_text: messageText,
            is_storyteller: isStoryTeller || false
        };
        
        console.log('Inserting message:', messageData);
        
        const { data, error } = await supabase
            .from('game_messages')
            .insert([messageData])
            .select();
            
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('Message sent successfully:', data);
        
    } catch (error) {
        console.error('Error sending message:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to send message: ' + error.message, 'error');
        }
    }
}

async function sendGameCommand(command, data) {
    if (!supabase || !currentGameSession) return;
    
    try {
        const { error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession,
                player_name: playerName,
                message_type: 'game_command',
                message_text: `🎲 ${command}: ${JSON.stringify(data)}`,
                game_data: { command, data },
                is_storyteller: isStoryTeller
            }]);
            
        if (error) throw error;
        
    } catch (error) {
        console.error('Error sending game command:', error);
        showNotification('Failed to send game command', 'error');
    }
}

async function sendSystemMessage(text) {
    if (!supabase || !currentGameSession) return;
    
    try {
        const { error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession,
                player_name: 'System',
                message_type: 'system',
                message_text: text,
                is_storyteller: false
            }]);
            
        if (error) throw error;
        
    } catch (error) {
        console.error('Error sending system message:', error);
    }
}

async function sendGameResponse(responseText) {
    if (!supabase || !currentGameSession) return;
    
    try {
        const { error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentGameSession,
                player_name: 'StoryTeller System',
                message_type: 'game_response',
                message_text: responseText,
                is_storyteller: true
            }]);
            
        if (error) throw error;
        
    } catch (error) {
        console.error('Error sending game response:', error);
    }
}

// ========================================
// MESSAGE PROCESSING
// ========================================
function handleIncomingMessage(message) {
    console.log('Handling incoming message:', message);
    
    // Check if this is a command disguised as a chat message
    if (message.message_type === 'chat' && message.message_text.startsWith('ATTACK:')) {
        console.log('Detected ATTACK command in chat');
        
        if (isStoryTeller) {
            // Parse and process the attack command
            processAttackCommand(message.message_text, message.player_name);
        }
        
        // Don't display the raw command - we'll show a nicer message instead
        return;
    }
    
    // Always display normal messages in chat
    displayChatMessage(message);
    
    // Don't process our own messages for game commands
    if (message.player_name === playerName) {
        console.log('This is our own message, skipping command processing');
        return;
    }
    
    // Check if this is a game command for Story Teller to process
    if (message.message_type === 'game_command' && 
        isStoryTeller && 
        document.getElementById('auto-process-toggle')?.checked) {
        processGameCommand(message);
    }
    
    // Show notification if not on chat tab
    if (!document.getElementById('chat').classList.contains('active')) {
        showChatNotification();
    }
}

// ========================================
// COMMAND PROCESSING
// ========================================
function processAttackCommand(commandText, playerName) {
    console.log('Processing ATTACK command:', commandText);
    
    // Parse ATTACK:PlayerName:AttackRoll:Damage:WeaponName
    const parts = commandText.split(':');
    if (parts.length < 5) {
        console.error('Invalid ATTACK command format');
        return;
    }
    
    const [cmd, targetPlayer, attackRoll, damage, weaponName] = parts;
    
    // Create a user-friendly message to display
    const displayMessage = `${targetPlayer} attacks with ${weaponName}! (Roll: ${attackRoll}, Damage: ${damage})`;
    
    // Display the nice message instead of the raw command
    const fakeMessage = {
        player_name: 'Combat System',
        message_text: displayMessage,
        message_type: 'system',
        is_storyteller: true,
        created_at: new Date().toISOString()
    };
    displayChatMessage(fakeMessage);
    
    // Process the attack if combat is active
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        console.log('Processing attack in active combat');
        
        // Auto-fill combat form
        const attackingPlayerEl = document.getElementById('attacking-player');
        const attackRollEl = document.getElementById('attack-roll');
        const damageRollEl = document.getElementById('damage-roll');
        
        if (attackingPlayerEl) attackingPlayerEl.value = targetPlayer;
        if (attackRollEl) attackRollEl.value = attackRoll;
        if (damageRollEl) damageRollEl.value = damage;
        
        // Auto-resolve the attack
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                // Send result back to chat
                const enemy = currentCombat.currentEnemy;
                const hit = parseInt(attackRoll) >= enemy.ac;
                
                if (hit) {
                    // Create comprehensive hit message
                    const hitMessage = `⚔️ ${targetPlayer}'s ${weaponName} hit for ${damage} damage! ${enemy.name} has ${enemy.currentHp}/${enemy.maxHp} HP remaining.`;
                    
                    const resultMessage = {
                        player_name: 'Combat System',
                        message_text: hitMessage,
                        message_type: 'combat_result',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(resultMessage);
                } else {
                    // Miss message
                    const missMessage = {
                        player_name: 'Combat System',
                        message_text: `⚔️ ${targetPlayer}'s ${weaponName} attack missed!`,
                        message_type: 'combat_result',
                        is_storyteller: true,
                        created_at: new Date().toISOString()
                    };
                    displayChatMessage(missMessage);
                }
            }
        }, 100);
    } else {
        console.log('No active combat - attack command ignored');
        const warningMessage = {
            player_name: 'Combat System',
            message_text: '⚠️ No active combat session. Start combat first!',
            message_type: 'warning',
            is_storyteller: true,
            created_at: new Date().toISOString()
        };
        displayChatMessage(warningMessage);
    }
}

function processGameCommand(message) {
    if (!message.game_data) return;
    
    const { command, data } = message.game_data;
    const cmdPlayerName = message.player_name;
    
    switch (command) {
        case 'ATTACK':
            processPlayerAttack(data, cmdPlayerName);
            break;
        case 'ROLL':
            processPlayerRoll(data, cmdPlayerName);
            break;
        case 'SPELL':
            processPlayerSpell(data, cmdPlayerName);
            break;
        default:
            console.log('Unknown game command:', command);
    }
    
    // Log the processed command
    logGameData(command, data, cmdPlayerName);
}

function processPlayerAttack(data, playerName) {
    const { attackRoll, damage, weaponName } = data;
    
    // Auto-fill combat form if we're in an active combat
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll;
        document.getElementById('damage-roll').value = damage;
        
        // Auto-resolve the attack
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                // Send result back to chat
                const enemy = currentCombat.currentEnemy;
                const hit = attackRoll >= enemy.ac;
                const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
                
                sendGameResponse(`${playerName}'s attack with ${weaponName}: ${result}`);
            }
        }, 100);
    } else {
        sendGameResponse(`${playerName} attacked with ${weaponName} (${attackRoll} to hit, ${damage} damage) - No active combat to resolve against`);
    }
}

function processPlayerRoll(data, playerName) {
    const { skillName, result, description } = data;
    
    // Just log and announce the roll
    const message = `${playerName} rolled ${skillName}: ${result}${description ? ` (${description})` : ''}`;
    sendGameResponse(message);
    
    // Add to combat log if combat is active
    if (typeof currentCombat !== 'undefined' && currentCombat.active && typeof addToCombatLog === 'function') {
        addToCombatLog(message);
    }
}

function processPlayerSpell(data, playerName) {
    const { spellName, attackRoll, damage, mpCost } = data;
    
    // Process similar to attack
    if (typeof currentCombat !== 'undefined' && currentCombat.active && currentCombat.currentEnemy) {
        document.getElementById('attacking-player').value = playerName;
        document.getElementById('attack-roll').value = attackRoll || 0;
        document.getElementById('damage-roll').value = damage || 0;
        
        setTimeout(() => {
            if (typeof resolvePlayerAttack === 'function') {
                resolvePlayerAttack();
                
                const enemy = currentCombat.currentEnemy;
                const hit = attackRoll ? attackRoll >= enemy.ac : true;
                const result = hit ? `HIT for ${damage} damage!` : 'MISS!';
                
                sendGameResponse(`${playerName}'s spell ${spellName}: ${result} (${mpCost} MP spent)`);
            }
        }, 100);
    } else {
        sendGameResponse(`${playerName} cast ${spellName} (${attackRoll || 'auto'} to hit, ${damage} damage, ${mpCost} MP) - No active combat`);
    }
}

// ========================================
// UI HELPERS (reuse from original chat system)
// ========================================
function displayChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.message_type}`;
    
    let senderClass = '';
    if (message.is_storyteller) senderClass = 'storyteller';
    if (message.message_type === 'system') senderClass = 'system';
    if (message.message_type === 'game_response') senderClass = 'game-response';
    
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender ${senderClass}">${message.player_name || 'System'}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${message.message_text}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        if (typeof createChatSystem === 'function') {
            createChatSystem();
        }
        
        // Initialize Supabase if configured
        if (typeof window.supabase !== 'undefined') {
            initializeSupabase();
        } else {
            console.warn('Supabase library not loaded. Please include the Supabase JavaScript library.');
        }
    }, 1000);
});

// ========================================
// UTILITY FUNCTIONS
// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateSessionCode() {
    // Generate a 6-character code (well within 10 char limit)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code.length > 10 ? code.substring(0, 10) : code;
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');
        
        if (dot) dot.className = `status-dot ${status}`;
        if (text) text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function clearChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
}

function showChatInterface() {
    const connectionSetup = document.getElementById('connection-setup');
    const chatInterface = document.getElementById('chat-interface');
    if (connectionSetup) connectionSetup.style.display = 'none';
    if (chatInterface) chatInterface.style.display = 'block';
}

function hideChatInterface() {
    const connectionSetup = document.getElementById('connection-setup');
    const chatInterface = document.getElementById('chat-interface');
    if (connectionSetup) connectionSetup.style.display = 'block';
    if (chatInterface) chatInterface.style.display = 'none';
}

function showGameDataCard() {
    const gameDataCard = document.getElementById('game-data-card');
    if (gameDataCard) gameDataCard.style.display = 'block';
}

function hideGameDataCard() {
    const gameDataCard = document.getElementById('game-data-card');
    if (gameDataCard) gameDataCard.style.display = 'none';
}

// Export functions for use by other modules
if (typeof window !== 'undefined') {
    window.supabaseChat = {
        createNewGameSession,
        joinGameSession,
        leaveGameSession,
        sendChatMessage,
        sendGameCommand,
        sendGameResponse
    };
    
    // Global functions for HTML onclick handlers
    window.startGameSession = startGameSession;
    window.joinGameSession = joinGameSession;
    window.leaveGameSession = leaveGameSession;
    window.sendChatMessage = sendChatMessage;
}
