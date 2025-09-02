# DevChat.md - Modular Chat System Documentation

## 🎯 Overview

This document details the modular chat system built for DCC StoryTeller with V4 integration in mind. The system uses Supabase for real-time communication and is designed for "distributed computing" - where each player's client can personalize shared data.

---

## 📋 Current Status (August 23, 2025)

### ✅ Completed Features
- **Real-time messaging** with Supabase (free tier vs PubNub $98/month)
- **Command parsing** for game actions (ATTACK, ROLL, SKILL, SAVE)
- **Combat integration** with automated attack processing
- **Enemy death notifications** with loot and DCC-style snark
- **Theme switching** (light/dark mode) working properly
- **Message condensation** for better UX
- **Modular architecture** ready for V4 integration
- **Clean disconnect flow** with confirmation and chat clearing

### 🔧 Known Issues
- **Cross-browser testing needed** - Single browser works, multi-browser chat untested
- **Session persistence** - May need refresh after disconnect/reconnect
- **Error handling** - Some edge cases in connection drops

---

## 🏗️ Architecture

### File Structure
```
StoryTeller/
├── js/
│   ├── modules/                    # 🚀 PORTABLE FOR V4
│   │   ├── supabaseClient.js      # Database connection & operations
│   │   ├── chatParser.js          # Command parsing (ATTACK, ROLL, etc)
│   │   ├── combatHandler.js       # Combat processing & loot generation
│   │   ├── messageFormatter.js   # Message display & formatting
│   │   ├── chatManager.js         # Main orchestrator
│   │   └── chatAdapter.js         # Bridge to existing StoryTeller UI
│   ├── supabase-chat.js           # ✅ ACTIVE - StoryTeller integration
│   ├── realtime-chat.js           # ⚠️ ARCHIVED - PubNub version
│   └── [other StoryTeller files]
└── css/
    └── chat.css                   # Enhanced dark/light theme support
```

---

## 🔗 Database Schema

### Supabase Tables

**game_sessions**
```sql
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) UNIQUE NOT NULL,
    dm_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

**game_messages**
```sql
CREATE TABLE game_messages (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) REFERENCES game_sessions(session_code),
    player_name VARCHAR(100) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat',
    message_text TEXT NOT NULL,
    is_storyteller BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuration
- **Supabase URL**: User-provided via config UI
- **API Key**: User-provided via config UI  
- **Browser Storage**: API keys stored locally (not in code/GitHub)

---

## 🎮 Command System

### Supported Commands

**ATTACK Command**
```
Format: ATTACK:PlayerName:Roll:Damage:Weapon
Example: ATTACK:Carl:18:8:Steel Sword
```

**ROLL Command**
```
Format: ROLL:PlayerName:Die:Modifier:Purpose
Example: ROLL:Carl:d20:+3:Initiative
```

**SKILL Command**
```
Format: SKILL:PlayerName:SkillName:Roll:Modifier
Example: SKILL:Carl:Stealth:15:+2
```

**SAVE Command**
```
Format: SAVE:PlayerName:SaveType:Roll:Modifier
Example: SAVE:Carl:Reflex:12:+1
```

### Message Types
- **chat**: Regular player messages
- **system**: Automated system messages
- **game_command**: Player commands (yellow background)
- **game_response**: System responses (green background)

---

## 🎲 "Distributed Computing" Loot System

### Concept
Instead of sending specific loot amounts, the system sends **generic descriptions** that each player's V4 client can interpret based on their personal stats/luck.

### Example Flow
1. **System sends**: `"handful of coins"`
2. **Carl's V4 generates**: `12 copper + 1 silver` (based on his luck stat)
3. **Dave's V4 generates**: `8 copper + 2 bronze` (based on his luck stat)
4. **Same loot, personalized experience**

### Loot Data Structure
```javascript
{
    type: 'enemy_defeated',
    enemy: { id: 'goblin_1', name: 'Goblin', maxHp: 15 },
    killer: 'Carl',
    loot: {
        id: 'coins_handful',
        description: 'handful of coins',
        rarity: 'common',
        personalizable: true  // V4 generates actual values
    },
    viewer_prompt: 'What should they check for next?',
    sponsor_opportunity: true
}
```

---

## 🔧 V4 Integration Guide

### Step 1: Copy Modules
```bash
cp -r StoryTeller/js/modules/ V4/js/modules/
```

### Step 2: Include in HTML
```html
<!-- Portable Chat Modules -->
<script src="js/modules/supabaseClient.js"></script>
<script src="js/modules/chatParser.js"></script>
<script src="js/modules/combatHandler.js"></script>
<script src="js/modules/messageFormatter.js"></script>
<script src="js/modules/chatManager.js"></script>
<script src="js/modules/chatAdapter.js"></script>
```

### Step 3: Basic Integration
```javascript
// Initialize chat system
const chatManager = new ChatManager();
await chatManager.initialize(supabaseUrl, supabaseKey);

// Join session
await chatManager.joinSession('ABC123', playerName, false);

// Send attack command
await chatManager.sendMessage('ATTACK:Carl:18:8:Steel Sword');

// Handle incoming messages
chatManager.setEventHandlers(
    (message) => displayInUI(message),
    (status) => updateConnectionStatus(status),
    (type, error) => handleError(type, error)
);
```

### Step 4: V4-Specific Customizations

**Button Integration**: Every button click in V4 should potentially send chat data:
```javascript
// Attribute roll button
function rollAttribute(attribute, modifier) {
    const roll = rollD20();
    const total = roll + modifier;
    
    // Send to chat
    chatManager.sendMessage(`ROLL:${playerName}:d20:${modifier}:${attribute} check`);
    
    // Update local UI
    updateAttributeDisplay(attribute, total);
}

// Attack button  
function performAttack(weapon, damage) {
    const roll = rollD20();
    
    // Send to chat for DM processing
    chatManager.sendMessage(`ATTACK:${playerName}:${roll}:${damage}:${weapon.name}`);
}
```

**Loot Personalization**:
```javascript
// When receiving loot data
function personalizeLoot(lootData, playerStats) {
    if (!lootData.personalizable) return lootData;
    
    switch(lootData.id) {
        case 'coins_handful':
            // Generate based on player's luck stat
            const copper = 8 + Math.floor(Math.random() * playerStats.luck);
            const silver = Math.random() < (playerStats.luck / 20) ? 1 : 0;
            return { copper, silver };
            
        case 'weapon_damaged':
            // Generate condition based on player's repair skill
            const condition = Math.max(10, 50 + playerStats.repair * 2);
            return { ...lootData, condition };
    }
}
```

---

## 🎨 UI Integration Notes

### CSS Theme Variables
The system uses CSS variables for consistent theming:
```css
:root {
    --primary: #6366f1;
    --bg-primary: #ffffff;
    --text-primary: #0f172a;
    /* ... more variables */
}

body.dark-theme {
    --primary: #818cf8;
    --bg-primary: #0f172a;
    --text-primary: #f1f5f9;
    /* ... dark overrides */
}
```

### Message Styling Classes
- `.chat-message` - Base message style
- `.chat-message.system` - System messages (gray)
- `.chat-message.game_command` - Commands (yellow)
- `.chat-message.game_response` - Responses (green)

---

## 🚀 Deployment Notes

### Supabase Setup
1. **Create Supabase project** (free tier: 500MB DB, 2GB bandwidth/month)
2. **Run table creation SQL** (auto-handled by modules)
3. **Get project URL and anon key**
4. **Configure in app** (stored in browser localStorage)

### Security
- **API keys in localStorage** only (never in code/GitHub)
- **RLS policies** can be added to Supabase for row-level security
- **Input validation** on all commands before processing

---

## 🐛 Troubleshooting

### Common Issues

**"Redeclaration" Errors**
- Cause: Duplicate script tags loading same file twice
- Fix: Check HTML for duplicate `<script src="">` tags

**Connection Issues**
- Check Supabase URL/key validity
- Verify network connectivity
- Check browser dev tools for CORS errors

**Message Not Appearing**
- Verify session code length (≤10 characters)
- Check message type formatting
- Ensure real-time subscription is active

### Debug Commands
```javascript
// Check chat manager state
console.log(globalChatManager.getState());

// Check combat status
console.log(globalChatManager.getCombatStatus());

// Test message parsing
const parser = new ChatParser();
console.log(parser.parseMessage('ATTACK:Carl:18:8:Steel Sword'));
```

---

## 📋 TODO for V4 Integration

### High Priority
- [ ] **Cross-browser testing** - Verify multi-player chat works
- [ ] **Session persistence** - Handle page refreshes gracefully
- [ ] **V4 UI adaptation** - Customize message display for V4 theme
- [ ] **Button integration** - Connect all V4 buttons to chat commands

### Medium Priority  
- [ ] **Enhanced loot system** - More sophisticated personalization
- [ ] **Combat automation** - Full attack resolution with AC/HP tracking
- [ ] **Dice roller integration** - Connect V4's dice system to chat
- [ ] **Achievement integration** - Chat notifications for achievements

### Low Priority
- [ ] **Voice chat** - Add WebRTC for voice communication
- [ ] **File sharing** - Character sheets, images via chat
- [ ] **Chat history** - Persistent message history
- [ ] **Chat moderation** - DM tools for managing chat

---

## 🎯 DCC-Specific Features

### Sponsor Messages
Random sponsor opportunities appear with enemy deaths:
- "This death brought to you by Dave's Discount Dungeon Gear!"
- "Remember: Carl's Survival Crackers - Now with 30% more survival!"
- "Sponsored by Murderface's Weapon Emporium!"

### Viewer Interaction Prompts
- "Viewers, what should they loot first?"
- "Chat, should they check for traps?"
- "Viewers, rate this kill 1-10!"

### Disconnect Messages
Snarky AI-style messages when players leave:
- "🏨 You rest for the night in a safe room..."
- "🚪 Have fun with real life! (Warning: No respawns available)"
- "🎭 The Storyteller grants you temporary immunity from plot hooks"

---

## 📞 Emergency Contacts & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Real-time Subscriptions**: https://supabase.com/docs/guides/realtime
- **JavaScript Client**: https://supabase.com/docs/reference/javascript

---

*Last Updated: August 23, 2025*
*Status: Modular system complete, ready for V4 integration*
*Next Session: Cross-browser testing and V4 UI adaptation*
