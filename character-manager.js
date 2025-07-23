// ========================================
// CHARACTER MANAGER - Landing Screen & Storage
// ========================================

// Character Manager State
let characterManager = {
    characters: [],
    currentCharacterId: null,
    isLandingScreenActive: true
};

// ========================================
// LOCAL STORAGE FUNCTIONS
// ========================================
function saveCharactersToStorage() {
    try {
        localStorage.setItem('wasteland_characters', JSON.stringify(characterManager.characters));
        return true;
    } catch (error) {
        console.error('Failed to save characters:', error);
        return false;
    }
}

function loadCharactersFromStorage() {
    try {
        const stored = localStorage.getItem('wasteland_characters');
        if (stored) {
            characterManager.characters = JSON.parse(stored);
        }
        return true;
    } catch (error) {
        console.error('Failed to load characters:', error);
        characterManager.characters = [];
        return false;
    }
}

function saveCurrentCharacterToStorage() {
    if (!characterManager.currentCharacterId) return false;
    
    // Ensure notes are saved before storing (call silent version directly)
    saveNotesToCharacterSilent();
    
    // Update the character in storage
    const characterIndex = characterManager.characters.findIndex(
        char => char.id === characterManager.currentCharacterId
    );
    
    if (characterIndex !== -1) {
        // Character exists, update it
        characterManager.characters[characterIndex] = {
            ...character,
            id: characterManager.currentCharacterId,
            lastModified: new Date().toISOString()
        };
    } else {
        // Character doesn't exist yet, add it (new character case)
        const newChar = {
            ...character,
            id: characterManager.currentCharacterId,
            lastModified: new Date().toISOString()
        };
        characterManager.characters.push(newChar);
    }
    
    return saveCharactersToStorage();
}

// ========================================
// CHARACTER CARD CREATION
// ========================================
function createCharacterCard(charData) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.onclick = () => loadCharacterFromManager(charData.id);
    
    // Get character info
    const jobName = charData.job ? (jobs[charData.job]?.name || charData.job) : charData.customJob || 'Unknown';
    const className = charData.class ? (classes[charData.class]?.name || charData.class) : charData.customClass || 'Unknown';
    const lastModified = charData.lastModified ? new Date(charData.lastModified).toLocaleDateString() : 'Unknown';
    
    // Portrait handling
    let portraitContent = '';
    if (charData.personal?.portrait) {
        portraitContent = `<img src="${charData.personal.portrait}" alt="${charData.name || 'Character'}" class="character-portrait">`;
    } else {
        portraitContent = `<div class="character-portrait-placeholder"><i class="ra ra-player"></i></div>`;
    }
    
    card.innerHTML = `
        <div class="character-card-portrait">
            ${portraitContent}
            <div class="character-level">Lv.${charData.level || 1}</div>
        </div>
        <div class="character-card-info">
            <h3 class="character-name">${charData.name || 'Unnamed Character'}</h3>
            <div class="character-details">
                <div class="character-background">${jobName}</div>
                <div class="character-class">${className}</div>
            </div>
            <div class="character-stats">
                <span class="stat-item">HP: ${charData.currentHealthPoints || 0}/${charData.healthPoints || 0}</span>
                <span class="stat-item">MP: ${charData.currentMagicPoints || 0}/${charData.magicPoints || 0}</span>
            </div>
            <div class="character-last-modified">Last played: ${lastModified}</div>
        </div>
        <div class="character-card-actions">
            <button class="card-action-btn delete-btn" onclick="event.stopPropagation(); deleteCharacterConfirm('${charData.id}')" title="Delete Character">
                <span class="material-icons">delete</span>
            </button>
            <button class="card-action-btn export-btn" onclick="event.stopPropagation(); exportCharacterFromManager('${charData.id}')" title="Export Character">
                <span class="material-icons">download</span>
            </button>
        </div>
    `;
    
    return card;
}

// ========================================
// LANDING SCREEN MANAGEMENT
// ========================================
function showLandingScreen() {
    characterManager.isLandingScreenActive = true;
    
    // Hide main character sheet
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    // Show or create landing screen
    let landingScreen = document.getElementById('character-landing');
    if (!landingScreen) {
        landingScreen = createLandingScreen();
        document.body.appendChild(landingScreen);
    } else {
        landingScreen.style.display = 'block';
    }
    
    renderCharacterGrid();
}

function hideLandingScreen() {
    characterManager.isLandingScreenActive = false;
    
    // Hide landing screen
    const landingScreen = document.getElementById('character-landing');
    if (landingScreen) {
        landingScreen.style.display = 'none';
    }
    
    // Show main character sheet
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
}

function createLandingScreen() {
    const landingScreen = document.createElement('div');
    landingScreen.id = 'character-landing';
    landingScreen.className = 'character-landing';
    
    landingScreen.innerHTML = `
        <div class="landing-header">
            <h1><i class="ra ra-knight-helmet"></i> Wasteland Chronicles</h1>
            <p>Choose your survivor or create a new character</p>
        </div>
        
        <div class="landing-actions">
            <button class="landing-btn primary-btn" onclick="createNewCharacter()">
                <span class="material-icons">person_add</span>
                New Character
            </button>
            <button class="landing-btn secondary-btn" onclick="importCharacterToManager()">
                <span class="material-icons">upload</span>
                Import Character
            </button>
            <button class="landing-btn secondary-btn" onclick="exportAllCharacters()">
                <span class="material-icons">download</span>
                Export All
            </button>
        </div>
        
        <div class="characters-grid" id="characters-grid">
            <!-- Character cards will be populated here -->
        </div>
        
        <div class="landing-footer">
            <p>Characters are saved locally in your browser. Use Export to backup your characters.</p>
        </div>
    `;
    
    return landingScreen;
}

function renderCharacterGrid() {
    const grid = document.getElementById('characters-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (characterManager.characters.length === 0) {
        grid.innerHTML = `
            <div class="no-characters">
                <i class="ra ra-player" style="font-size: 4em; color: #4a4a6a; margin-bottom: 20px;"></i>
                <h3>No Characters Yet</h3>
                <p>Create your first wasteland survivor to begin your journey!</p>
            </div>
        `;
        return;
    }
    
    // Sort characters by last modified (most recent first)
    const sortedCharacters = [...characterManager.characters].sort((a, b) => {
        const dateA = new Date(a.lastModified || 0);
        const dateB = new Date(b.lastModified || 0);
        return dateB - dateA;
    });
    
    sortedCharacters.forEach(charData => {
        const card = createCharacterCard(charData);
        grid.appendChild(card);
    });
}

// ========================================
// CHARACTER OPERATIONS
// ========================================
function createNewCharacter() {
    // Generate new character ID
    const newCharacterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    characterManager.currentCharacterId = newCharacterId;
    
    // Reset character object to defaults (this should be the global character object from main.js)
    if (typeof character !== 'undefined') {
        Object.assign(character, {
            name: '',
            level: 1,
            availablePoints: 3,
            stats: {
                strength: 2, dexterity: 2, constitution: 2,
                intelligence: 2, wisdom: 2, charisma: 2
            },
            healthPoints: 3,
            currentHealthPoints: 3,
            magicPoints: 4,
            currentMagicPoints: 4,
            customSkills: [],
            personal: { age: '', backstory: '', portrait: null },
            job: '', customJob: '', class: '', customClass: '',
            jobBonuses: [], classBonuses: [],
            customJobData: { selectedStats: [], skills: [] },
            customClassData: { selectedStats: [], skills: [] },
            rollHistory: [], spells: [], inventory: [],
            equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
            statusEffects: [],
            notes: { personal: '', party: '', session: '', barter: '', world: '', combat: '' }
        });
        
        // Re-render character sheet components
        if (typeof renderStats === 'function') renderStats();
        if (typeof updateHealthMagicDisplay === 'function') updateHealthMagicDisplay();
        if (typeof renderCharacterSkills === 'function') renderCharacterSkills();
    }
    
    hideLandingScreen();
    
    // Auto-save periodically
    startAutoSave();
}

function loadCharacterFromManager(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) {
        alert('Character not found!');
        return;
    }
    
    characterManager.currentCharacterId = characterId;
    
    // Load character data into global character object
    if (typeof character !== 'undefined') {
        Object.assign(character, charData);
        
        // Update UI elements
        const elements = {
            'char-name': character.name || '',
            'char-level': character.level || 1,
            'char-age': character.personal?.age || '',
            'char-backstory': character.personal?.backstory || ''
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Handle portrait
        if (character.personal?.portrait) {
            const portraitDisplay = document.getElementById('portrait-display');
            if (portraitDisplay) {
                portraitDisplay.innerHTML = `<img src="${character.personal.portrait}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            }
        }
        
        // Handle job and class selections
        updateCharacterSelections();
        
        // Re-render all components
        refreshCharacterSheet();
    }
    
    hideLandingScreen();
    startAutoSave();
}

function updateCharacterSelections() {
    // Handle job selection
    if (character.job) {
        const jobSelect = document.getElementById('job-select');
        if (jobSelect) jobSelect.value = character.job;
    } else if (character.customJob) {
        const jobSelect = document.getElementById('job-select');
        const customJobInput = document.getElementById('custom-job');
        if (jobSelect) jobSelect.value = 'custom';
        if (customJobInput) {
            customJobInput.style.display = 'block';
            customJobInput.value = character.customJob;
        }
    }
    
    // Handle class selection
    if (character.class) {
        const classSelect = document.getElementById('class-select');
        if (classSelect) classSelect.value = character.class;
    } else if (character.customClass) {
        const classSelect = document.getElementById('class-select');
        const customClassInput = document.getElementById('custom-class');
        if (classSelect) classSelect.value = 'custom_class';
        if (customClassInput) {
            customClassInput.style.display = 'block';
            customClassInput.value = character.customClass;
        }
    }
}

function refreshCharacterSheet() {
    // Call all the render functions to update the UI
    const renderFunctions = [
        'renderStats', 'renderCharacterSkills', 'renderCharacterSpells', 
        'renderCharacterWeapons', 'renderInventory', 'renderEquipment',
        'updateHealthMagicDisplay', 'updateCharacterDisplay', 'updateBonusesDisplay',
        'renderSpells', 'updateMagicTabDisplay', 'renderStatusEffects'
    ];
    
    renderFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            try {
                window[funcName]();
            } catch (error) {
                console.warn(`Error calling ${funcName}:`, error);
            }
        }
    });
}

function deleteCharacterConfirm(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) return;
    
    if (confirm(`Are you sure you want to delete "${charData.name || 'Unnamed Character'}"?\n\nThis action cannot be undone.`)) {
        deleteCharacter(characterId);
    }
}

function deleteCharacter(characterId) {
    characterManager.characters = characterManager.characters.filter(char => char.id !== characterId);
    saveCharactersToStorage();
    renderCharacterGrid();
    
    // If we deleted the currently loaded character, go back to landing
    if (characterManager.currentCharacterId === characterId) {
        characterManager.currentCharacterId = null;
        showLandingScreen();
    }
}

// ========================================
// IMPORT/EXPORT FUNCTIONS
// ========================================
function exportCharacterFromManager(characterId) {
    const charData = characterManager.characters.find(char => char.id === characterId);
    if (!charData) {
        alert('Character not found!');
        return;
    }
    
    // Create a clean copy without the manager ID
    const exportData = { ...charData };
    delete exportData.id;
    delete exportData.lastModified;
    
    const characterData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([characterData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charData.name || 'character'}_wasteland.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportAllCharacters() {
    if (characterManager.characters.length === 0) {
        alert('No characters to export!');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        characterCount: characterManager.characters.length,
        characters: characterManager.characters.map(char => {
            const cleanChar = { ...char };
            delete cleanChar.id;
            delete cleanChar.lastModified;
            return cleanChar;
        })
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasteland_characters_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importCharacterToManager() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Check if it's a single character or multiple characters export
                    if (data.characters && Array.isArray(data.characters)) {
                        // Multiple characters export
                        let importedCount = 0;
                        data.characters.forEach(charData => {
                            if (addCharacterToManager(charData)) {
                                importedCount++;
                            }
                        });
                        alert(`Successfully imported ${importedCount} character(s)!`);
                    } else {
                        // Single character export
                        if (addCharacterToManager(data)) {
                            alert('Character imported successfully!');
                        } else {
                            alert('Failed to import character!');
                        }
                    }
                    
                    renderCharacterGrid();
                } catch (error) {
                    alert('Error importing character file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function addCharacterToManager(charData) {
    try {
        // Ensure all required properties exist
        const newChar = {
            ...charData,
            id: 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            lastModified: new Date().toISOString()
        };
        
        // Add backward compatibility properties
        if (!newChar.personal) newChar.personal = { age: '', backstory: '', portrait: null };
        if (!newChar.notes) newChar.notes = { personal: '', party: '', session: '', barter: '', world: '', combat: '' };
        if (!newChar.statusEffects) newChar.statusEffects = [];
        if (!newChar.customSkills) newChar.customSkills = [];
        
        characterManager.characters.push(newChar);
        saveCharactersToStorage();
        return true;
    } catch (error) {
        console.error('Error adding character:', error);
        return false;
    }
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================
let autoSaveInterval = null;

function startAutoSave() {
    // Clear existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Auto-save every 30 seconds if a character is loaded
    autoSaveInterval = setInterval(() => {
        if (characterManager.currentCharacterId && !characterManager.isLandingScreenActive) {
            saveCurrentCharacterToStorage();
        }
    }, 30000);
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// ========================================
// PAGE LIFECYCLE MANAGEMENT
// ========================================
function initializeCharacterManager() {
    // Load characters from storage
    loadCharactersFromStorage();
    
    // Show landing screen on startup
    showLandingScreen();
    
    // Set up auto-save for notes (override the main.js version)
    setTimeout(() => {
        if (typeof autoSaveNotes === 'function') {
            autoSaveNotes();
        }
    }, 500);
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
        if (characterManager.currentCharacterId) {
            saveCurrentCharacterToStorage();
        }
    });
    
    // Handle visibility change (mobile apps switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && characterManager.currentCharacterId) {
            saveCurrentCharacterToStorage();
        }
    });
}

// Add back to landing screen function for main character sheet
function backToCharacterSelect() {
    if (characterManager.currentCharacterId) {
        saveCurrentCharacterToStorage();
    }
    stopAutoSave();
    showLandingScreen();
}

// ========================================
// INTEGRATION WITH MAIN CHARACTER SHEET
// ========================================

// Silent notes save function
function saveNotesToCharacterSilent() {
    if (typeof character !== 'undefined' && character.notes) {
        character.notes.personal = document.getElementById('personal-notes')?.value || '';
        character.notes.party = document.getElementById('party-notes')?.value || '';
        character.notes.session = document.getElementById('session-notes')?.value || '';
        character.notes.barter = document.getElementById('barter-notes')?.value || '';
        character.notes.world = document.getElementById('world-notes')?.value || '';
        character.notes.combat = document.getElementById('combat-notes')?.value || '';
        
        // Don't auto-save to storage here - let the caller handle that
    }
}

// Main save function - saves current character to browser storage
function saveCharacterToStorage() {
    if (!characterManager.currentCharacterId) {
        // If no current character, create new one
        createNewCharacterInStorage();
        return;
    }
    
    // Save notes silently first
    saveNotesToCharacterSilent();
    
    // Get current form data
    if (typeof character !== 'undefined') {
        character.name = document.getElementById('char-name')?.value || '';
        character.level = parseInt(document.getElementById('char-level')?.value) || 1;
        character.personal.age = document.getElementById('char-age')?.value || '';
        character.personal.backstory = document.getElementById('char-backstory')?.value || '';
        
        // Save to storage using the existing function
        if (saveCurrentCharacterToStorage()) {
            if (typeof showNotification === 'function') {
                showNotification('save', 'Character Saved', 
                    'Character saved to browser storage!', 
                    'Your character is automatically backed up locally.');
            } else {
                alert('Character saved successfully!');
            }
        } else {
            alert('Failed to save character!');
        }
    }
}

// Create new character in storage
function createNewCharacterInStorage() {
    // Generate new character ID
    const newCharacterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    characterManager.currentCharacterId = newCharacterId;
    
    // Get current character data
    if (typeof character !== 'undefined') {
        character.name = document.getElementById('char-name')?.value || '';
        character.level = parseInt(document.getElementById('char-level')?.value) || 1;
        character.personal.age = document.getElementById('char-age')?.value || '';
        character.personal.backstory = document.getElementById('char-backstory')?.value || '';
        
        // Save notes
        saveNotesToCharacterSilent();
        
        // Add to storage
        const newChar = {
            ...character,
            id: newCharacterId,
            lastModified: new Date().toISOString()
        };
        
        characterManager.characters.push(newChar);
        if (saveCharactersToStorage()) {
            if (typeof showNotification === 'function') {
                showNotification('save', 'Character Created', 
                    'New character saved to browser storage!', 
                    'You can now access this character from the Character Select screen.');
            } else {
                alert('Character created and saved successfully!');
            }
            startAutoSave();
        } else {
            alert('Failed to save character!');
        }
    }
}

// Load character from storage (shows modal)
function loadCharacterFromStorage() {
    if (characterManager.characters.length === 0) {
        alert('No saved characters found! Create a character first or import from JSON.');
        return;
    }
    
    // Show character selection modal
    showCharacterSelectionModal();
}

// Export character to JSON file
function exportCharacterToJSON() {
    // Save current form data first
    if (typeof character !== 'undefined') {
        character.name = document.getElementById('char-name')?.value || '';
        character.level = parseInt(document.getElementById('char-level')?.value) || 1;
        character.personal.age = document.getElementById('char-age')?.value || '';
        character.personal.backstory = document.getElementById('char-backstory')?.value || '';
        
        // Save notes
        saveNotesToCharacterSilent();
        
        // Create clean export data
        const exportData = { ...character };
        delete exportData.id;
        delete exportData.lastModified;
        
        const characterData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([characterData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name || 'character'}_wasteland.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function showCharacterSelectionModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'character-modal-overlay';
    modal.onclick = (e) => {
        if (e.target === modal) closeCharacterModal();
    };
    
    const modalContent = document.createElement('div');
    modalContent.className = 'character-modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Load Character</h3>
            <button class="modal-close" onclick="closeCharacterModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="modal-characters-grid" id="modal-characters-grid">
                ${characterManager.characters.map(char => `
                    <div class="modal-character-card" onclick="loadCharacterFromModal('${char.id}')">
                        <div class="modal-char-portrait">
                            ${char.personal?.portrait ? 
                                `<img src="${char.personal.portrait}" alt="${char.name}" class="modal-portrait-img">` :
                                `<div class="modal-portrait-placeholder"><i class="ra ra-player"></i></div>`
                            }
                            <div class="modal-char-level">Lv.${char.level || 1}</div>
                        </div>
                        <div class="modal-char-info">
                            <div class="modal-char-name">${char.name || 'Unnamed'}</div>
                            <div class="modal-char-details">
                                ${char.job ? (jobs[char.job]?.name || char.job) : char.customJob || 'Unknown'} • 
                                ${char.class ? (classes[char.class]?.name || char.class) : char.customClass || 'Unknown'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeCharacterModal()">Cancel</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .character-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .character-modal-content {
                background: rgba(60, 60, 80, 0.95);
                border-radius: 12px;
                border: 2px solid #4a4a6a;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                color: #e0e0e0;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #4a4a6a;
            }
            .modal-header h3 {
                color: #f4d03f;
                margin: 0;
            }
            .modal-close {
                background: none;
                border: none;
                color: #8a8a8a;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            .modal-close:hover {
                color: #ff6b6b;
            }
            .modal-body {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .modal-characters-grid {
                display: grid;
                gap: 12px;
            }
            .modal-character-card {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px;
                background: rgba(40, 40, 60, 0.8);
                border: 1px solid #4a4a6a;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .modal-character-card:hover {
                border-color: #f4d03f;
                background: rgba(244, 208, 63, 0.1);
            }
            .modal-char-portrait {
                position: relative;
                flex-shrink: 0;
            }
            .modal-portrait-img {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #f4d03f;
            }
            .modal-portrait-placeholder {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(40, 40, 60, 0.8);
                border: 1px dashed #4a4a6a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #4a4a6a;
                font-size: 1.5em;
            }
            .modal-char-level {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f4d03f;
                color: #2a2a4a;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 8px;
                min-width: 20px;
                text-align: center;
            }
            .modal-char-info {
                flex: 1;
            }
            .modal-char-name {
                color: #f4d03f;
                font-weight: 600;
                margin-bottom: 4px;
            }
            .modal-char-details {
                color: #8a8a8a;
                font-size: 0.9em;
            }
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #4a4a6a;
                text-align: right;
            }
        `;
        document.head.appendChild(styles);
    }
}

function loadCharacterFromModal(characterId) {
    closeCharacterModal();
    loadCharacterFromManager(characterId);
}

function closeCharacterModal() {
    const modal = document.querySelector('.character-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Auto-save functionality for notes
function autoSaveNotes() {
    // Auto-save notes when user types (silently)
    const noteFields = ['personal-notes', 'party-notes', 'session-notes', 'barter-notes', 'world-notes', 'combat-notes'];
    
    noteFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', debounce(() => {
                saveNotesToCharacterSilent(); // Silent auto-save
            }, 5000)); // Increased to 5 seconds
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make sure functions are globally available (moved to end after all functions are defined)
window.saveCharacterToStorage = saveCharacterToStorage;
window.loadCharacterFromStorage = loadCharacterFromStorage;
window.exportCharacterToJSON = exportCharacterToJSON;
window.saveNotesToCharacterSilent = saveNotesToCharacterSilent;
window.createNewCharacterInStorage = createNewCharacterInStorage;
window.backToCharacterSelect = backToCharacterSelect;
window.showCharacterSelectionModal = showCharacterSelectionModal;
window.loadCharacterFromModal = loadCharacterFromModal;
window.closeCharacterModal = closeCharacterModal;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for main.js to load first
    setTimeout(initializeCharacterManager, 100);
});