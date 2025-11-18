# Data Fetching Instructions

## How to Update Game Data

Since we're using historical data that won't change, we fetch it once and store it locally for better performance.

## Automated Updates (Last Week Category)

**The "last week" category is automatically updated every Sunday via GitHub Actions!**

- Runs every Sunday at 4 PM UTC (10 AM Central Time)
- Automatically fetches latest games from CFBD API
- Updates `data/games-2025.json` and `data/teams-2025.json`
- Commits and pushes changes automatically

**Setup:** See `.github/workflows/README.md` for setup instructions (requires adding `CFBD_API_KEY` as a GitHub secret).

## Manual Data Fetching

### Step 1: Run the Data Fetcher

1. Open `fetch-data.js` in a browser or Node.js environment
2. The script will fetch all 2021-2024 CFB games from the CFBD API
3. It will output two JSON objects to the console

**OR** use `fetch-data-node.js` for 2025 season:
```bash
node fetch-data-node.js
```

### Step 2: Update Local Files

1. Copy the **TEAMS.JSON** output and replace the contents of `data/teams.json`
2. Copy the **GAMES.JSON** output and replace the contents of `data/games.json`

**OR** if using `fetch-data-node.js`, it automatically saves to:
- `data/games-2025.json`
- `data/teams-2025.json`

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
- **Last Week category**: Automatically updated every Sunday (no manual action needed)
