up# DCC Custom - Development Notes

## Project Overview
Dungeon Crawler World character sheet application with steganography-based character sharing system.

**Live URL:** https://dcc-custom.vercel.app/

## Recent Major Development: Character Card Steganography System

### Background
- **Original Issue:** QR code sharing system had "undefined" alert warnings
- **Solution:** Replaced QR system with steganography-based character cards
- **Implementation Date:** August 21, 2025

### Major Updates (August 21-22, 2025)

#### 🎨 Layout Selection System
- **4 Card Formats:** Users can now choose from multiple card layouts:
  - **Portrait Card:** Social media friendly with character portrait and key stats
  - **Stat Sheet:** Compact detailed statistics view
  - **Full Character Sheet:** Complete sheet with classic D&D graphing paper background
  - **Combat Card:** Quick combat reference with HP, weapons, and spells
- **Preview System:** Beautiful modal with visual previews of each layout option
- **Dynamic Generation:** Each layout has custom canvas sizing and themed styling

#### 📱 Mobile App Integration
- **Cordova Setup:** Complete mobile app structure in `/Cordova/DCWorld/` folder
- **Android Ready:** Fully configured for Android app building and testing
- **PWA Enhancements:** Better iOS support with proper meta tags and apple-touch-icons
- **User Testing:** Android testers gave extremely positive feedback

#### 🎮 Enhanced User Interface
- **Header Button Additions:**
  - Roll History Button: Quick access to dice roll history modal
  - Status Effects Button: Quick access to status effects modal
- **Modal System Improvements:**
  - Layout Selection Modal with visual previews
  - Roll History Modal for viewing dice rolls
  - Status Effects Modal for managing character conditions
- **Mobile Accessibility:** Better navigation for mobile users

#### 🔧 Technical Infrastructure
- **QR Code Scanner:** New implementation with `qr-scanner.js` and fallback support
- **Test System:** Test characters and backup files in `/test_chars/` folder
- **File Organization:** Better structure for cross-platform development

### Steganography Implementation Details

#### Core Technology
- **Method:** LSB (Least Significant Bit) embedding in PNG images
- **Data Storage:** Character data embedded in red channel of image pixels
- **File Location:** `/qr.js` (completely rewritten from QR system)

#### Key Functions in qr.js
1. **`generateCharacterCard()`** - Main entry point for card generation
2. **`determineCardStyle()`** - Selects theme based on character attributes
3. **`embedDataInImage()`** - LSB steganography embedding
4. **`extractDataFromImage()`** - LSB steganography extraction (needs implementation)
5. **Themed drawing functions:**
   - `drawMagicalCard()` - Purple/mystical theme
   - `drawWarriorCard()` - Red/brown warrior theme
   - `drawTechCard()` - Blue/cyan tech theme
   - `drawNatureCard()` - Green/brown nature theme
   - `drawClassicCard()` - Gold/cream default theme

#### Character Card Features
- **Portrait Integration:** Extracts character portrait from DOM element `#portrait-display`
- **Themed Styling:** 5 different visual themes based on character class/race/background
- **Decorative Elements:** Theme-specific borders, icons, and visual effects
- **Stat Display:** Formatted character attributes with visual enhancements
- **URL Branding:** Shows `dcc-custom.vercel.app` at bottom

#### Theme Detection Logic
```javascript
// Themes assigned based on character attributes:
// - Magical: wizard, sorcerer, warlock, druid classes OR elf, gnome races
// - Warrior: fighter, barbarian, paladin, monk classes OR dwarf, orc races  
// - Tech: hacker, engineer, pilot classes OR cyborg, android races
// - Nature: druid class OR elf (if not magical), nature backgrounds
// - Classic: Default fallback theme
```

### Current Status

#### ✅ Completed (Updated August 22, 2025)
- Character card generation with themed designs
- LSB steganography data embedding 
- Portrait extraction and integration
- Modal positioning fixes in CSS
- URL updated to correct Vercel deployment
- 5 complete visual themes implemented
- **NEW:** Layout Selection System - 4 different card formats
- **NEW:** Enhanced Header UI with quick-access buttons
- **NEW:** Roll History Modal for easy dice roll viewing
- **NEW:** Status Effects Modal for character condition management
- **NEW:** Cordova Mobile App Integration (Android ready)
- **NEW:** QR Code Scanner Implementation with fallback
- **NEW:** Test Character System with backup files
- **NEW:** Enhanced PWA support for iOS devices

#### 🔄 In Progress
- **CURRENT:** Android app testing (HUGE SUCCESS - testers loved it!)
- **NEXT:** Minor UI tweaks based on user feedback

#### 📋 TODO
1. **PNG Data Extraction:** (Lower priority after mobile success)
   - Implement LSB extraction algorithm
   - Add file upload handling for character cards
   - Parse extracted JSON data back to character object
   - Error handling for invalid/corrupted images

2. **Mobile App Enhancements:**
   - Address any tester feedback
   - App store preparation
   - Performance optimizations

### Technical Implementation Notes

#### LSB Steganography Details
- **Embedding:** Modify least significant bit of red channel pixels
- **Data Format:** JSON string of character data
- **Capacity:** Theoretical limit depends on image size (600x800 = 480,000 bits available)
- **Invisibility:** Changes are imperceptible to human eye

#### File Structure (Updated)
```
/qr.js - Complete steganography + layout selection system
/qr-scanner.js - QR code scanning implementation
/jsqr-fallback.js - Fallback QR scanning support
/index.html - Enhanced modal system with layout selection
/style.css - Enhanced modal positioning and layout previews
/character-manager.js - Character data management
/main.js - Core application logic
/Cordova/DCWorld/ - Complete mobile app structure
/test_chars/ - Test characters and backups
/markdown_readme/ - Development documentation
```

#### Modal System (Expanded)
- **Layout Selection Modal:** `#layout-selection-modal` - Choose card format with previews
- **Card Generation Modal:** `#card-modal` - Shows generated character card
- **Card Loading Modal:** `#card-scanner-modal` - File upload for loading cards
- **Roll History Modal:** `#roll-history-modal` - View dice roll history
- **Status Effects Modal:** `#status-effects-modal` - Manage character status effects
- **Functions:** 
  - `shareCharacterAsCard()` - Now opens layout selection
  - `generateSelectedLayout(layout)` - Generates specific card format
  - `showRollHistoryModal()` - Quick access to roll history
  - `showStatusEffectsModal()` - Quick access to status effects

### Character Data Structure
Character object includes:
- Basic info (name, level, age, portrait)
- Race/heritage with custom bonuses
- Background/job information  
- Class with abilities
- 6 core attributes (STR, DEX, CON, INT, WIS, CHA)
- Skills, spells, equipment
- Story/backstory text
- Current HP/MP values

### Development Environment Setup
- **IDE:** VS Code with AI Chat
- **Git:** Repository synced across multiple machines
- **Deployment:** Vercel automatic deployment
- **Testing:** Browser-based testing + Android app testing
- **Mobile:** Cordova framework for Android/iOS builds

### Android App Success! 🎉
- **Tester Feedback:** "LOVED the android app, far more than expected"
- **Mobile-First Design:** Layout selection and quick-access buttons work perfectly on mobile
- **Performance:** Smooth operation on Android devices
- **User Experience:** Intuitive navigation and beautiful card generation

### Known Issues
- None currently - system stable and well-received by testers

### Next Session Preparation
When resuming development:
1. Load this file for context
2. Address any UI tweaks based on user feedback
3. Consider app store preparation
4. Focus on steganography extraction if needed (lower priority)

### Contact Context
- **User:** Brad (uses multiple development machines)
- **Sync Method:** Git repository with development notes
- **AI Assistant:** GitHub Copilot (VS Code AI Chat)

---

*Last Updated: August 22, 2025*
*Current Focus: UI tweaks based on successful Android app testing*
*Major Milestone: Android app testing exceeded expectations!*
