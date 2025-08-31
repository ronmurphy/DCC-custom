# GitHub Image Hosting Setup Guide

## Overview
The GitHub image hosting system provides a controlled, session-based image storage solution that eliminates CORS issues and provides full control over image uploads.

## Features
- **Session-based organization**: Images are stored in folders based on your Supabase session (e.g., `sessions/HDSRXA/`)
- **No CORS issues**: Direct GitHub API integration bypasses browser CORS restrictions
- **25MB file limit**: Supports large image files up to GitHub's limit
- **Automatic fallback**: If GitHub is unavailable, system falls back to other image hosting services
- **Spam prevention**: Chat image button system prevents rapid-fire uploads

## Setup Instructions

### 1. Create GitHub Repository
1. Go to GitHub and create a new public repository named `dcc-image-storage`
2. Initialize it with a README (optional)
3. The repository will auto-create folders as needed

### 2. Generate GitHub Personal Access Token
1. **Click your profile picture** (top right) → **Settings**
2. **Scroll down** in the left sidebar to find **"Developer settings"** (at the very bottom)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token (classic)"**
5. Give it a descriptive name like "DCC Image Hosting"
6. Select expiration (recommend "No expiration" for game sessions)
7. **Required scopes**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (Access public repositories)
8. Click **"Generate token"**
9. **IMPORTANT**: Copy the token immediately - you won't see it again!

**Alternative path if you can't find Developer settings:**
- Direct URL: https://github.com/settings/tokens
- Or go to: Profile → Settings → scroll to bottom → Developer settings

### 3. Configure the System

#### Option A: Using Silent Command (Recommended)
1. In StoryTeller chat, type: `/github:YOUR_TOKEN_HERE`
2. This silently distributes the token to all connected players
3. The command won't appear in chat - it's processed behind the scenes

#### Option B: Manual Configuration
1. Open browser console (F12)
2. Type: `localStorage.setItem('github_api_token', 'YOUR_TOKEN_HERE')`
3. Refresh the page

## Usage

### For Storytellers
1. Configure the token using `/github:YOUR_TOKEN` command
2. Use the 📷 button in chat to upload images
3. Images are automatically organized by session

### For Players
1. Token is automatically received when storyteller uses `/github:` command
2. Use the 📷 button in chat to upload images
3. All uploads go to the same session folder

## File Organization
```
dcc-image-storage/
├── sessions/
│   ├── HDSRXA/          # Session folder (auto-created)
│   │   ├── image1.png
│   │   ├── screenshot.jpg
│   │   └── map.png
│   └── BXCVNM/          # Another session
│       └── battle.gif
└── README.md
```

## Features

### Session Detection
The system automatically detects your session code from:
- Supabase connection URLs
- Current page URL parameters
- WebSocket connections

### Image Button System
- Click 📷 in chat to upload images
- Modal viewer for full-size viewing
- Player accent colors applied to image buttons
- Automatic spam prevention (rate limiting)

### Fallback Services
If GitHub hosting fails, the system automatically tries:
1. GitHub (primary)
2. PostImage
3. ImgBB (if API key provided)
4. FreeImage
5. Imgur

## Troubleshooting

### Token Issues
- **"API token required"**: Token not configured - use `/github:` command
- **"401 Unauthorized"**: Token expired or invalid - generate new token
- **"403 Forbidden"**: Token lacks required permissions - check scopes

### Upload Issues
- **"File too large"**: Files must be under 25MB
- **"Repository not found"**: Repository will be auto-created on first upload
- **"Network error"**: Check internet connection or try fallback services

### Console Commands
Useful debugging commands in browser console:
```javascript
// Check if token is stored
localStorage.getItem('github_api_token')

// Check GitHub host status
window.multiImageHost?.githubHost?.config

// Test file picker and upload
window.testImageUpload = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file && window.multiImageHost) {
            window.multiImageHost.uploadImage(file)
                .then(result => console.log('✅ Upload success:', result))
                .catch(error => console.error('❌ Upload failed:', error));
        }
    };
    input.click();
};
// Then call: window.testImageUpload()

// Check if image hosting system is ready
window.multiImageHost ? '✅ MultiImageHost ready' : '❌ MultiImageHost not found'
```

## Security Notes
- Tokens are stored in localStorage (per-browser)
- Use tokens with minimal required permissions
- Consider token expiration for enhanced security
- Public repositories mean images are publicly accessible
- Session folders provide organization but not access control

## Integration with Existing Systems
The GitHub hosting integrates seamlessly with:
- **Chat Image System**: 📷 buttons for easy uploads
- **MultiImageHost**: Automatic fallback hierarchy
- **Command Interceptor**: Silent token distribution
- **Player Management**: Session-based organization

## Example Workflow
1. Storyteller generates GitHub token
2. Storyteller types `/github:ghp_xxxxxxxxxxxx` in chat
3. All players automatically receive the token
4. Anyone can now click 📷 to upload images
5. Images appear as clickable buttons in chat
6. All session images stored in `sessions/SESSIONCODE/` folder
