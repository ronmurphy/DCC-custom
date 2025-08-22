// Debug DCC Button Integration
console.log('🔍 DCC Debug Script Loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM Content Loaded - Checking DCC Integration');
    
    // Check if improvements.js loaded
    if (typeof showDCCWeaponTemplates === 'function') {
        console.log('✅ DCC Weapon Templates function available');
    } else {
        console.log('❌ DCC Weapon Templates function NOT available');
    }
    
    if (typeof showDCCSpellTemplates === 'function') {
        console.log('✅ DCC Spell Templates function available');
    } else {
        console.log('❌ DCC Spell Templates function NOT available');
    }
    
    // Check if DCC data is available
    if (typeof dccWeapons !== 'undefined') {
        console.log('✅ DCC Weapons data available:', Object.keys(dccWeapons).length, 'weapons');
    } else {
        console.log('❌ DCC Weapons data NOT available');
    }
    
    if (typeof dccSpells !== 'undefined') {
        console.log('✅ DCC Spells data available:', Object.keys(dccSpells).length, 'spells');
    } else {
        console.log('❌ DCC Spells data NOT available');
    }
    
    // Check if tabs exist
    const inventoryTab = document.querySelector('#inventory');
    const magicTab = document.querySelector('#magic');
    
    if (inventoryTab) {
        console.log('✅ Inventory tab found');
        const addItemSection = inventoryTab.querySelector('.add-item-section');
        if (addItemSection) {
            console.log('✅ Add item section found in inventory');
        } else {
            console.log('❌ Add item section NOT found in inventory');
        }
    } else {
        console.log('❌ Inventory tab NOT found');
    }
    
    if (magicTab) {
        console.log('✅ Magic tab found');
        const spellCreator = magicTab.querySelector('.spell-creator-card');
        if (spellCreator) {
            console.log('✅ Spell creator found in magic tab');
        } else {
            console.log('❌ Spell creator NOT found in magic tab');
        }
    } else {
        console.log('❌ Magic tab NOT found');
    }
    
    // Test manual button addition
    setTimeout(() => {
        console.log('🔧 Attempting manual button addition...');
        if (typeof addDCCWeaponButton === 'function') {
            addDCCWeaponButton();
            console.log('🔧 Called addDCCWeaponButton()');
        }
        if (typeof addDCCSpellButton === 'function') {
            addDCCSpellButton();
            console.log('🔧 Called addDCCSpellButton()');
        }
        
        // Check if buttons were added
        const weaponButton = document.querySelector('.dcc-weapon-button');
        const spellButton = document.querySelector('.dcc-spell-button');
        
        if (weaponButton) {
            console.log('✅ DCC Weapon button successfully added');
        } else {
            console.log('❌ DCC Weapon button NOT added');
        }
        
        if (spellButton) {
            console.log('✅ DCC Spell button successfully added');
        } else {
            console.log('❌ DCC Spell button NOT added');
        }
    }, 2000);
});

// Test tab switching
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-btn')) {
        const tabName = e.target.dataset.tab;
        console.log('🔍 Tab clicked:', tabName);
        
        setTimeout(() => {
            if (tabName === 'inventory') {
                console.log('🔧 Inventory tab loaded, trying to add weapon button...');
                if (typeof addDCCWeaponButton === 'function') {
                    addDCCWeaponButton();
                }
            }
            if (tabName === 'magic') {
                console.log('🔧 Magic tab loaded, trying to add spell button...');
                if (typeof addDCCSpellButton === 'function') {
                    addDCCSpellButton();
                }
            }
        }, 100);
    }
});

console.log('🔍 DCC Debug Script Ready');
