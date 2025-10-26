# Data Fetching Instructions

## How to Update Game Data

Since we're using historical data that won't change, we fetch it once and store it locally for better performance.

### Step 1: Run the Data Fetcher

1. Open `fetch-data.js` in a browser or Node.js environment
2. The script will fetch all 2021-2024 CFB games from the CFBD API
3. It will output two JSON objects to the console

### Step 2: Update Local Files

1. Copy the **TEAMS.JSON** output and replace the contents of `data/teams.json`
2. Copy the **GAMES.JSON** output and replace the contents of `data/games.json`

### Step 3: Test the App

The app will now use the local data instead of making API calls, making it:
- ✅ Faster to load
- ✅ Works offline
- ✅ No API rate limiting
- ✅ No API key exposure

### Benefits of This Approach

- **Performance**: No API calls on page load
- **Reliability**: Works even if API is down
- **Offline**: Fully functional without internet
- **Security**: No API key in client-side code
- **Simplicity**: Cleaner, simpler codebase

### When to Re-fetch Data

- When you want to add more seasons (2025, etc.)
- If you discover data errors that need correction
- When you want to add more teams/leagues
