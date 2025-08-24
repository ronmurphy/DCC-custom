# SupabaseConnect.md - Complete Supabase Integration Guide

## 🎯 Purpose
This document provides **step-by-step instructions** for integrating Supabase real-time database functionality into the DCC StoryTeller application. Follow these steps **exactly** to avoid connection issues.

---

## � NEW: One-Method Full Connect

### Quick Start - Use `fullSupabaseConnect()`
```javascript
// For DM creating a new session
const result = await fullSupabaseConnect('Alice', 'DCC01', true, 'create');

// For Player joining existing session  
const result = await fullSupabaseConnect('Bob', 'DCC01', false, 'join');

// Check result
if (result.success) {
    console.log('Connected! Session info:', result.sessionInfo);
    // Ready to send/receive messages!
} else {
    console.error('Connection failed:', result.error);
}
```

### What `fullSupabaseConnect()` Does
1. ✅ **Validates inputs** (name, session code)
2. ✅ **Initializes Supabase** (if not already done)
3. ✅ **Creates or joins session** (based on mode)
4. ✅ **Sets up real-time messaging** (automatic subscription)
5. ✅ **Starts connection monitoring** (auto-reconnect system)
6. ✅ **Updates UI elements** (if they exist)
7. ✅ **Sends announcement** (join/create message)
8. ✅ **Returns detailed result** (success/error info)

### 🔄 **AUTO-RECONNECTION FEATURES**
- **Mobile-Friendly**: Detects when app goes to background/foreground
- **Network Monitoring**: Handles network connectivity changes
- **Heartbeat System**: Sends invisible keepalive messages every 15 seconds
- **Auto-Retry**: Exponential backoff reconnection (up to 10 attempts)
- **Smart Recovery**: Reconnects when returning to foreground
- **Connection Status**: Visual indicators for connection health

**Parameters:**
- `playerName` (string): Name of the player/DM
- `sessionCode` (string): Session code to create or join (max 10 chars)
- `isStoryteller` (boolean): true for DM, false for player
- `mode` (string): 'create' for new session, 'join' for existing
- `options` (object): Optional configuration (future use)

---

## �📋 Prerequisites

### What You Need
1. **Supabase account** (free tier is sufficient)
2. **Project URL** from your Supabase dashboard
3. **Anon/Public API key** from your Supabase dashboard
4. **Modern web browser** with JavaScript enabled

### Supabase Setup (If Not Done)
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Wait for project to initialize (2-3 minutes)
5. Go to **Settings** → **API**
6. Copy your **URL** and **anon public** key

---

## 🏗️ Database Schema

### Required Tables
The application needs these **exact** tables. Copy and paste this SQL into your Supabase SQL editor:

```sql
-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) UNIQUE NOT NULL,
    dm_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Game Messages Table  
CREATE TABLE IF NOT EXISTS game_messages (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) REFERENCES game_sessions(session_code),
    player_name VARCHAR(100) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat',
    message_text TEXT NOT NULL,
    is_storyteller BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
```

### ⚠️ Critical Notes
- **VARCHAR(10)** for session_code is **mandatory** - do not change this
- **Table names must be exact** - `game_sessions` and `game_messages`
- **Column names must be exact** - any changes will break the application

---

## 📦 Required Dependencies

### HTML Script Tags
Add this **before** any application scripts in your HTML:

```html
<!-- REQUIRED: Supabase JavaScript Client -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### ⚠️ Version Important
- Use **@supabase/supabase-js@2** (version 2)
- Do **not** use version 1 or older versions
- Do **not** modify the CDN URL

---

## 🔧 JavaScript Integration

### Step 1: Initialize Supabase Client
Add this code **exactly** as shown:

```javascript
// ========================================
// SUPABASE CONFIGURATION
// ========================================
let supabase = null;
let currentConfig = null;

// Initialize Supabase connection
async function initializeSupabase(url, key) {
    if (!url || !key) {
        throw new Error('Supabase URL and API key are required');
    }

    try {
        // Create Supabase client
        supabase = window.supabase.createClient(url, key);
        
        // Store configuration
        currentConfig = { url, key };
        
        console.log('✅ Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        throw error;
    }
}
```

### Step 2: Test Connection
Add this function to verify the connection works:

```javascript
// Test Supabase connection
async function testSupabaseConnection() {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        // Simple query to test connection
        const { data, error } = await supabase
            .from('game_sessions')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Connection test failed:', error);
            throw error;
        }

        console.log('✅ Supabase connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Connection test error:', error);
        throw error;
    }
}
```

### Step 3: Create Session Function
**Exact code** for creating game sessions:

```javascript
// Create a new game session
async function createGameSession(sessionCode, dmName) {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }

    if (!sessionCode || sessionCode.length > 10) {
        throw new Error('Session code must be 1-10 characters');
    }

    if (!dmName || dmName.trim().length === 0) {
        throw new Error('DM name is required');
    }

    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .insert([{
                session_code: sessionCode.toUpperCase(),
                dm_name: dmName.trim(),
                is_active: true
            }])
            .select();

        if (error) {
            console.error('❌ Failed to create session:', error);
            throw error;
        }

        console.log('✅ Session created:', data[0]);
        return data[0];
    } catch (error) {
        console.error('❌ Create session error:', error);
        throw error;
    }
}
```

### Step 4: Join Session Function
**Exact code** for joining existing sessions:

```javascript
// Join an existing game session
async function joinGameSession(sessionCode) {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }

    if (!sessionCode || sessionCode.length > 10) {
        throw new Error('Session code must be 1-10 characters');
    }

    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('session_code', sessionCode.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Session not found or inactive');
            }
            console.error('❌ Failed to join session:', error);
            throw error;
        }

        console.log('✅ Joined session:', data);
        return data;
    } catch (error) {
        console.error('❌ Join session error:', error);
        throw error;
    }
}
```

### Step 5: Send Message Function
**Exact code** for sending messages:

```javascript
// Send a message to the game session
async function sendMessage(sessionCode, playerName, messageText, messageType = 'chat', isStoryteller = false) {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }

    if (!sessionCode || !playerName || !messageText) {
        throw new Error('Session code, player name, and message text are required');
    }

    try {
        const { data, error } = await supabase
            .from('game_messages')
            .insert([{
                session_code: sessionCode.toUpperCase(),
                player_name: playerName.trim(),
                message_text: messageText.trim(),
                message_type: messageType,
                is_storyteller: isStoryteller
            }])
            .select();

        if (error) {
            console.error('❌ Failed to send message:', error);
            throw error;
        }

        console.log('✅ Message sent:', data[0]);
        return data[0];
    } catch (error) {
        console.error('❌ Send message error:', error);
        throw error;
    }
}
```

### Step 6: Real-time Subscription
**Exact code** for listening to new messages:

```javascript
// Subscribe to real-time messages
function subscribeToMessages(sessionCode, messageCallback) {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }

    if (!sessionCode || !messageCallback) {
        throw new Error('Session code and callback function are required');
    }

    try {
        const subscription = supabase
            .channel(`game_messages:${sessionCode}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_messages',
                filter: `session_code=eq.${sessionCode.toUpperCase()}`
            }, (payload) => {
                console.log('📨 New message received:', payload.new);
                messageCallback(payload.new);
            })
            .subscribe((status) => {
                console.log(`🔗 Subscription status: ${status}`);
            });

        console.log('✅ Subscribed to messages for session:', sessionCode);
        return subscription;
    } catch (error) {
        console.error('❌ Subscription error:', error);
        throw error;
    }
}
```

---

## 🔑 Configuration Management

### Safe API Key Storage
**Never hardcode API keys**. Use this pattern:

```javascript
// Configuration storage (browser localStorage)
function saveSupabaseConfig(url, key) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    console.log('✅ Supabase config saved to localStorage');
}

function loadSupabaseConfig() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    
    if (!url || !key) {
        console.warn('⚠️ No Supabase config found in localStorage');
        return null;
    }
    
    return { url, key };
}

function clearSupabaseConfig() {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    console.log('🗑️ Supabase config cleared');
}
```

---

## 📝 Complete Usage Example

### HTML Setup
```html
<!DOCTYPE html>
<html>
<head>
    <title>StoryTeller with Supabase</title>
</head>
<body>
    <!-- UI elements here -->
    
    <!-- REQUIRED: Load Supabase before your scripts -->
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    
    <!-- Your application scripts -->
    <script>
        // Your Supabase integration code here
    </script>
</body>
</html>
```

### JavaScript Usage
```javascript
// Complete example of using the functions
async function setupGame() {
    try {
        // 1. Initialize Supabase
        await initializeSupabase('YOUR_SUPABASE_URL', 'YOUR_API_KEY');
        
        // 2. Test connection
        await testSupabaseConnection();
        
        // 3. Create or join session
        const session = await createGameSession('ABC123', 'DM Name');
        // OR: const session = await joinGameSession('ABC123');
        
        // 4. Set up message listener
        const subscription = subscribeToMessages('ABC123', (message) => {
            console.log('New message:', message);
            // Update your UI here
        });
        
        // 5. Send a message
        await sendMessage('ABC123', 'Player Name', 'Hello everyone!');
        
        console.log('✅ Game setup complete');
    } catch (error) {
        console.error('❌ Setup failed:', error);
        alert('Failed to connect to game: ' + error.message);
    }
}

// Call setup when page loads
document.addEventListener('DOMContentLoaded', setupGame);
```

---

## 🚨 Common Errors & Solutions

### Error: "Invalid API key"
**Solution**: Check your API key is the **anon/public** key, not the service key

### Error: "relation does not exist"
**Solution**: Run the SQL schema creation queries in your Supabase dashboard

### Error: "Failed to connect"
**Solution**: 
1. Check your Supabase URL format: `https://xxxxx.supabase.co`
2. Verify your project is active in Supabase dashboard
3. Check browser console for CORS errors

### Error: "Session code too long"
**Solution**: Session codes must be 10 characters or less

### Error: "Supabase not initialized"
**Solution**: Always call `initializeSupabase()` before any other functions

---

## ✅ Testing Checklist

Before considering the integration complete:

- [ ] Tables created successfully in Supabase
- [ ] Supabase client loads without errors
- [ ] `initializeSupabase()` succeeds
- [ ] `testSupabaseConnection()` succeeds  
- [ ] Can create new session
- [ ] Can join existing session
- [ ] Can send messages
- [ ] Real-time subscription receives messages
- [ ] No console errors

---

## 🔒 Security Notes

### What's Safe
- **anon/public API key** in browser JavaScript
- **localStorage** for storing user's own config
- **Client-side validation** before database calls

### What's NOT Safe
- **service_role key** in browser JavaScript (never use this)
- **Hardcoded credentials** in source code
- **No input validation** before database operations

---

*Last Updated: August 24, 2025*
*Status: Production-ready Supabase integration*
*Follow this guide exactly for guaranteed success*
