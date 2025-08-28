# Quick Start Guide - Map Synchronization System

## For Storyteller App Integration

### 1. Include the Scripts
```html
<!-- Add to your HTML head or before closing body tag -->
<script src="/Connect/MapSyncManager.js"></script>
<script src="/Connect/MapSyncAdapter.js"></script>
<script src="/Connect/StorytellerIntegration.js"></script>
```

### 2. Initialize the System
```javascript
// After establishing Supabase connection and session
async function initializeMapSync() {
    const success = await window.mapSync.initialize(
        sessionCode,           // Your game session code
        supabaseClientWrapper  // Your Supabase client
    );
    
    if (success) {
        console.log('✅ Map synchronization ready!');
    }
}
```

### 3. Share a Map
```javascript
// Share current map with players
window.mapSync.shareMap(); // Uses existing currentMap

// Or share specific map data
const result = await globalMapSyncAdapter.shareMap(mapData, 'Dungeon Level 1', {
    allowPlayerMovement: true,
    showPlayerPositions: true,
    gridSize: 25
});
```

## For Player App Integration

### 1. Include the Scripts
```html
<!-- Add to your HTML -->
<script src="/Connect/MapClientManager.js"></script>
<script src="/Connect/PlayerPositionTracker.js"></script>
<script src="/Connect/MapSyncAdapter.js"></script>

<!-- Add map display area -->
<div id="map-display" style="min-height: 300px;"></div>
```

### 2. Initialize the System
```javascript
// After joining session
async function initializeMapSync() {
    const mapSyncAdapter = new MapSyncAdapter();
    await mapSyncAdapter.initialize({
        supabaseClient: yourSupabaseClient,
        sessionCode: sessionCode,
        playerName: playerName,
        isStoryteller: false,
        mapContainerId: 'map-display'
    });
    
    // Enable keyboard movement
    mapSyncAdapter.setupKeyboardMovement(true);
}
```

## Database Setup (One-time)

Run this SQL in your Supabase dashboard:

```sql
-- Shared Maps Table
CREATE TABLE IF NOT EXISTS shared_maps (
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
CREATE TABLE IF NOT EXISTS player_positions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_code, player_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_maps_session ON shared_maps(session_code);
CREATE INDEX IF NOT EXISTS idx_player_positions_session ON player_positions(session_code);
```

## Testing

1. **Use the Test Interface**: Open `/Connect/test.html` to verify all modules work
2. **Use Enhanced Player Interface**: Open `/StoryTeller/player-test.html` for full integration testing
3. **Check Console**: Look for success messages like "✅ Map synchronization ready"

## Troubleshooting

- **Modules not loading**: Check script paths are correct
- **Maps not appearing**: Verify Supabase connection and session codes match
- **Movement not working**: Check if `allowPlayerMovement` is enabled in map settings
- **Performance issues**: Reduce `gridSize` in map settings for large maps

## Features

- ✅ Real-time map sharing between Storyteller and Players
- ✅ Click-to-move and keyboard movement (WASD/Arrow keys)
- ✅ Player position synchronization
- ✅ CSS Grid-based map rendering
- ✅ Multiple map format support
- ✅ Event-driven architecture
- ✅ Minimal integration complexity
- ✅ Compatible with existing chat systems