# Real-Time Chat Setup Guide

## Overview
This guide helps you set up the **free** Supabase-powered real-time chat system for your StoryTeller app. This replaces the expensive PubNub solution with a completely free alternative that handles 100+ gaming sessions per month at zero cost.

## Why Supabase?
- ✅ **100% Free** for gaming groups (500MB database + 2GB bandwidth monthly)
- ✅ **Real-time messaging** - instant communication between DM and players
- ✅ **Automatic combat processing** - ATTACK commands processed instantly
- ✅ **Session persistence** - chat history saved automatically
- ✅ **No message limits** - unlike PubNub's 200 message restriction

## Quick Setup (5 minutes)

### Step 1: Create Free Supabase Account
1. Go to [supabase.com](https://supabase.com/dashboard/sign-up)
2. Sign up with GitHub (recommended) or email
3. Create a new project:
   - **Name:** DCC-StoryTeller (or any name you like)
   - **Database Password:** Choose a secure password
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free (default)

### Step 2: Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste this SQL code:

```sql
-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) UNIQUE NOT NULL,
    dm_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- Game messages table  
CREATE TABLE IF NOT EXISTS game_messages (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) REFERENCES game_sessions(session_code),
    player_name VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_text TEXT,
    game_data JSONB,
    is_storyteller BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
```

3. Click **Run** to create the tables

### Step 3: Get Your API Keys
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abc123xyz.supabase.co`)
   - **Public anon key** (long string starting with `eyJ`)

### Step 4: Configure StoryTeller App
1. Open your StoryTeller app
2. Click the **Configure** tab (first tab with ⚙️ icon)
3. Paste your **Project URL** and **API Key** into the form
4. Click **Test Connection** to verify everything works
5. Click **Save Configuration** to store the settings

## Sharing with Players

### Option 1: Share Configuration Link (Recommended)
After configuring your app, you'll see a **Share Configuration Link** in the Configure tab. Send this link to your players - it will automatically configure their apps with the same settings.

### Option 2: Manual Setup
Players can manually enter the same Project URL and API Key in their Configure tab.

## Usage

### Starting a Game Session
1. Open the **Game Chat** tab
2. Click **Start New Session**
3. Enter your DM name and create a session code
4. Share the session code with players
5. Players join using the same session code

### Sending Combat Commands
DMs can send structured attack commands:
```
ATTACK:Carl:18:8:Steel Sword
```
This automatically:
- Rolls combat for player "Carl"
- Uses attack roll of 18, damage of 8
- Applies weapon "Steel Sword"
- Updates combat log
- Notifies all players

### Real-Time Features
- ✅ Instant messaging between DM and players
- ✅ Automatic combat resolution and notifications
- ✅ Map sharing integration
- ✅ Session persistence (chat history saved)
- ✅ Player join/leave notifications

## Troubleshooting

### "Connection failed" Error
- Double-check your Project URL includes `https://` and ends with `.supabase.co`
- Verify your API key starts with `eyJ` and is the **public anon key** (not secret key)
- Ensure you've run the SQL setup commands in Supabase

### "Tables not found" Error
- Run the SQL setup commands in your Supabase SQL Editor
- Make sure you've enabled real-time subscriptions with: `ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;`

### Players Can't Connect
- Make sure players are using the exact same Project URL and API key
- Use the configuration share link to avoid copy/paste errors
- Check that players have clicked "Save Configuration" after entering the keys

## Cost Analysis
- **Supabase Free Tier:** 500MB database + 2GB bandwidth monthly
- **Typical Usage:** 4-hour gaming session = ~1MB of chat data
- **Monthly Capacity:** 100+ gaming sessions completely free
- **Upgrade Cost:** $25/month for 8GB database + 250GB bandwidth (if needed)

Compare to PubNub: $98/month after first 200 messages!

## Advanced Features

### Custom Session Codes
Session codes can be:
- Simple: `GAME1`, `DCC`, `FRIDAY`
- Themed: `DUNGEON`, `CRAWLER`, `EPIC`
- Private: `SECRET123`, `VIP2024`

### Combat Integration
The system automatically integrates with:
- Enemy database for instant lookups
- Combat manager for damage tracking
- Map editor for tactical information
- Achievement system for progress tracking

## Security Notes
- API keys are stored locally in your browser (not uploaded to GitHub)
- Use the **public anon key** only (never share secret keys)
- Session codes act as room passwords - keep them private
- All data is encrypted in transit via HTTPS

## Support
If you encounter issues:
1. Check the Configure tab for connection status
2. Verify your Supabase dashboard shows the tables exist
3. Test with a simple message first before using combat commands
4. Refresh the page and try again if needed

Happy gaming! 🎲
