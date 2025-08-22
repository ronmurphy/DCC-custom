#!/bin/bash
# wwwcopy.sh - Copy development files to Cordova www directory
# Run this from the V3 directory: ./wwwcopy.sh

echo "🔄 Copying development files to Cordova www..."

# Define source and destination directories
SOURCE_DIR="/home/brad/Documents/DCC-custom/V3"
DEST_DIR="/home/brad/Documents/DCC-custom/V3/Cordova/DCWorld/www"

# Check if destination exists
if [ ! -d "$DEST_DIR" ]; then
    echo "❌ Error: Cordova www directory not found at $DEST_DIR"
    exit 1
fi

# Copy individual files (not in subfolders) - excluding certain files
echo "📁 Copying web files..."
cp "$SOURCE_DIR"/*.html "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.css "$DEST_DIR"/ 2>/dev/null  
cp "$SOURCE_DIR"/*.js "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.json "$DEST_DIR"/ 2>/dev/null

# Copy icon files if they exist
echo "🖼️  Copying icon files..."
cp "$SOURCE_DIR"/icon-*.png "$DEST_DIR"/ 2>/dev/null

# Don't copy these files to www (they belong elsewhere or not needed)
echo "🚫 Removing files that don't belong in www..."
rm -f "$DEST_DIR"/package.json 2>/dev/null
rm -f "$DEST_DIR"/package-lock.json 2>/dev/null
rm -f "$DEST_DIR"/game-reference.md 2>/dev/null

# Show what was copied
echo "✅ Copy complete! Files in Cordova www:"
ls -la "$DEST_DIR"/*.html "$DEST_DIR"/*.css "$DEST_DIR"/*.js "$DEST_DIR"/*.json 2>/dev/null | wc -l | xargs echo "   📄 Files copied:"

echo "🎯 Ready to build! Run ./build.sh to create APK"
