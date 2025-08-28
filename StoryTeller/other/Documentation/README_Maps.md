# Map Synchronization System Documentation

## Overview

The DCC-custom Map Synchronization System is a comprehensive, real-time map sharing solution that enables seamless communication between the Storyteller (DM) app and V4 (player) app. Built on the existing Supabase infrastructure, it provides bidirectional synchronization of maps and player positions with minimal integration complexity.

## System Architecture

### Core Components

#### 1. MapSyncManager.js (Storyteller-side)
- **Purpose**: Manages map sharing from the Storyteller perspective
- **Key Features**:
  - Share maps with real-time notifications
  - Track player positions across the map
  - Update map settings dynamically
  - Handle multiple map formats (legacy and new)

#### 2. MapClientManager.js (Player-side)
- **Purpose**: Receives and displays shared maps for players
- **Key Features**:
  - Subscribe to map updates via Supabase
  - Render maps using CSS Grid system
  - Display player position markers
  - Handle click-to-move interactions

#### 3. PlayerPositionTracker.js (Player-side)
- **Purpose**: Advanced position tracking and movement validation
- **Key Features**:
  - Real-time position updates to database
  - Movement constraints and validation
  - Keyboard movement support (WASD/Arrow keys)
  - Position history tracking
  - Click-to-move functionality

#### 4. MapSyncAdapter.js (Integration Bridge)
- **Purpose**: Provides easy integration with existing applications
- **Key Features**:
  - Single initialization for complete system
  - Event-driven architecture
  - Integration with existing chat systems
  - Role-based functionality (Storyteller vs Player)
  - Command-line interface for map operations

### Database Schema

The system extends the existing Supabase database with two additional tables:

```sql
-- Shared Maps Table
CREATE TABLE shared_maps (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) NOT NULL,
    map_name VARCHAR(200) NOT NULL,
    map_data JSONB NOT NULL,
    map_settings JSONB DEFAULT '{}',
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_code)
);

-- Player Positions Table
CREATE TABLE player_positions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_code, player_name)
);
```

### Data Flow

1. **Map Sharing**:
   - Storyteller shares map → MapSyncManager stores in database
   - Real-time notification sent to all players via chat system
   - Players receive notification → MapClientManager fetches and renders map

2. **Player Movement**:
   - Player moves on map → PlayerPositionTracker validates movement
   - Position stored in database → Real-time update to Storyteller
   - Other players see position update in real-time

3. **Event Synchronization**:
   - All updates use Supabase real-time subscriptions
   - Fallback notifications via existing chat system
   - Automatic reconnection handling

## Integration Guide

### For Storyteller App

#### Basic Integration

```javascript
// Initialize map sync adapter
const mapSyncAdapter = new MapSyncAdapter();
await mapSyncAdapter.initialize({
    supabaseClient: yourSupabaseClient,
    sessionCode: 'GAME123',
    playerName: 'DM',
    isStoryteller: true
});

// Share a map
const result = await mapSyncAdapter.shareMap(mapData, 'Dungeon Level 1', {
    allowPlayerMovement: true,
    showPlayerPositions: true,
    gridSize: 25
});
```

#### Advanced Integration with Existing Map System

```javascript
// Integration with existing map-sharing.js
mapSyncAdapter.integrateWithMapSharing();

// Integration with chat system
mapSyncAdapter.integrateWithChat();

// Monitor player positions
mapSyncAdapter.setEventHandlers(
    null, // onMapReceived (not used for storyteller)
    (mapName, mapData) => {
        console.log(`Map shared: ${mapName}`);
        showNotification(`Map "${mapName}" shared with players`, 'success');
    },
    (playerName, x, y) => {
        console.log(`${playerName} moved to (${x}, ${y})`);
        updatePlayerMarkerOnMap(playerName, x, y);
    },
    (category, type, error) => {
        console.error('Map sync error:', error);
        showNotification(`Map sync error: ${error.message}`, 'error');
    }
);
```

### For V4 Player App

#### Basic Integration

```javascript
// Initialize map sync adapter
const mapSyncAdapter = new MapSyncAdapter();
await mapSyncAdapter.initialize({
    supabaseClient: yourSupabaseClient,
    sessionCode: 'GAME123',
    playerName: 'Alice',
    isStoryteller: false,
    mapContainerId: 'map-container'
});

// Enable keyboard movement
mapSyncAdapter.setupKeyboardMovement(true);
```

#### Event Handling

```javascript
// Set up event handlers
mapSyncAdapter.setEventHandlers(
    (mapData, record) => {
        console.log(`Map received: ${mapData.name}`);
        showNotification(`New map: ${mapData.name}`, 'info');
    },
    null, // onMapShared (not used for players)
    (playerName, x, y) => {
        if (playerName !== window.playerName) {
            console.log(`${playerName} moved to (${x}, ${y})`);
        }
    },
    (category, type, error) => {
        console.error('Map error:', error);
        showNotification(`Map error: ${error.message}`, 'error');
    }
);
```

### Drag-and-Drop Integration

Each component is designed for minimal integration complexity:

1. **Include Scripts**:
```html
<script src="../Connect/MapSyncManager.js"></script>
<script src="../Connect/MapClientManager.js"></script>
<script src="../Connect/PlayerPositionTracker.js"></script>
<script src="../Connect/MapSyncAdapter.js"></script>
```

2. **Initialize with One Function**:
```javascript
const mapSync = new MapSyncAdapter();
await mapSync.initialize(options);
```

3. **Set Event Handlers** (optional):
```javascript
mapSync.setEventHandlers(onMapReceived, onMapShared, onPlayerMoved, onError);
```

## Map Data Formats

The system supports multiple map data formats for maximum compatibility:

### New Grid Format (Recommended)
```javascript
{
    name: "Dungeon Level 1",
    grid: [
        [0, 1, 1, 1, 0],
        [0, 1, 2, 1, 0],
        [1, 1, 2, 1, 1],
        [0, 1, 2, 1, 0],
        [0, 1, 1, 1, 0]
    ],
    tileset: "dungeon",
    size: 5,
    settings: {
        allowPlayerMovement: true,
        showPlayerPositions: true,
        gridSize: 20
    }
}
```

### Legacy Format (Supported)
```javascript
{
    name: "Legacy Map",
    mapData: [0, 1, 1, 1, 0, 0, 1, 2, 1, 0, ...], // Flattened array
    size: 5,
    type: "dungeon",
    playerLayer: []
}
```

### Raw Grid Array
```javascript
[
    [0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0],
    // ... more rows
]
```

## API Reference

### MapSyncAdapter

#### Constructor
```javascript
const adapter = new MapSyncAdapter();
```

#### Methods

##### initialize(options)
Initialize the adapter with role-specific configuration.

**Parameters:**
- `options.supabaseClient` - Initialized Supabase client
- `options.sessionCode` - Game session identifier
- `options.playerName` - Player/DM name
- `options.isStoryteller` - Boolean indicating role
- `options.mapContainerId` - DOM element ID for map display (players only)

##### shareMap(mapData, mapName, options) *(Storyteller only)*
Share a map with all players in the session.

**Parameters:**
- `mapData` - Map data in supported format
- `mapName` - Display name for the map
- `options` - Map settings object

**Returns:** `Promise<{success: boolean, data?: object, error?: string}>`

##### moveToPosition(x, y) *(Player only)*
Move player to specific coordinates.

**Parameters:**
- `x` - X coordinate
- `y` - Y coordinate

**Returns:** `Promise<{success: boolean, from?: object, to?: object, reason?: string}>`

##### getCurrentMap()
Get currently shared/received map data.

**Returns:** Map data object or null

##### getStatus()
Get current adapter status and information.

**Returns:** Status object with role, initialization state, etc.

### MapSyncManager *(Storyteller)*

#### Key Methods
- `shareMap(mapData, mapName, options)` - Share map with players
- `updateMapSettings(settings)` - Update map configuration
- `stopSharingMap()` - Stop sharing current map
- `getPlayerPositions()` - Get all player positions
- `subscribeToPlayerPositions()` - Start monitoring player movements

### MapClientManager *(Player)*

#### Key Methods
- `subscribeToMaps()` - Start listening for map updates
- `getCurrentMap()` - Get current map data
- `getAllPlayerPositions()` - Get positions of all players

### PlayerPositionTracker *(Player)*

#### Key Methods
- `moveTo(x, y, force)` - Move to specific position
- `moveRelative(deltaX, deltaY)` - Move relative to current position
- `setupKeyboardMovement(enabled)` - Enable/disable keyboard controls
- `setConstraints(minX, minY, maxX, maxY)` - Set movement boundaries
- `getMovementStats()` - Get movement statistics

## Chat Commands

When integrated with the chat system, the following commands are available:

### Storyteller Commands
- `/map share` - Share current map
- `/map stop` - Stop sharing map
- `/map settings <key> <value>` - Update map settings

### Player Commands
- `/map move <x> <y>` - Move to position
- `/map pos` - Show current position
- `/map stats` - Show movement statistics

## Error Handling

The system includes comprehensive error handling:

### Connection Errors
- Automatic retry for failed database operations
- Fallback to chat notifications if real-time fails
- Graceful degradation when Supabase is unavailable

### Movement Validation
- Boundary checking
- Obstacle detection
- Rate limiting to prevent spam

### Data Validation
- Map format validation
- Position validation
- Session code verification

## Performance Considerations

### Database Optimization
- Indexed queries for fast lookups
- Throttled position updates (100ms minimum)
- Automatic cleanup of old position data

### Memory Management
- Position history limited to 50 entries
- Automatic subscription cleanup
- Event listener removal on cleanup

### Network Efficiency
- Minimal data payloads
- Real-time subscriptions only for active sessions
- Compression of map data when possible

## Testing

### Test Setup

The system includes a test setup using `player-test.html`:

1. **Backup Created**: `player-test-backup.html` preserves original
2. **Enhanced Test Interface**: Modified `player-test.html` includes map display
3. **Map Synchronization**: Full testing environment for map receiving

### Manual Testing Steps

1. **Setup**:
   - Start Storyteller app with map system
   - Open player-test.html in browser
   - Connect both to same Supabase session

2. **Map Sharing Test**:
   - Share map from Storyteller
   - Verify map appears in player interface
   - Test different map formats

3. **Movement Test**:
   - Enable player movement in map settings
   - Test click-to-move functionality
   - Test keyboard movement (WASD/arrows)
   - Verify position updates in Storyteller

4. **Real-time Test**:
   - Open multiple player instances
   - Test simultaneous movement
   - Verify position synchronization

### Automated Testing

```javascript
// Example test scenarios
async function testMapSharing() {
    const result = await mapSyncAdapter.shareMap(testMapData, 'Test Map');
    console.assert(result.success, 'Map sharing failed');
}

async function testPlayerMovement() {
    const result = await mapSyncAdapter.moveToPosition(5, 5);
    console.assert(result.success, 'Movement failed');
    
    const position = mapSyncAdapter.getCurrentPosition();
    console.assert(position.x === 5 && position.y === 5, 'Position not updated');
}
```

## Troubleshooting

### Common Issues

#### Map Not Appearing
- Check Supabase connection
- Verify session codes match
- Check browser console for errors
- Ensure map data format is valid

#### Movement Not Working
- Check if movement is enabled in map settings
- Verify position constraints
- Check for JavaScript errors
- Ensure click handlers are attached

#### Performance Issues
- Reduce position update frequency
- Check for memory leaks in subscriptions
- Optimize map rendering for large grids
- Monitor database query performance

### Debug Commands

```javascript
// Check adapter status
console.log(mapSyncAdapter.getStatus());

// Get current map
console.log(mapSyncAdapter.getCurrentMap());

// Get movement stats (players)
console.log(mapSyncAdapter.getMovementStats());

// Get player positions (storyteller)
console.log(mapSyncAdapter.getPlayerPositions());
```

## Future Enhancements

### Planned Features

1. **Enhanced Map Tools**:
   - Fog of war system
   - Dynamic lighting
   - Terrain effects

2. **Advanced Movement**:
   - Turn-based movement locks
   - Movement ranges and limits
   - Teleportation effects

3. **Visual Enhancements**:
   - Animated movement transitions
   - Custom player avatars
   - Map annotations and markers

4. **Performance Optimizations**:
   - Map data compression
   - Progressive loading for large maps
   - Offline mode support

### Extension Points

The modular architecture supports easy extension:

```javascript
// Custom movement validator
class CustomMovementValidator {
    validate(x, y, player) {
        // Custom validation logic
        return { valid: true };
    }
}

// Custom map renderer
class CustomMapRenderer {
    render(mapData, container) {
        // Custom rendering logic
    }
}
```

## Support and Maintenance

### Version History
- v1.0 - Initial implementation with core features
- Future versions will maintain backward compatibility

### Contributing
- Follow existing code patterns
- Include comprehensive error handling
- Add documentation for new features
- Test with both Storyteller and Player apps

### Contact
For issues or questions about the Map Synchronization System, please refer to the main project documentation or create an issue in the repository.