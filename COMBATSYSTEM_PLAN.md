# DCC Combat System Implementation Plan

## 🎯 OVERVIEW
This document tracks the complete implementation of the DCC combat system across V4-network (mobile player app) and StoryTeller (DM app). Each feature follows a triple-check system:
- ✅ **V4-network**: Implementation complete
- ✅ **StoryTeller**: Implementation complete  
- ✅ **Tested**: Working as intended

**RULE**: Create new files when possible. Avoid modifying existing code to prevent breaking functionality.

---

## 🎮 COMBAT SYSTEM ARCHITECTURE

### 🚀 Initiative Phase Flow
1. **StoryTeller** clicks "Start Combat"
2. **Auto-prompt** sent to all players: "Please roll initiative!"
3. **V4-network** shows "Roll Initiative" button (or DEX attribute when connected)
4. **Players** send: `INITIATIVE:PlayerName:TotalRoll:Details`
5. **StoryTeller** collects all rolls + auto-rolls enemies
6. **Turn order** established and locked

### ⚔️ Combat Phase Flow
1. **Turn order** displayed clearly to all players
2. **Players** can attack anytime (buttons always work)
3. **StoryTeller** has "action buffer" - holds attacks until player's turn
4. **Turn comes up**: "Process Alice's queued attack?" ✓
5. **Enemy turns**: Auto vs Manual toggle

### 🤖 Enemy AI System
- **Manual mode**: StoryTeller picks enemy attacks
- **Auto mode**: AI chooses based on selected tactics
- **Smart targeting**: Follow tactical preferences (Kill the Healer, etc.)

---

## 🛠️ IMPLEMENTATION PHASES

## Phase 1: Initiative System ⚡

### 1.1 Initiative Rolling
- ✅ **V4-network**: DEX attribute detects combat mode and rolls initiative
- ✅ **V4-network**: `rollInitiativeForDexterity()` function with d20+DEX+luck calculation
- ✅ **V4-network**: Luck dice auto-calculation (level ÷ 10, rounded up)
- ✅ **StoryTeller**: `processInitiativeCommand()` processes INITIATIVE commands
- ✅ **Tested**: Basic initiative rolling works - CONSOLE TESTED 2025-09-03 ✅

**Files Modified:**
- `V4-network/js/core/main.js` - Added combat detection and initiative functions
- `V4-network/js/supabase-chat.js` - Added INITIATIVE command processing
- `StoryTeller/js/supabase-chat.js` - Added INITIATIVE command processing

**Chat Command:** `INITIATIVE:PlayerName:TotalRoll:Details`

### 1.2 Initiative Collection Interface
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Initiative collector UI panel
- ⬜ **Tested**: Full initiative collection workflow

**New Files Needed:**
- `StoryTeller/css/initiative-tracker.css`
- `StoryTeller/js/initiative-manager.js`

**Methods to Implement:**
- `collectInitiative(playerName, roll, details)`
- `sortTurnOrder()`
- `displayTurnOrder()`
- `startCombatRound()`

### 1.3 Turn Order Display
- ⬜ **V4-network**: Turn order widget in chat panel
- ⬜ **StoryTeller**: Turn order tracker with current player highlight
- ⬜ **Tested**: Clear visual turn indication

**New Files Needed:**
- `StoryTeller/components/turn-order-display.html`
- `shared-modules/turn-order-sync.js`

---

## Phase 2: Action Buffer System 🎯

### 2.1 Attack Integration
- ✅ **V4-network**: Weapon buttons send ATTACK commands when in combat
- ✅ **V4-network**: `rollWeaponDamage()` modified for combat integration
- ✅ **StoryTeller**: `processAttackCommand()` processes ATTACK commands
- ✅ **Tested**: Basic attack integration works - UI TESTED 2025-09-03 ✅

**Files Modified:**
- `V4-network/js/core/main.js` - Added combat detection to weapon rolling
- `V4-network/js/supabase-chat.js` - ATTACK command processing exists
- `StoryTeller/js/supabase-chat.js` - ATTACK command processing exists

**Chat Command:** `ATTACK:PlayerName:AttackRoll:Damage:WeaponName`

### 2.2 Spell Integration
- ✅ **V4-network**: Spell buttons send SPELL commands when in combat
- ✅ **V4-network**: `castSpell()` modified for combat integration
- ✅ **StoryTeller**: `processSpellCommand()` processes SPELL commands
- ✅ **Tested**: Basic spell integration works - UI TESTED 2025-09-03 ✅

**Files Modified:**
- `V4-network/js/core/main.js` - Added combat detection to spell casting
- `V4-network/js/supabase-chat.js` - Added SPELL command processing
- `StoryTeller/js/supabase-chat.js` - Added SPELL command processing

**Chat Command:** `SPELL:PlayerName:AttackRoll:Damage:SpellName:MPCost`

### 2.3 Skill Integration
- ✅ **V4-network**: Skill buttons send ROLL commands when in combat
- ✅ **V4-network**: `rollSkill()` modified for combat integration
- ✅ **StoryTeller**: `processRollCommand()` processes ROLL commands
- ✅ **Tested**: Basic skill integration works - UI TESTED 2025-09-03 ✅

**Files Modified:**
- `V4-network/js/core/main.js` - Added combat detection to skill rolling
- `V4-network/js/supabase-chat.js` - Added ROLL command processing
- `StoryTeller/js/supabase-chat.js` - Added ROLL command processing

**Chat Command:** `ROLL:PlayerName:SkillName:Result:Stat`

### 2.4 Action Buffer Interface
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Action buffer display panel
- ⬜ **Tested**: Actions queue and process on correct turns

**New Files Needed:**
- `StoryTeller/css/action-buffer.css`
- `StoryTeller/js/action-buffer-manager.js`

**Methods to Implement:**
- `queueAction(playerName, actionData)`
- `processQueuedActions(playerName)`
- `displayActionBuffer()`
- `clearProcessedActions()`

### 2.5 Turn Management
- ⬜ **V4-network**: Turn notification system
- ⬜ **StoryTeller**: "Next Turn" advancement controls
- ⬜ **Tested**: Smooth turn progression

**New Files Needed:**
- `StoryTeller/js/turn-manager.js`
- `shared-modules/turn-sync.js`

**Methods to Implement:**
- `advanceTurn()`
- `notifyCurrentPlayer()`
- `highlightActivePlayer()`

---

## Phase 3: Combat Resolution ⚔️

### 3.1 Opposed Roll System
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Automated opposed roll calculations
- ⬜ **Tested**: Attacker vs Defender+3 system works

**New Files Needed:**
- `StoryTeller/js/combat-resolver.js`

**Methods to Implement:**
- `resolveAttack(attackRoll, defenderRoll)`
- `calculateDamage(attackData, isHit)`
- `applyDamage(target, damage)`

### 3.2 Enemy Combat Interface
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Enemy action quick buttons
- ⬜ **Tested**: Manual enemy combat works

**New Files Needed:**
- `StoryTeller/css/enemy-combat.css`
- `StoryTeller/js/enemy-manager.js`

### 3.3 Combat Panel Integration
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Integrate with existing combat panel
- ⬜ **Tested**: All combat features work together

---

## Phase 4: Enemy AI System 🤖

### 4.1 AI Tactical Settings
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: AI preference interface
- ⬜ **Tested**: AI tactical selection works

**New Files Needed:**
- `StoryTeller/css/ai-tactics.css`
- `StoryTeller/js/ai-manager.js`
- `StoryTeller/data/ai-tactics.json`

**AI Tactics:**
- Kill the Healer
- Focus Fire
- Crowd Control Priority
- Defensive Positioning

### 4.2 Auto-Combat Engine
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Automated enemy turn processing
- ⬜ **Tested**: AI makes intelligent combat decisions

**Methods to Implement:**
- `analyzeTargets()`
- `selectOptimalTarget(tactic)`
- `executeAIAction(enemy, target)`

### 4.3 Smart Targeting
- ⬜ **V4-network**: N/A
- ⬜ **StoryTeller**: Character analysis for targeting
- ⬜ **Tested**: AI properly identifies healers, threats, etc.

---

## 📁 FILE STRUCTURE

### New Files Created
```
📁 StoryTeller/
  📁 css/
    📄 initiative-tracker.css
    📄 action-buffer.css
    📄 enemy-combat.css
    📄 ai-tactics.css
  📁 js/
    📄 initiative-manager.js
    📄 action-buffer-manager.js
    📄 turn-manager.js
    📄 combat-resolver.js
    📄 enemy-manager.js
    📄 ai-manager.js
  📁 components/
    📄 turn-order-display.html
  📁 data/
    📄 ai-tactics.json

📁 shared-modules/
  📄 turn-order-sync.js
  📄 turn-sync.js

📁 V4-network/
  📁 css/
    📄 combat-indicators.css
```

### Modified Files
```
📄 V4-network/js/core/main.js
  ✅ Added: isInCombatMode()
  ✅ Added: rollInitiativeForDexterity()
  ✅ Modified: rollAttribute() - DEX detection
  ✅ Modified: rollWeaponDamage() - combat integration
  ✅ Modified: castSpell() - combat integration
  ✅ Modified: rollSkill() - combat integration

📄 V4-network/js/supabase-chat.js
  ✅ Added: processInitiativeCommand()
  ✅ Added: processSpellCommand()
  ✅ Added: processRollCommand()
  ✅ Modified: Message processing for new commands
```

---

## 🧪 TESTING CHECKLIST

### Phase 1 Testing
- ✅ DEX attribute rolls initiative when connected - TESTED 2025-09-03
- ✅ Initiative calculation includes luck dice - TESTED 2025-09-03  
- ✅ INITIATIVE commands appear in StoryTeller chat - TESTED 2025-09-03
- ⬜ Initiative collector gathers all player rolls
- ⬜ Turn order displays correctly

### Phase 2 Testing
- ✅ Weapon attacks send ATTACK commands - TESTED 2025-09-03
- ✅ Spells send SPELL commands - TESTED 2025-09-03
- ✅ Skills send ROLL commands - TESTED 2025-09-03
- ⬜ Actions queue when not player's turn
- ⬜ Actions process on correct turn

### Phase 3 Testing
- ⬜ Opposed rolls calculate correctly
- ⬜ Damage applies properly
- ⬜ Combat resolution is smooth

### Phase 4 Testing
- ⬜ AI selects appropriate targets
- ⬜ AI follows tactical preferences
- ⬜ Auto-combat feels natural

---

## 🚨 CURRENT STATUS

**✅ COMPLETED & TESTED:**
- Initiative rolling with luck dice (V4-network) ✅✅✅ 
- Combat mode detection (V4-network) ✅✅✅
- Attack/Spell/Skill integration (V4-network) ✅✅✅
- Chat command processing (StoryTeller) ✅✅✅
- All basic command processing functions implemented ✅✅✅
- **MAJOR MILESTONE: All Phase 1.1 and Phase 2.1-2.3 COMPLETE! 🎉**

**⏳ NEXT PHASE:**
- **PHASE 1.2**: Initiative collector interface (StoryTeller UI)
- **PHASE 1.3**: Turn order display
- **PHASE 2.4**: Action buffer interface

**📋 TESTING PLAN:**
1. Connect V4-network to StoryTeller chat
2. Test DEX attribute → initiative roll → StoryTeller display
3. Test weapon button → attack command → StoryTeller display  
4. Test spell button → spell command → StoryTeller display
5. Test skill button → roll command → StoryTeller display
6. Verify all commands show formatted messages (not raw commands)
7. **IF ALL PASS**: Mark Phase 1.1 and Phase 2.1-2.3 as ✅✅✅

---

## 💡 NOTES & CONSIDERATIONS

### Design Principles
1. **Mobile-First**: V4-network must work perfectly on phones
2. **No UI Clutter**: Integrate with existing buttons, don't add bulk
3. **Fair Play**: Players roll their own dice for transparency
4. **Smart Defaults**: System should work with minimal setup

### Technical Considerations
1. **New Files Preferred**: Avoid modifying existing code when possible
2. **Backwards Compatible**: Don't break existing functionality
3. **Chat Integration**: Use existing chat system for commands
4. **Real-time Sync**: Keep all players informed of combat state

### Future Enhancements
- Status effects integration
- Environmental hazards
- Multi-round spell effects
- Combat log export
- Combat replay system

---

*Last Updated: September 3, 2025*
*Next Review: After Phase 1 completion*
