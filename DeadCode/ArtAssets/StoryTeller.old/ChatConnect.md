# ChatConnect.md - Complete Chat System Integration Guide

## 🎯 Purpose
This document provides **complete instructions** for implementing the DCC StoryTeller chat system. This builds on the Supabase connection and adds all chat functionality, combat processing, and UI integration.

---

## 📚 Prerequisites

### Required Reading
1. **Read SupabaseConnect.md FIRST** - this document assumes Supabase is working
2. **Test Supabase connection** before proceeding with chat

### Dependencies Verification
Verify these are working before starting:
```javascript
// These should work without errors:
await initializeSupabase(url, key);
await testSupabaseConnection();
```

---

## 🏗️ Chat System Architecture

### Core Components
1. **Message Parser** - Handles command processing (ATTACK, LOOT, etc.)
2. **Chat Manager** - Coordinates sending/receiving messages
3. **UI Integration** - Updates DOM elements and handles user input
4. **Combat Handler** - Processes game commands automatically

### File Structure
```
js/
├── supabase-chat.js     (main chat functionality)
├── modules/             (portable modules for V4)
│   ├── supabaseClient.js
│   ├── chatParser.js
│   ├── combatHandler.js
│   ├── messageFormatter.js
│   ├── chatManager.js
│   └── chatAdapter.js
└── main.js              (UI integration)
```

---

## 📨 Message Types & Format

### Standard Message Types
- **`chat`** - Normal player conversation
- **`combat`** - Attack commands and results
- **`loot`** - Treasure distribution
- **`system`** - Game notifications
- **`death`** - Character death notifications

### Message Structure
```javascript
{
    id: 123,
    session_code: "ABC123",
    player_name: "PlayerName",
    message_type: "chat",
    message_text: "Hello everyone!",
    is_storyteller: false,
    created_at: "2025-08-24T..."
}
```

---

## ⚔️ Combat Command System

### ATTACK Command Format
```
ATTACK:PlayerName:Roll:Damage:Weapon
```

### Examples
```
ATTACK:Throg:15:8:Axe
ATTACK:Wizard:12:6:Magic Missile
ATTACK:Rogue:20:12:Sneak Attack
```

### Combat Processing Code
```javascript
// Attack command processor - ADD THIS EXACTLY
function processAttackCommand(messageText, playerName, isStoryteller) {
    // Only process ATTACK commands
    if (!messageText.startsWith('ATTACK:')) {
        return null;
    }

    try {
        // Parse: ATTACK:PlayerName:Roll:Damage:Weapon
        const parts = messageText.split(':');
        if (parts.length !== 5) {
            console.warn('Invalid ATTACK format:', messageText);
            return null;
        }

        const [command, attackerName, roll, damage, weapon] = parts;
        
        // Validate data
        const rollNum = parseInt(roll);
        const damageNum = parseInt(damage);
        
        if (isNaN(rollNum) || isNaN(damageNum)) {
            console.warn('Invalid numbers in ATTACK:', messageText);
            return null;
        }

        // Determine hit/miss (15+ hits in DCC)
        const isHit = rollNum >= 15;
        const actualDamage = isHit ? damageNum : 0;

        // Create response message
        let response;
        if (isHit) {
            response = `💥 ${attackerName} hits with ${weapon}! (Rolled ${rollNum}) - ${actualDamage} damage!`;
        } else {
            response = `❌ ${attackerName} misses with ${weapon}! (Rolled ${rollNum})`;
        }

        console.log('✅ Processed attack:', response);
        return {
            type: 'combat',
            response: response,
            hit: isHit,
            damage: actualDamage,
            attacker: attackerName,
            weapon: weapon,
            roll: rollNum
        };

    } catch (error) {
        console.error('❌ Attack processing error:', error);
        return null;
    }
}
```

---

## 🎮 Chat Manager Implementation

### Core Chat Functions
Add this **complete code** to your application:

```javascript
// ========================================
// CHAT SYSTEM CORE
// ========================================

let currentSession = null;
let messageSubscription = null;
let playerName = null;
let isStoryteller = false;

// Initialize chat system
async function initializeChatSystem(sessionCode, playerNameInput, storytellerMode = false) {
    if (!supabase) {
        throw new Error('Supabase must be initialized first. Call initializeSupabase().');
    }

    try {
        // Store session info
        currentSession = sessionCode.toUpperCase();
        playerName = playerNameInput.trim();
        isStoryteller = storytellerMode;

        // Set up real-time message listener
        await setupMessageSubscription();

        // Load recent message history
        await loadMessageHistory();

        console.log('✅ Chat system initialized for session:', currentSession);
        return true;

    } catch (error) {
        console.error('❌ Chat initialization failed:', error);
        throw error;
    }
}

// Set up real-time message subscription
async function setupMessageSubscription() {
    if (messageSubscription) {
        // Clean up existing subscription
        await messageSubscription.unsubscribe();
    }

    messageSubscription = supabase
        .channel(`chat_${currentSession}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'game_messages',
            filter: `session_code=eq.${currentSession}`
        }, (payload) => {
            console.log('📨 New message received:', payload.new);
            handleNewMessage(payload.new);
        })
        .subscribe((status) => {
            console.log(`🔗 Chat subscription status: ${status}`);
        });
}

// Load recent message history
async function loadMessageHistory(limit = 50) {
    try {
        const { data, error } = await supabase
            .from('game_messages')
            .select('*')
            .eq('session_code', currentSession)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('❌ Failed to load message history:', error);
            return;
        }

        // Display historical messages
        data.forEach(message => {
            displayMessage(message, false); // false = don't animate
        });

        console.log(`✅ Loaded ${data.length} historical messages`);

    } catch (error) {
        console.error('❌ Message history error:', error);
    }
}

// Send a chat message
async function sendChatMessage(messageText, messageType = 'chat') {
    if (!currentSession || !playerName) {
        throw new Error('Chat system not initialized');
    }

    if (!messageText || messageText.trim().length === 0) {
        console.warn('⚠️ Empty message not sent');
        return;
    }

    try {
        // Process combat commands if applicable
        let processedCommand = null;
        if (messageText.startsWith('ATTACK:')) {
            processedCommand = processAttackCommand(messageText, playerName, isStoryteller);
            if (processedCommand) {
                messageType = 'combat';
            }
        }

        // Send original message
        const { data, error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: currentSession,
                player_name: playerName,
                message_text: messageText,
                message_type: messageType,
                is_storyteller: isStoryteller
            }])
            .select();

        if (error) {
            console.error('❌ Failed to send message:', error);
            throw error;
        }

        // Send combat result if attack was processed
        if (processedCommand && isStoryteller) {
            // Auto-send combat result
            setTimeout(async () => {
                await supabase
                    .from('game_messages')
                    .insert([{
                        session_code: currentSession,
                        player_name: 'System',
                        message_text: processedCommand.response,
                        message_type: 'combat',
                        is_storyteller: true
                    }]);
            }, 500);
        }

        console.log('✅ Message sent successfully');
        return data[0];

    } catch (error) {
        console.error('❌ Send message error:', error);
        throw error;
    }
}

// Handle incoming messages
function handleNewMessage(message) {
    // Don't display our own messages (already shown locally)
    if (message.player_name === playerName) {
        return;
    }

    displayMessage(message, true); // true = animate
}

// Leave chat session
async function leaveChatSession() {
    if (!currentSession || !playerName) {
        return;
    }

    try {
        // Send disconnect message
        const disconnectMessages = [
            `${playerName} has fled the dungeon!`,
            `${playerName} vanished into the shadows!`,
            `${playerName} teleported away!`,
            `${playerName} logged off like a coward!`,
            `${playerName} abandoned their party!`
        ];
        
        const randomMessage = disconnectMessages[Math.floor(Math.random() * disconnectMessages.length)];
        
        await supabase
            .from('game_messages')
            .insert([{
                session_code: currentSession,
                player_name: 'System',
                message_text: randomMessage,
                message_type: 'system',
                is_storyteller: true
            }]);

        // Clean up subscription
        if (messageSubscription) {
            await messageSubscription.unsubscribe();
            messageSubscription = null;
        }

        // Reset session data
        currentSession = null;
        playerName = null;
        isStoryteller = false;

        console.log('✅ Left chat session');

    } catch (error) {
        console.error('❌ Error leaving session:', error);
    }
}
```

---

## 🎨 UI Integration Code

### HTML Structure Required
Your HTML must have these **exact** element IDs:

```html
<!-- Chat Configuration -->
<div id="chatConfig">
    <input type="text" id="supabaseUrl" placeholder="Supabase URL">
    <input type="text" id="supabaseKey" placeholder="API Key">
    <button onclick="connectToSupabase()">Connect</button>
</div>

<!-- Session Management -->
<div id="sessionManagement">
    <input type="text" id="sessionCode" placeholder="Session Code" maxlength="10">
    <input type="text" id="playerNameInput" placeholder="Your Name">
    <label><input type="checkbox" id="storytellerMode"> Storyteller Mode</label>
    <button onclick="createSession()">Create Session</button>
    <button onclick="joinSession()">Join Session</button>
</div>

<!-- Chat Interface -->
<div id="chatInterface" style="display: none;">
    <div id="chatMessages"></div>
    <div id="chatInput">
        <input type="text" id="messageInput" placeholder="Type message...">
        <button onclick="sendMessage()">Send</button>
        <button onclick="leaveSession()">Leave</button>
    </div>
</div>
```

### JavaScript UI Functions
Add these **exact** functions for UI integration:

```javascript
// ========================================
// UI INTEGRATION FUNCTIONS
// ========================================

// Connect to Supabase from UI
async function connectToSupabase() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();

    if (!url || !key) {
        alert('Please enter both Supabase URL and API key');
        return;
    }

    try {
        await initializeSupabase(url, key);
        await testSupabaseConnection();
        
        // Save config and show session management
        saveSupabaseConfig(url, key);
        document.getElementById('chatConfig').style.display = 'none';
        document.getElementById('sessionManagement').style.display = 'block';
        
        alert('✅ Connected to Supabase successfully!');

    } catch (error) {
        alert('❌ Connection failed: ' + error.message);
    }
}

// Create new session from UI
async function createSession() {
    const sessionCode = document.getElementById('sessionCode').value.trim();
    const playerNameInput = document.getElementById('playerNameInput').value.trim();
    const storytellerMode = document.getElementById('storytellerMode').checked;

    if (!sessionCode || !playerNameInput) {
        alert('Please enter session code and your name');
        return;
    }

    try {
        // Create session in database
        await createGameSession(sessionCode, playerNameInput);
        
        // Initialize chat
        await initializeChatSystem(sessionCode, playerNameInput, storytellerMode);
        
        // Show chat interface
        showChatInterface();
        addSystemMessage(`Session ${sessionCode} created! You are the Storyteller.`);

    } catch (error) {
        alert('❌ Failed to create session: ' + error.message);
    }
}

// Join existing session from UI
async function joinSession() {
    const sessionCode = document.getElementById('sessionCode').value.trim();
    const playerNameInput = document.getElementById('playerNameInput').value.trim();
    const storytellerMode = document.getElementById('storytellerMode').checked;

    if (!sessionCode || !playerNameInput) {
        alert('Please enter session code and your name');
        return;
    }

    try {
        // Verify session exists
        await joinGameSession(sessionCode);
        
        // Initialize chat
        await initializeChatSystem(sessionCode, playerNameInput, storytellerMode);
        
        // Show chat interface
        showChatInterface();
        addSystemMessage(`Joined session ${sessionCode} as ${playerNameInput}`);

    } catch (error) {
        alert('❌ Failed to join session: ' + error.message);
    }
}

// Send message from UI
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (!messageText) {
        return;
    }

    try {
        // Send the message
        await sendChatMessage(messageText);
        
        // Clear input
        messageInput.value = '';
        
        // Display message locally (optimistic UI)
        displayMessage({
            player_name: playerName,
            message_text: messageText,
            message_type: 'chat',
            is_storyteller: isStoryteller,
            created_at: new Date().toISOString()
        }, false);

    } catch (error) {
        alert('❌ Failed to send message: ' + error.message);
    }
}

// Leave session from UI
async function leaveSession() {
    try {
        await leaveChatSession();
        
        // Hide chat interface
        document.getElementById('chatInterface').style.display = 'none';
        document.getElementById('sessionManagement').style.display = 'block';
        
        // Clear messages
        document.getElementById('chatMessages').innerHTML = '';

    } catch (error) {
        console.error('Leave session error:', error);
    }
}

// Show chat interface
function showChatInterface() {
    document.getElementById('sessionManagement').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'block';
}

// Display a message in the chat
function displayMessage(message, animate = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    // Add special styling for different message types
    if (message.message_type === 'combat') {
        messageDiv.classList.add('combat-message');
    } else if (message.message_type === 'system') {
        messageDiv.classList.add('system-message');
    } else if (message.is_storyteller) {
        messageDiv.classList.add('storyteller-message');
    }

    // Format message content
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    const playerBadge = message.is_storyteller ? '[ST]' : '';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="player-name">${playerBadge}${message.player_name}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(message.message_text)}</div>
    `;

    // Add animation if requested
    if (animate) {
        messageDiv.style.opacity = '0';
        chatMessages.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s';
            messageDiv.style.opacity = '1';
        }, 10);
    } else {
        chatMessages.appendChild(messageDiv);
    }

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
    displayMessage({
        player_name: 'System',
        message_text: text,
        message_type: 'system',
        is_storyteller: true,
        created_at: new Date().toISOString()
    }, false);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle Enter key in message input
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Auto-load saved config
    const savedConfig = loadSupabaseConfig();
    if (savedConfig) {
        document.getElementById('supabaseUrl').value = savedConfig.url;
        document.getElementById('supabaseKey').value = savedConfig.key;
    }
});
```

---

## 🎨 CSS Styling (Optional)

### Basic Chat Styling
Add this CSS for a functional chat interface:

```css
/* Chat Interface Styling */
#chatInterface {
    max-width: 800px;
    margin: 20px auto;
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
}

#chatMessages {
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    background: #f9f9f9;
}

.chat-message {
    margin-bottom: 10px;
    padding: 8px;
    border-radius: 4px;
    background: white;
    border-left: 3px solid #ddd;
}

.combat-message {
    border-left-color: #ff6b6b;
    background: #fff5f5;
}

.system-message {
    border-left-color: #4ecdc4;
    background: #f0fffe;
    font-style: italic;
}

.storyteller-message {
    border-left-color: #ffd93d;
    background: #fffef0;
}

.message-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.player-name {
    font-weight: bold;
}

.message-content {
    color: #333;
    word-wrap: break-word;
}

#chatInput {
    display: flex;
    padding: 10px;
    background: #fff;
    border-top: 1px solid #ddd;
}

#messageInput {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 8px;
}

button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 4px;
}

button:hover {
    background: #0056b3;
}
```

---

## 🧪 Testing Your Implementation

### Step-by-Step Testing
1. **Test Supabase Connection**
   ```javascript
   await initializeSupabase(url, key);
   await testSupabaseConnection(); // Should succeed
   ```

2. **Test Session Creation**
   ```javascript
   await createGameSession('TEST01', 'TestDM');
   ```

3. **Test Message Sending**
   ```javascript
   await sendChatMessage('Hello world!');
   ```

4. **Test Combat Commands**
   ```javascript
   await sendChatMessage('ATTACK:Warrior:18:10:Sword');
   ```

5. **Test Real-time (Two Browser Tabs)**
   - Open same page in two tabs
   - Join same session with different names
   - Send messages from each tab
   - Verify messages appear in both tabs

### Expected Results
- ✅ Messages appear in real-time
- ✅ Combat commands are processed automatically
- ✅ Different message types are styled differently
- ✅ Timestamps are accurate
- ✅ No console errors

---

## 🚨 Troubleshooting Guide

### "Chat system not initialized"
**Cause**: Called chat functions before initialization  
**Solution**: Always call `initializeChatSystem()` first

### Messages not appearing in real-time
**Cause**: Subscription not working  
**Solution**: Check console for subscription status, verify table permissions

### "Session not found"
**Cause**: Invalid session code or session doesn't exist  
**Solution**: Create session first, verify session code spelling

### Combat commands not processing
**Cause**: Invalid ATTACK format  
**Solution**: Use exact format: `ATTACK:PlayerName:Roll:Damage:Weapon`

### UI elements not working
**Cause**: Missing HTML element IDs  
**Solution**: Verify all required IDs exist in your HTML

---

## 🔧 Advanced Features

### Custom Message Types
```javascript
// Add custom message type processing
function processCustomCommand(messageText) {
    if (messageText.startsWith('LOOT:')) {
        // Handle loot distribution
        return {
            type: 'loot',
            response: 'Treasure distributed!'
        };
    }
    // Add more custom commands here
    return null;
}
```

### Message Condensation
```javascript
// Combine multiple similar messages
function condenseMessages(messages) {
    // Implementation for reducing chat spam
    // Group similar messages together
}
```

### File Upload Support
```javascript
// Handle character sheet uploads
async function uploadCharacterSheet(file, sessionCode) {
    // Implementation for file handling
}
```

---

## 📦 Modular Implementation

### Using the Modular System
If you want to use the modular approach (recommended for V4):

```javascript
// Load modules first
import ChatManager from './js/modules/chatManager.js';
import ChatAdapter from './js/modules/chatAdapter.js';

// Initialize modular system
const chatManager = new ChatManager();
const adapter = new ChatAdapter(chatManager);

// Use the modular API
await chatManager.initialize(config);
```

---

## ✅ Final Integration Checklist

Before deployment, verify:

- [ ] **SupabaseConnect.md** implemented and working
- [ ] **Database tables** created with correct schema
- [ ] **All HTML elements** have correct IDs
- [ ] **Chat functions** are copied exactly as shown
- [ ] **UI functions** are implemented
- [ ] **Message subscription** is working
- [ ] **Combat commands** process correctly
- [ ] **Real-time messaging** works between browser tabs
- [ ] **Error handling** displays user-friendly messages
- [ ] **CSS styling** is applied (optional)
- [ ] **No console errors** in browser developer tools

---

## 🎯 Success Criteria

Your chat system is working correctly when:

1. **Two people can chat** from different browsers
2. **ATTACK commands** are processed automatically  
3. **Messages appear instantly** without page refresh
4. **Different message types** are styled differently
5. **No JavaScript errors** in console
6. **Session management** works (create/join/leave)

---

*Last Updated: August 24, 2025*  
*Status: Production-ready chat system*  
*Follow this guide exactly for guaranteed success*
