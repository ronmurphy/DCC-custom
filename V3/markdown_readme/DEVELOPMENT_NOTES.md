up# DCC Custom - Development Notes

## Project Overview
Dungeon Crawler World character sheet application with beautiful visual character cards for sharing and offline reference.

**Live URL:** https://dcc-custom.vercel.app/

## Recent Major Development: Visual Character Card System

### Background
- **Original Issue:** QR code sharing system had "undefined" alert warnings
- **Solution Evolution:** 
  1. Initially replaced QR system with steganography-based character cards
  2. **DECISION CHANGE (Aug 22, 2025):** Abandoned steganography/QR scanning approach
  3. **Current Approach:** Simple JSON export/import + Beautiful visual character cards as "offline player sheets"
- **Rationale:** Save files are small enough that complex embedding isn't needed. Visual cards serve as beautiful references rather than data storage.

### Current Character Card System

#### Purpose Shift
- **From:** Data embedding and extraction system
- **To:** Beautiful visual "offline player sheets" for sharing and reference
- **Export/Import:** Standard JSON files with custom `.dcw` extension (Dungeon Crawler World)
- **Visual Cards:** Gorgeous themed character representations for social sharing and offline reference

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

### Layout & UX Optimization Session (August 22, 2025)

#### 🚀 Modal System Enhancements
- **Achievement Modal Improvements:**
  - Fixed text readability issues in both light and dark themes
  - Added proper modal content scrolling with max-height constraints
  - Implemented body scroll prevention when modals are open
  - Added click-outside-to-close functionality for better UX
- **Roll History Modal Enhancements:**
  - Added missing body scroll prevention
  - Implemented click-outside-to-close functionality
  - Fixed UI refresh issues for spell casting roll history
- **Spell Roll History Bug Fix:**
  - Fixed missing `updateRollHistoryDisplay()` call in spell casting
  - Spells now properly appear in roll history immediately after casting

#### 📐 Layout Optimizations
- **Overview Section Redesign:**
  - Restructured to efficient header/two-column/footer layout
  - Header: Player name, level, and golden pill-style level-up button
  - Two columns: Avatar (left) | HP/MP/Damage systems (right)
  - Footer: Heritage/Background/Class information
  - Always maintains two-column layout like rest buttons for consistency
- **Rest Buttons Optimization:**
  - Changed to always side-by-side layout on all screen sizes
  - Added time information: "4 hours • +Half HP/MP" and "8 hours • Full Recovery"
  - Removed mobile stacking to save vertical space
- **Attribute Header Space Saving:**
  - Moved "Tap any attribute to roll!" hint inline with "Attributes" header
  - Right-aligned hint text to free up a full line of vertical space
  - Hidden hint text on very small mobile screens to prevent crowding

#### 🎨 Visual Polish
- **Terminology Update:** Changed "Race" to "Heritage" throughout the application
- **Level Up Button:** Beautiful golden pill design with gradient and hover effects
- **Perfect Alignment:** Fixed HP/MP/Damage system alignment issues across all resolutions
- **Consistent Layout:** All vital systems now use unified flex layout for perfect alignment

#### 🔧 Technical Improvements
- **Responsive Design:** Optimized breakpoints for better tablet/desktop/mobile experiences
- **CSS Architecture:** Cleaner, more maintainable styling with consistent patterns
- **Mobile Optimization:** Better space utilization without sacrificing functionality
- **Cross-Resolution Support:** Perfect alignment and layout on high-DPI displays and large monitors

#### 🔧 Technical Infrastructure
- **QR Code Scanner:** New implementation with `qr-scanner.js` and fallback support
- **Test System:** Test characters and backup files in `/test_chars/` folder
- **File Organization:** Better structure for cross-platform development

### Steganography Implementation Details

#### Visual Card Technology
- **Method:** Canvas-based rendering of beautiful themed character cards
- **Purpose:** Visual sharing and offline player reference sheets
- **Export Format:** Standard JSON files with `.dcw` extension (Dungeon Crawler World)
- **File Location:** `/qr.js` (contains layout generation system, name kept for legacy reasons)

#### Key Functions in qr.js
1. **`generateCharacterCard()`** - Main entry point for card generation
2. **`determineCardStyle()`** - Selects theme based on character attributes
3. **`showLayoutSelectionModal()`** - Layout selection interface
4. **`generateSelectedLayout()`** - Generates specific card format
5. **Themed drawing functions:**
   - `drawMagicalCard()` - Purple/mystical theme
   - `drawWarriorCard()` - Red/brown warrior theme
   - `drawTechCard()` - Blue/cyan tech theme
   - `drawNatureCard()` - Green/brown nature theme
   - `drawClassicCard()` - Gold/cream default theme
6. **Layout drawing functions:**
   - `drawPortraitCard()` - Social media friendly format
   - `drawStatSheetCard()` - Compact statistics format
   - `drawFullSheetCard()` - Complete character sheet
   - `drawCombatCard()` - Combat reference format

#### Character Card Features
- **Portrait Integration:** Extracts character portrait from DOM element `#portrait-display`
- **Themed Styling:** 5 different visual themes based on character class/race/background
- **Multiple Layouts:** 4 card formats (Portrait, Stat Sheet, Full Sheet, Combat Card)
- **Decorative Elements:** Theme-specific borders, icons, and visual effects
- **Stat Display:** Formatted character attributes with visual enhancements
- **URL Branding:** Shows `dcc-custom.vercel.app` at bottom
- **Offline Reference:** Beautiful cards serve as offline player sheets for gaming sessions

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
- ~~LSB steganography data embedding~~ *(Abandoned - unnecessary complexity)*
- Portrait extraction and integration
- Modal positioning fixes in CSS
- URL updated to correct Vercel deployment
- 5 complete visual themes implemented
- **Layout Selection System:** 4 different card formats with visual previews
- **Enhanced Header UI:** Quick-access buttons for roll history and status effects
- **Roll History Modal:** Easy dice roll viewing with proper scrolling
- **Status Effects Modal:** Character condition management
- **Cordova Mobile App:** Android-ready integration (HUGE SUCCESS with testers!)
- ~~QR Code Scanner Implementation~~ *(Abandoned - files small enough for direct JSON)*
- **Test Character System:** Backup files and character management
- **Enhanced PWA Support:** Better iOS device compatibility
- **Simple JSON Export/Import:** `.dcw` extension for Dungeon Crawler World files
- **🆕 MODAL SYSTEM OVERHAUL:** Text readability, scrolling, click-outside-to-close for all modals
- **🆕 LAYOUT OPTIMIZATION:** Efficient overview design, rest button improvements, space-saving headers
- **🆕 PERFECT ALIGNMENT:** HP/MP/Damage systems aligned across all screen resolutions
- **🆕 GOLDEN LEVEL-UP BUTTON:** Beautiful pill-style design with hover effects
- **🆕 HERITAGE TERMINOLOGY:** Updated from "Race" to "Heritage" throughout app
- **🆕 SPELL ROLL HISTORY FIX:** Spells now properly appear in roll history immediately

#### 🔄 In Progress
- **CURRENT:** Final Android app build and testing with all optimizations
- **READY FOR:** GitHub push and Vercel deployment of optimized version

#### 📋 TODO (Simplified)
1. **Mobile App Finalization:**
   - Build optimized Android app with all layout improvements
   - Test on physical devices to verify all enhancements work perfectly
   - Address any final feedback from testers

2. **Deployment:**
   - Push optimized code to GitHub repository
   - Deploy to Vercel with all improvements
   - Verify web version performance

3. **Future Enhancements:**
   - Additional card layout options if requested by users
   - Enhanced visual themes based on user feedback
   - Print-friendly formats for physical tabletop gaming

### Technical Implementation Notes

#### Visual Card System Details
- **Rendering:** Canvas-based drawing with theme-specific styling
- **Output Format:** PNG images for sharing and offline reference
- **Save/Load:** Standard JSON files with `.dcw` extension (Dungeon Crawler World)
- **Simplicity:** Direct file export/import - no complex encoding needed
- **User Experience:** Visual cards serve as beautiful offline player sheets for gaming sessions

#### File Structure (Updated)
```
/qr.js - Visual card generation system (legacy filename, no longer QR-related)
/qr-scanner.js - *(Legacy file, may be removed)*
/jsqr-fallback.js - *(Legacy file, may be removed)*
/index.html - Enhanced modal system with layout selection
/style.css - Enhanced modal positioning and layout previews
/character-manager.js - Character data management
/main.js - Core application logic
/Cordova/DCWorld/ - Complete mobile app structure
/test_chars/ - Test characters and backups (.dcw files)
/markdown_readme/ - Development documentation
```

#### Save/Load System
- **Export Format:** JSON files with `.dcw` extension (Dungeon Crawler World)
- **Import:** Direct JSON loading - simple and reliable
- **File Size:** Small enough that complex encoding unnecessary
- **Visual Cards:** Generated as PNG images for offline reference, not data storage
- **Functions:** 
  - `exportCharacterToJSON()` - Creates `.dcw` files
  - `loadCharacterFromStorage()` - Loads `.dcw` files
  - `shareCharacterAsCard()` - Creates visual reference cards

### System Architecture Decision (August 22, 2025)

#### Why We Abandoned Steganography/QR Scanning
- **File Size Reality:** Character save files are small enough (typically < 50KB) that complex embedding is unnecessary
- **User Experience:** Direct `.dcw` file export/import is simpler and more reliable
- **Maintenance:** Steganography adds complexity without real benefit
- **Visual Cards Purpose:** Changed from data storage to beautiful offline reference sheets

#### Current Approach
- **Save/Load:** Simple JSON files with `.dcw` extension (Dungeon Crawler World format)
- **Visual Cards:** Beautiful themed PNG images for sharing and offline gaming reference
- **Simplicity:** No encoding/decoding complexity - just generate gorgeous visual representations

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
