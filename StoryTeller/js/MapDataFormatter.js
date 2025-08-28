// Map Data Formatter Module
// Handles conversion between different map data formats for sharing and storage
// Provides standardized format for map synchronization across different systems

class MapDataFormatter {
    constructor() {
        this.version = '1.0';
        this.supportedFormats = ['v1_2map-sprite-objects', 'storyteller-indexeddb', 'grid-tileset', 'legacy-mapdata', 'raw-grid', 'storyteller-native'];
    }

    // Main entry point - detect format and convert to standardized format
    formatForSharing(mapData, mapName, options = {}) {
        console.log('🔧 MapDataFormatter: Processing map for sharing');
        console.log('Input mapData:', mapData);
        console.log('Input mapName:', mapName);
        console.log('Input options:', options);

        const detectedFormat = this.detectFormat(mapData);
        console.log('🔍 Detected format:', detectedFormat);

        const standardized = this.convertToStandardFormat(mapData, mapName, detectedFormat, options);
        console.log('✅ Standardized map:', standardized);

        return standardized;
    }

    // Detect what format the incoming map data is in
    detectFormat(mapData) {
        if (!mapData) {
            throw new Error('Map data is null or undefined');
        }

        // Check for v1_2map.json format (actual working format)
        if (mapData.grid && Array.isArray(mapData.grid) && 
            mapData.grid[0] && Array.isArray(mapData.grid[0]) &&
            mapData.grid[0][0] && typeof mapData.grid[0][0] === 'object' &&
            mapData.grid[0][0].type === 'sprite' && mapData.grid[0][0].value) {
            return 'v1_2map-sprite-objects';
        }

        // StoryTeller IndexedDB format (id + name + data object)
        if (mapData.id && mapData.name && mapData.data) {
            return 'storyteller-indexeddb';
        }

        // StoryTeller native format (grid + tileset)
        if (mapData.grid && mapData.tileset) {
            return 'grid-tileset';
        }

        // Legacy format from map-sharing.js (mapData + size)
        if (mapData.mapData && mapData.size) {
            return 'legacy-mapdata';
        }

        // Raw grid array
        if (Array.isArray(mapData)) {
            return 'raw-grid';
        }

        // Check for other StoryTeller native properties
        if (mapData.name && (mapData.grid || mapData.mapData)) {
            return 'storyteller-native';
        }

        throw new Error(`Unsupported map data format. Available properties: ${Object.keys(mapData).join(', ')}`);
    }

    // Convert any supported format to standardized sharing format
    convertToStandardFormat(mapData, mapName, format, options) {
        let standardized = {
            name: mapName,
            timestamp: new Date().toISOString(),
            version: this.version,
            type: 'shared_map',
            originalFormat: format,
            settings: {
                allowPlayerMovement: options.allowPlayerMovement !== false,
                showPlayerPositions: options.showPlayerPositions !== false,
                gridSize: options.gridSize || 20,
                ...options
            }
        };

        switch (format) {
            case 'v1_2map-sprite-objects':
                return this.convertV1_2MapFormat(mapData, standardized);
            
            case 'storyteller-indexeddb':
                return this.convertIndexedDBFormat(mapData, standardized);
            
            case 'grid-tileset':
                return this.convertGridTilesetFormat(mapData, standardized);
            
            case 'legacy-mapdata':
                return this.convertLegacyFormat(mapData, standardized);
            
            case 'raw-grid':
                return this.convertRawGridFormat(mapData, standardized);
            
            case 'storyteller-native':
                return this.convertStorytellerNativeFormat(mapData, standardized);
            
            default:
                throw new Error(`Cannot convert format: ${format}`);
        }
    }

    // Convert v1_2map.json format (actual working format with sprite objects)
    convertV1_2MapFormat(mapData, standardized) {
        console.log('🎨 Converting v1_2map sprite objects format');
        
        return {
            ...standardized,
            grid: mapData.grid, // Keep the full sprite objects
            tileset: 'sprite-objects', // Special marker for sprite object format
            size: mapData.grid.length,
            metadata: {
                originalFormat: 'v1_2map-sprite-objects',
                spriteBasedMap: true,
                gridDimensions: `${mapData.grid.length}x${mapData.grid[0]?.length || mapData.grid.length}`
            }
        };
    }

    // Convert StoryTeller IndexedDB format (id + name + data object)
    convertIndexedDBFormat(mapData, standardized) {
        console.log('🔧 Converting IndexedDB format, data contents:', mapData.data);
        
        // Parse size if it's a string like "15×15"
        let mapSize = mapData.size;
        if (typeof mapSize === 'string') {
            const sizeParts = mapSize.split('×');
            mapSize = parseInt(sizeParts[0]) || 15;
        }
        
        return {
            ...standardized,
            grid: mapData.data.grid || mapData.data, // Handle both grid property and direct data
            tileset: mapData.tileset || mapData.data.tileset || 'default',
            size: mapSize,
            metadata: {
                originalId: mapData.id,
                created: mapData.created,
                modified: mapData.modified,
                originalFormat: 'storyteller-indexeddb'
            }
        };
    }

    // Convert grid + tileset format (current StoryTeller format)
    convertGridTilesetFormat(mapData, standardized) {
        return {
            ...standardized,
            grid: mapData.grid,
            tileset: mapData.tileset || 'default',
            size: mapData.size || mapData.grid.length,
            type: mapData.type || standardized.type,
            metadata: {
                created: mapData.created,
                version: mapData.version,
                originalType: mapData.type
            }
        };
    }

    // Convert legacy mapData + size format
    convertLegacyFormat(mapData, standardized) {
        return {
            ...standardized,
            mapData: mapData.mapData,
            size: mapData.size,
            type: 'legacy',
            playerLayer: mapData.playerLayer || [],
            metadata: {
                originalFormat: 'legacy',
                migrated: true
            }
        };
    }

    // Convert raw grid array
    convertRawGridFormat(mapData, standardized) {
        return {
            ...standardized,
            grid: mapData,
            size: mapData.length,
            tileset: 'default',
            metadata: {
                originalFormat: 'raw-grid',
                autoGenerated: true
            }
        };
    }

    // Convert other StoryTeller native formats
    convertStorytellerNativeFormat(mapData, standardized) {
        let converted = {
            ...standardized,
            size: mapData.size || (mapData.grid ? mapData.grid.length : 10),
            metadata: {
                originalName: mapData.name,
                originalFormat: 'storyteller-native'
            }
        };

        // Use grid if available, otherwise mapData
        if (mapData.grid) {
            converted.grid = mapData.grid;
            converted.tileset = mapData.tileset || 'default';
        } else if (mapData.mapData) {
            converted.mapData = mapData.mapData;
            converted.type = 'legacy';
        }

        return converted;
    }

    // Convert standardized format back to specific format for local use
    convertFromStandardFormat(standardizedData, targetFormat = 'v1_2map-sprite-objects') {
        console.log('🔄 Converting from standard format to:', targetFormat);
        
        switch (targetFormat) {
            case 'v1_2map-sprite-objects':
                // Convert back to the working v1_2map.json format
                return {
                    name: standardizedData.name,
                    grid: standardizedData.grid, // Should contain the sprite objects
                    size: standardizedData.size,
                    tileset: 'sprite-objects',
                    metadata: standardizedData.metadata
                };
                
            case 'grid-tileset':
                return {
                    name: standardizedData.name,
                    grid: standardizedData.grid,
                    tileset: standardizedData.tileset || 'default',
                    size: standardizedData.size,
                    type: standardizedData.metadata?.originalType || 'shared',
                    created: standardizedData.timestamp,
                    version: standardizedData.version
                };
                
            case 'legacy-mapdata':
                return {
                    name: standardizedData.name,
                    mapData: standardizedData.mapData || standardizedData.grid,
                    size: standardizedData.size,
                    playerLayer: standardizedData.playerLayer || [],
                    type: 'legacy'
                };
                
            default:
                console.warn('Unknown target format, returning standardized data');
                return standardizedData;
        }
    }

    // Compress map data for efficient transmission
    compressMapData(mapData) {
        // Simple compression - could be enhanced with actual compression algorithms
        let compressed = { ...mapData };
        
        // Remove redundant or large metadata
        if (compressed.metadata && Object.keys(compressed.metadata).length === 0) {
            delete compressed.metadata;
        }
        
        // Compress grid if it's repetitive (future enhancement)
        // Could implement RLE or other compression here
        
        compressed._compressed = true;
        compressed._originalSize = JSON.stringify(mapData).length;
        compressed._compressedSize = JSON.stringify(compressed).length;
        
        console.log(`📦 Compression: ${compressed._originalSize} → ${compressed._compressedSize} bytes`);
        
        return compressed;
    }

    // Decompress map data after transmission
    decompressMapData(compressedData) {
        if (!compressedData._compressed) {
            return compressedData; // Not compressed
        }
        
        let decompressed = { ...compressedData };
        delete decompressed._compressed;
        delete decompressed._originalSize;
        delete decompressed._compressedSize;
        
        return decompressed;
    }

    // Validate map data structure
    validateMapData(mapData) {
        const errors = [];
        
        if (!mapData.name) errors.push('Map name is required');
        if (!mapData.size || mapData.size < 1) errors.push('Valid map size is required');
        if (!mapData.grid && !mapData.mapData) errors.push('Map must have grid or mapData');
        
        if (mapData.grid) {
            if (!Array.isArray(mapData.grid)) errors.push('Grid must be an array');
            if (mapData.grid.length !== mapData.size) errors.push('Grid size mismatch');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Get format information for debugging
    getFormatInfo(mapData) {
        try {
            const detectedFormat = this.detectFormat(mapData);
            return {
                detectedFormat: detectedFormat,
                supportedFormats: this.supportedFormats,
                properties: Object.keys(mapData || {}),
                size: mapData?.size || mapData?.grid?.length || mapData?.data?.grid?.length || 'unknown',
                hasGrid: !!mapData?.grid,
                hasTileset: !!mapData?.tileset,
                hasMapData: !!mapData?.mapData,
                hasData: !!mapData?.data,
                hasId: !!mapData?.id
            };
        } catch (error) {
            return {
                error: error.message,
                supportedFormats: this.supportedFormats,
                properties: Object.keys(mapData || {}),
                rawData: mapData
            };
        }
    }
}

// Export for use in other modules
window.MapDataFormatter = MapDataFormatter;

console.log('📋 MapDataFormatter module loaded');
