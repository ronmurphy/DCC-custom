# Dungeon Crawler Sprite Sheet Guide

## Overview
This 4x4 sprite sheet (256x256 pixels total, 64x64 per tile) is designed to match your app icon's aesthetic with dark blue-gray base colors and orange accents. Perfect for Dungeon Crawler Carl themed maps!

## Tile Layout (Left to Right, Top to Bottom):

### Row 1: Walls & Doors
1. **Stone Wall** - Basic dungeon wall tile
2. **Stone Floor** - Basic dungeon floor tile  
3. **Wooden Door** - Standard door with orange wood and stone arch
4. **Metal Door** - Heavy metal door with bars

### Row 2: Terrain
5. **Grass** - Orange grass terrain for outdoor areas
6. **Water** - Animated-style water with waves
7. **Mountain/Rock** - Rocky terrain and obstacles
8. **Road/Path** - Stone pathway tiles

### Row 3: Buildings
9. **Castle/Fortress** - Fortified structure with battlements
10. **House** - Simple dwelling with orange roof
11. **Shop** - Market stall with orange awnings
12. **Temple** - Classical building with columns

### Row 4: Special Items
13. **Treasure Chest** - Orange and brown chest
14. **Fire/Torch** - Flame on a torch base
15. **Danger/Trap** - Warning triangle symbol
16. **Player Token** - Character avatar in orange

## Integration with Your Map Editor

### Replacing Emoji System:
- Replace emoji values in `tileOptions` array with sprite coordinates
- Each tile can be referenced as `{row: 0-3, col: 0-3}` or as a single index `0-15`

### Suggested Mapping:
```javascript
const spriteMapping = {
  // Terrain
  '🌿': {sprite: 4, name: 'Grass'},      // Row 2, Col 1
  '🌊': {sprite: 5, name: 'Water'},      // Row 2, Col 2  
  '🏔️': {sprite: 6, name: 'Mountain'},   // Row 2, Col 3
  '🪨': {sprite: 6, name: 'Rock'},       // Row 2, Col 3
  '🛣️': {sprite: 7, name: 'Road'},       // Row 2, Col 4
  
  // Buildings  
  '🏰': {sprite: 8, name: 'Castle'},     // Row 3, Col 1
  '🏠': {sprite: 9, name: 'House'},      // Row 3, Col 2
  '🏪': {sprite: 10, name: 'Shop'},      // Row 3, Col 3
  '🏛️': {sprite: 11, name: 'Temple'},    // Row 3, Col 4
  
  // Special
  '🚪': {sprite: 2, name: 'Door'},       // Row 1, Col 3
  '🔥': {sprite: 13, name: 'Fire'},      // Row 4, Col 2
  '⚠️': {sprite: 14, name: 'Danger'},    // Row 4, Col 3
  '👤': {sprite: 15, name: 'Player'},    // Row 4, Col 4
  
  // Walls/Floors
  'wall': {sprite: 0, name: 'Wall'},     // Row 1, Col 1
  'floor': {sprite: 1, name: 'Floor'}    // Row 1, Col 2
};
```

## CSS Implementation:
```css
.tile {
  width: 32px;
  height: 32px;
  background-image: url('dungeon_sprite_sheet.png');
  background-size: 256px 256px;
}

.tile-0 { background-position: 0px 0px; }      /* Stone Wall */
.tile-1 { background-position: -64px 0px; }    /* Stone Floor */
.tile-2 { background-position: -128px 0px; }   /* Wooden Door */
/* ... continue for all 16 tiles */
```

## Color Palette Used:
- **Primary Dark**: #2C3E50 (matches your app icon)
- **Secondary Gray**: #5D6D7E  
- **Accent Orange**: #F39C12 (matches your app icon)
- **Light Orange**: #F8C471
- **White Accents**: #FFFFFF for highlights

This sprite sheet provides a cohesive, professional look that will make your map editor much more visually appealing than the current emoji system!

