#!/bin/bash
# wwwcopy.sh - Copy development files to Cordova www directory
# Run this from the V3 directory: ./wwwcopy.sh

echo "🔄 Copying development files to Cordova www..."

# Define source and destination directories
SOURCE_DIR="/home/brad/Documents/DCC-custom/V4"
DEST_DIR="/home/brad/Documents/DCC-custom/V4/Cordova/DCWorld/www"

# Check if destination exists
if [ ! -d "$DEST_DIR" ]; then
    echo "❌ Error: Cordova www directory not found at $DEST_DIR"
    exit 1
fi

# Clean up old versions of the file types we're about to copy
echo "🧹 Cleaning old web files (preserving subdirectories and icons)..."
rm -f "$DEST_DIR"/*.html 2>/dev/null
rm -f "$DEST_DIR"/*.css 2>/dev/null  
rm -f "$DEST_DIR"/*.js 2>/dev/null
rm -f "$DEST_DIR"/*.json 2>/dev/null
# NOTE: Preserving existing icon-*.png files - they don't need to be cleaned

# Copy individual files (not in subfolders) - excluding certain files
echo "📁 Copying fresh web files..."
cp "$SOURCE_DIR"/*.html "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.css "$DEST_DIR"/ 2>/dev/null  
cp "$SOURCE_DIR"/*.js "$DEST_DIR"/ 2>/dev/null
cp "$SOURCE_DIR"/*.json "$DEST_DIR"/ 2>/dev/null

# Copy icon files if they exist (only if not already there)
echo "🖼️  Copying icon files (if needed)..."
if [ ! -f "$DEST_DIR"/icon-192.png ] || [ ! -f "$DEST_DIR"/icon-512.png ]; then
    cp "$SOURCE_DIR"/icon-*.png "$DEST_DIR"/ 2>/dev/null
    echo "   📱 Icon files copied"
else
    echo "   📱 Icon files already present, skipping"
fi

# Don't copy these files to www (they belong elsewhere or not needed)
echo "🚫 Removing files that don't belong in www..."
rm -f "$DEST_DIR"/package.json 2>/dev/null
rm -f "$DEST_DIR"/package-lock.json 2>/dev/null
rm -f "$DEST_DIR"/game-reference.md 2>/dev/null

# Show what was copied
echo "✅ Copy complete! Files in Cordova www:"
ls -la "$DEST_DIR"/*.html "$DEST_DIR"/*.css "$DEST_DIR"/*.js "$DEST_DIR"/*.json 2>/dev/null | wc -l | xargs echo "   📄 Files copied:"

echo "🎯 Ready to build! Run ./build.sh to create APK"
