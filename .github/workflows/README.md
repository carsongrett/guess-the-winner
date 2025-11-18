# GitHub Actions Workflows

## Update Last Week Games

This workflow automatically updates the "last week" games every Sunday at 2 AM UTC.

### Setup Instructions

1. **Add GitHub Secret:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CFBD_API_KEY`
   - Value: Your CFBD API key (the one currently in `fetch-data-node.js`)
   - Click "Add secret"

2. **Grant Workflow Permissions:**
   - Go to Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Save

3. **Test the Workflow:**
   - Go to Actions tab in your repository
   - Select "Update Last Week Games" workflow
   - Click "Run workflow" → "Run workflow" (manual trigger)
   - Verify it completes successfully

### How It Works

- Runs every Sunday at 4 PM UTC (10 AM Central Time)
- Fetches latest games from CFBD API for 2025 season
- Updates `data/games-2025.json` and `data/teams-2025.json`
- Automatically commits and pushes changes if new games are found
- The "last week" category in the app will automatically show the latest week's games

### Manual Trigger

You can also manually trigger this workflow:
- Go to Actions → "Update Last Week Games" → "Run workflow"

