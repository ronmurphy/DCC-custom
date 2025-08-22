up# DCC Custom - Development Notes

## Project Overview
Dungeon Crawler World character sheet application with steganography-based character sharing system.

**Live URL:** https://dcc-custom.vercel.app/

## Recent Major Development: Character Card Steganography System

### Background
- **Original Issue:** QR code sharing system had "undefined" alert warnings
- **Solution:** Replaced QR system with steganography-based character cards
- **Implementation Date:** August 21, 2025

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

#### ✅ Completed
- Character card generation with themed designs
- LSB steganography data embedding 
- Portrait extraction and integration
- Modal positioning fixes in CSS
- URL updated to correct Vercel deployment
- 5 complete visual themes implemented

#### 🔄 In Progress
- **NEXT TASK:** Implement `extractDataFromImage()` function for loading characters from PNG files
- **NEXT SESSION:** Work on PNG file loading functionality

#### 📋 TODO
1. **PNG Data Extraction:**
   - Implement LSB extraction algorithm
   - Add file upload handling for character cards
   - Parse extracted JSON data back to character object
   - Error handling for invalid/corrupted images

2. **UI Enhancements:**
   - Loading states for card generation/loading
   - Preview functionality
   - Batch sharing options

### Technical Implementation Notes

#### LSB Steganography Details
- **Embedding:** Modify least significant bit of red channel pixels
- **Data Format:** JSON string of character data
- **Capacity:** Theoretical limit depends on image size (600x800 = 480,000 bits available)
- **Invisibility:** Changes are imperceptible to human eye

#### File Structure
```
/qr.js - Complete steganography system (replaces old QR code)
/index.html - Modal structure for card sharing/loading  
/style.css - Enhanced modal positioning
/character-manager.js - Character data management
/main.js - Core application logic
```

#### Modal System
- **Card Generation Modal:** `#card-modal` - Shows generated character card
- **Card Loading Modal:** `#card-scanner-modal` - File upload for loading cards
- **Functions:** `shareCharacterAsCard()`, `loadCharacterFromCard()`

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
- **Testing:** Browser-based testing with character creation

### Known Issues
- None currently - system appears stable

### Next Session Preparation
When resuming development:
1. Load this file for context
2. Focus on `extractDataFromImage()` function in `/qr.js`
3. Test with generated character cards
4. Implement error handling for corrupted files

### Contact Context
- **User:** Brad (uses multiple development machines)
- **Sync Method:** Git repository with development notes
- **AI Assistant:** GitHub Copilot (VS Code AI Chat)

---

*Last Updated: August 21, 2025*
*Next Focus: PNG steganography extraction implementation*
