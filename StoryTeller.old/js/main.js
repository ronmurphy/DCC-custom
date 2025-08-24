// ========================================
// STORY TELLER TOOL - MAIN JAVASCRIPT
// Core functionality and shared utilities
// ========================================

// ========================================
// GLOBAL STATE
// ========================================
let currentSession = {
    name: 'New Session',
    npcs: [],
    quests: [],
    items: [],
    maps: [],
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load saved theme
    loadTheme();
    
    // Initialize tab navigation
    initializeTabNavigation();
    
    // Load last session or create new one
    loadLastSession();
    
    // Initialize file input for import
    initializeImportHandler();
    
    // Initialize Supabase for real-time chat (if configured and not already initialized)
    setTimeout(() => {
        if (typeof initializeSupabase === 'function' && !window.supabaseInitialized) {
            const result = initializeSupabase();
            if (result) {
                window.supabaseInitialized = true;
            }
        }
    }, 1000); // Delay to ensure all modules are loaded
    
    console.log('Story Teller Tool initialized');
}

// ========================================
// TAB NAVIGATION
// ========================================
function initializeTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
            
            // Update active states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Call tab-specific initialization if needed
        switch(tabName) {
            case 'npc':
                if (typeof refreshNPCDisplay === 'function') {
                    refreshNPCDisplay();
                }
                break;
            case 'quest':
                if (typeof refreshQuestDisplay === 'function') {
                    refreshQuestDisplay();
                }
                break;
            case 'items':
                if (typeof refreshItemsDisplay === 'function') {
                    refreshItemsDisplay();
                }
                break;
            case 'map':
                if (typeof refreshMapDisplay === 'function') {
                    refreshMapDisplay();
                }
                break;
        }
    }
}

// ========================================
// THEME MANAGEMENT
// ========================================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('st-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        // Default is dark theme
        document.body.classList.add('dark-theme');
        localStorage.setItem('st-theme', 'dark');
    }
}

// ========================================
// SESSION MANAGEMENT
// ========================================
function showSessionManager() {
    document.getElementById('session-modal').style.display = 'flex';
    document.getElementById('session-name-input').value = currentSession.name;
    loadSessionsList();
}

function hideSessionManager() {
    document.getElementById('session-modal').style.display = 'none';
}

function createNewSession() {
    const nameInput = document.getElementById('session-name-input');
    const sessionName = nameInput.value.trim() || 'New Session';
    
    // Save current session if it has content
    if (hasSessionContent()) {
        saveSession();
    }
    
    // Create new session
    currentSession = {
        name: sessionName,
        npcs: [],
        quests: [],
        items: [],
        maps: [],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    updateSessionDisplay();
    refreshAllDisplays();
    hideSessionManager();
    
    showNotification('success', 'New Session Created', 
        `Created session: ${sessionName}`, 
        'Start building your campaign!');
}

function saveSession() {
    currentSession.lastModified = new Date().toISOString();
    
    try {
        const sessionKey = `st-session-${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
        localStorage.setItem('st-current-session', sessionKey);
        
        showNotification('success', 'Session Saved', 
            `Saved: ${currentSession.name}`, 
           'Your campaign data is safe!');
        
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('error', 'Save Failed', 
            'Could not save session', 
            'Check your browser storage settings');
        
        return false;
    }
}

function saveSessionSilent() {
    currentSession.lastModified = new Date().toISOString();
    
    try {
        const sessionKey = `st-session-${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
        localStorage.setItem('st-current-session', sessionKey);
        
  //      showNotification('success', 'Session Saved', 
   //         `Saved: ${currentSession.name}`, 
 //           'Your campaign data is safe!');
        
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('error', 'Save Failed', 
            'Could not save session', 
            'Check your browser storage settings');
        
        return false;
    }
}

function loadSession(sessionName) {
    try {
        const sessionKey = `st-session-${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const savedSession = localStorage.getItem(sessionKey);
        
        if (savedSession) {
            currentSession = JSON.parse(savedSession);
            updateSessionDisplay();
            refreshAllDisplays();
            hideSessionManager();
            
            showNotification('success', 'Session Loaded', 
                `Loaded: ${currentSession.name}`, 
                'Welcome back to your campaign!');
            
            return true;
        }
    } catch (error) {
        console.error('Error loading session:', error);
        showNotification('error', 'Load Failed', 
            'Could not load session', 
            'The session file may be corrupted');
    }
    
    return false;
}

function loadLastSession() {
    const lastSession = localStorage.getItem('st-current-session');
    if (lastSession) {
        const sessionData = localStorage.getItem(lastSession);
        if (sessionData) {
            try {
                currentSession = JSON.parse(sessionData);
                updateSessionDisplay();
                refreshAllDisplays();
                return;
            } catch (error) {
                console.error('Error loading last session:', error);
            }
        }
    }
    
    // If no last session or error, start with default
    updateSessionDisplay();
}

function exportSession() {
    const exportData = {
        ...currentSession,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.name.replace(/[^a-zA-Z0-9]/g, '_')}_session.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Session Exported', 
        `Exported: ${currentSession.name}`, 
        'File downloaded to your device');
}

function importSession() {
    document.getElementById('import-file').click();
}

function initializeImportHandler() {
    document.getElementById('import-file').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (importedData.name && Array.isArray(importedData.npcs)) {
                        currentSession = {
                            name: importedData.name,
                            npcs: importedData.npcs || [],
                            quests: importedData.quests || [],
                            items: importedData.items || [],
                            maps: importedData.maps || [],
                            created: importedData.created || new Date().toISOString(),
                            lastModified: new Date().toISOString()
                        };
                        
                        updateSessionDisplay();
                        refreshAllDisplays();
                        hideSessionManager();
                        
                        showNotification('success', 'Session Imported', 
                            `Imported: ${currentSession.name}`, 
                            'Campaign data loaded successfully!');
                    } else {
                        throw new Error('Invalid session format');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification('error', 'Import Failed', 
                        'Invalid session file', 
                        'Please check the file format');
                }
            };
            reader.readAsText(file);
        }
        
        // Reset file input
        event.target.value = '';
    });
}

function loadSessionsList() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';
    
    // Get all saved sessions
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('st-session-')) {
            try {
                const sessionData = JSON.parse(localStorage.getItem(key));
                sessions.push(sessionData);
            } catch (error) {
                console.error('Error parsing session:', key, error);
            }
        }
    }
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No saved sessions found</p>';
        return;
    }
    
    // Sort by last modified
    sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    sessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        sessionItem.innerHTML = `
            <div onclick="loadSession('${session.name}')">
                <div style="font-weight: 600; color: var(--text-primary);">${session.name}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    Modified: ${new Date(session.lastModified).toLocaleDateString()}
                    | NPCs: ${session.npcs?.length || 0}
                    | Quests: ${session.quests?.length || 0}
                </div>
            </div>
            <button onclick="deleteSession('${session.name}')" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                Delete
            </button>
        `;
        
        sessionItem.onmouseenter = () => {
            sessionItem.style.borderColor = 'var(--primary)';
            sessionItem.style.background = 'var(--bg-tertiary)';
        };
        
        sessionItem.onmouseleave = () => {
            sessionItem.style.borderColor = 'var(--border-color)';
            sessionItem.style.background = 'var(--bg-secondary)';
        };
        
        sessionsList.appendChild(sessionItem);
    });
}

function deleteSession(sessionName) {
    if (confirm(`Are you sure you want to delete the session "${sessionName}"?\n\nThis action cannot be undone.`)) {
        const sessionKey = `st-session-${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.removeItem(sessionKey);
        
        // If this was the current session, start a new one
        if (currentSession.name === sessionName) {
            currentSession = {
                name: 'New Session',
                npcs: [],
                quests: [],
                items: [],
                maps: [],
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            updateSessionDisplay();
            refreshAllDisplays();
        }
        
        loadSessionsList();
        showNotification('success', 'Session Deleted', 
            `Deleted: ${sessionName}`, 
            'Session removed from storage');
    }
}

function updateSessionDisplay() {
    document.getElementById('session-name-display').textContent = currentSession.name;
}

function hasSessionContent() {
    return currentSession.npcs.length > 0 || 
           currentSession.quests.length > 0 || 
           (currentSession.items && currentSession.items.length > 0) || 
           currentSession.maps.length > 0;
}

function refreshAllDisplays() {
    // Call refresh functions for all tabs
    if (typeof refreshNPCDisplay === 'function') {
        refreshNPCDisplay();
    }
    if (typeof refreshQuestDisplay === 'function') {
        refreshQuestDisplay();
    }
    if (typeof refreshItemsDisplay === 'function') {
        refreshItemsDisplay();
    }
    if (typeof refreshMapDisplay === 'function') {
        refreshMapDisplay();
    }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(type, title, result, details) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };
    
    notification.innerHTML = `
        <h4><i class="material-icons">${icons[type] || 'info'}</i> ${title}</h4>
        <div class="result">${result}</div>
        <div class="details">${details}</div>
    `;

    container.appendChild(notification);

    // Force reflow to ensure animation plays
    notification.offsetHeight;

    setTimeout(() => notification.classList.add('show'), 10);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollMultipleDice(count, sides) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(rollDice(sides));
    }
    return rolls;
}

// Copy to clipboard utility
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            console.error('Copy failed:', error);
        } finally {
            textArea.remove();
        }
        return Promise.resolve();
    }
}

// ========================================
// GLOBAL EXPORTS
// ========================================
// Make functions globally available
window.toggleTheme = toggleTheme;
window.showSessionManager = showSessionManager;
window.hideSessionManager = hideSessionManager;
window.createNewSession = createNewSession;
window.saveSession = saveSession;
window.loadSession = loadSession;
window.exportSession = exportSession;
window.importSession = importSession;
window.deleteSession = deleteSession;
window.switchTab = switchTab;
window.showNotification = showNotification;
window.generateId = generateId;
window.capitalizeFirst = capitalizeFirst;
window.getRandomElement = getRandomElement;
window.rollDice = rollDice;
window.rollMultipleDice = rollMultipleDice;
window.copyToClipboard = copyToClipboard;

// Auto-save every 30 seconds if there's content
setInterval(() => {
    if (hasSessionContent()) {
        saveSessionSilent();
    }
}, 30000);
