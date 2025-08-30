#!/bin/bash
# build.sh - Build Cordova Android APK and copy to builds folder
# Run this from the V3 directory: ./build.sh

echo "🏗️  Starting Cordova Android build..."

# Define directories
CORDOVA_DIR="/home/brad/Documents/DCC-custom/V4/Cordova/DCWorld"
BUILD_DIR="$CORDOVA_DIR/builds"
APK_SOURCE="$CORDOVA_DIR/platforms/android/app/build/outputs/apk/debug/app-debug.apk"

# Check if Cordova directory exists
if [ ! -d "$CORDOVA_DIR" ]; then
    echo "❌ Error: Cordova directory not found at $CORDOVA_DIR"
    exit 1
fi

# Create builds directory if it doesn't exist
mkdir -p "$BUILD_DIR"

# Navigate to Cordova directory
cd "$CORDOVA_DIR" || exit 1

echo "📍 Building in: $(pwd)"

# Clean and build
echo "🧹 Cleaning previous build..."
cordova clean android

echo "🔨 Building Android APK..."
if cordova build android; then
    echo "✅ Build successful!"
    
    # Check if APK was created
    if [ -f "$APK_SOURCE" ]; then
        # Create timestamped filename
        TIMESTAMP=$(date +%Y%m%d-%H%M)
        APK_DEST="$BUILD_DIR/dcc-sheet-$TIMESTAMP.apk"
        
        # Copy APK to builds folder
        cp "$APK_SOURCE" "$APK_DEST"
        
        # Get file size for display
        APK_SIZE=$(du -h "$APK_DEST" | cut -f1)
        
        echo "📱 APK copied to: builds/dcc-sheet-$TIMESTAMP.apk ($APK_SIZE)"
        echo "🎉 Build complete! APK ready for testing."
        
        # List recent builds
        echo ""
        echo "📋 Recent builds:"
        ls -lt "$BUILD_DIR"/*.apk | head -5 | while read -r line; do
            echo "   $line"
        done
        
    else
        echo "❌ Error: APK file not found at $APK_SOURCE"
        exit 1
    fi
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi
