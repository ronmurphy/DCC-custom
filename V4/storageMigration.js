/**
 * Storage Migration Helper
 * Migrates existing localStorage data to the new AdvancedStorageManager
 */

class StorageMigration {
    constructor() {
        this.migrationKey = 'dcc-storage-migration-v1';
        this.largeDataKeys = [
            'storyteller_notes',
            'storyteller_saved_npcs', 
            'storyteller_roll_history',
            'storyteller_saved_rolls'
        ];
    }

    async runMigration() {
        // Check if migration already completed
        if (localStorage.getItem(this.migrationKey)) {
            console.log('✅ Storage migration already completed');
            return;
        }

        console.log('🔄 Starting storage migration...');

        try {
            await this.migrateToAdvancedStorage();
            localStorage.setItem(this.migrationKey, JSON.stringify({
                completed: true,
                timestamp: Date.now(),
                version: 1
            }));
            console.log('✅ Storage migration completed successfully');
        } catch (error) {
            console.error('❌ Storage migration failed:', error);
        }
    }

    async migrateToAdvancedStorage() {
        if (!window.advancedStorageManager) {
            console.warn('⚠️ AdvancedStorageManager not available, skipping migration');
            return;
        }

        let migratedCount = 0;
        let errorCount = 0;

        // Get storage usage before migration
        const beforeUsage = window.advancedStorageManager.getLocalStorageUsage();
        console.log(`📊 Before migration: ${beforeUsage.usedMB}MB used (${beforeUsage.percentage}%)`);

        // Migrate large data items first
        for (const key of this.largeDataKeys) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    const parsed = JSON.parse(value);
                    await window.advancedStorageManager.setItem(key, parsed, { forceMethod: 'indexeddb' });
                    
                    // Remove from localStorage after successful migration
                    localStorage.removeItem(key);
                    migratedCount++;
                    console.log(`📦 Migrated ${key} to IndexedDB`);
                }
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
                errorCount++;
            }
        }

        // Check for other large items in localStorage
        const otherLargeKeys = [];
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && 
                !this.largeDataKeys.includes(key) && 
                localStorage[key].length > 10000) { // >10KB
                otherLargeKeys.push(key);
            }
        }

        // Migrate other large items
        for (const key of otherLargeKeys) {
            try {
                const value = JSON.parse(localStorage.getItem(key));
                await window.advancedStorageManager.setItem(key, value, { forceMethod: 'indexeddb' });
                localStorage.removeItem(key);
                migratedCount++;
                console.log(`📦 Migrated large item ${key} to IndexedDB`);
            } catch (error) {
                console.error(`❌ Failed to migrate ${key}:`, error);
                errorCount++;
            }
        }

        // Get storage usage after migration
        const afterUsage = window.advancedStorageManager.getLocalStorageUsage();
        const savedMB = (beforeUsage.used - afterUsage.used) / (1024 * 1024);
        
        console.log(`📊 After migration: ${afterUsage.usedMB}MB used (${afterUsage.percentage}%)`);
        console.log(`💾 Freed up ${savedMB.toFixed(2)}MB in localStorage`);
        console.log(`✅ Migration summary: ${migratedCount} items migrated, ${errorCount} errors`);

        // Show user notification
        if (window.addChatMessage && migratedCount > 0) {
            window.addChatMessage(`📦 Migrated ${migratedCount} large data items to improve storage efficiency`, 'system');
        }
    }

    // Manual cleanup for emergency situations
    async emergencyCleanup() {
        console.log('🚨 Running emergency cleanup...');
        
        // Remove oldest roll history entries
        try {
            const rollHistory = JSON.parse(localStorage.getItem('storyteller_roll_history') || '[]');
            if (rollHistory.length > 100) {
                const trimmed = rollHistory.slice(-50); // Keep only last 50
                localStorage.setItem('storyteller_roll_history', JSON.stringify(trimmed));
                console.log(`🧹 Trimmed roll history from ${rollHistory.length} to ${trimmed.length} entries`);
            }
        } catch (error) {
            console.error('❌ Failed to trim roll history:', error);
        }

        // Compress notes if very large
        try {
            const notes = localStorage.getItem('storyteller_notes');
            if (notes && notes.length > 500000) { // >500KB
                const parsed = JSON.parse(notes);
                if (window.advancedStorageManager) {
                    await window.advancedStorageManager.setItem('storyteller_notes', parsed, { forceMethod: 'indexeddb' });
                    localStorage.removeItem('storyteller_notes');
                    console.log('📦 Moved large notes to IndexedDB');
                }
            }
        } catch (error) {
            console.error('❌ Failed to move notes:', error);
        }

        // Show updated usage
        if (window.advancedStorageManager) {
            window.advancedStorageManager.monitorStorageUsage();
        }
    }

    // Get migration status
    getMigrationStatus() {
        const migrationData = localStorage.getItem(this.migrationKey);
        if (!migrationData) {
            return { completed: false };
        }

        try {
            return JSON.parse(migrationData);
        } catch (error) {
            return { completed: false, error: error.message };
        }
    }

    // Reset migration (for testing)
    resetMigration() {
        localStorage.removeItem(this.migrationKey);
        console.log('🔄 Migration reset - will run again on next load');
    }
}

// Create global instance
window.storageMigration = new StorageMigration();

// Auto-run migration when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        if (window.advancedStorageManager) {
            window.storageMigration.runMigration();
        }
    }, 1000);
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageMigration;
}
