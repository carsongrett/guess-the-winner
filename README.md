# Guess the Winner

A mobile-first Progressive Web App (PWA) game where players guess the winner of college football games. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **3-Strike System**: Players have 3 strikes before their streak ends
- **Streak Tracking**: Persistent streak and best streak tracking
- **Mobile-First Design**: Optimized for mobile devices with no-scroll layout
- **PWA Support**: Installable as a mobile app
- **Local Data**: Uses JSON files for game data (expandable to API)

## Game Modes

- **Random Mode**: Random games from the database

## File Structure

```
guess-the-winner/
├─ index.html          # Main HTML file
├─ styles.css          # Game styles
├─ script.js           # Game logic
├─ manifest.json       # PWA manifest
├─ service-worker.js   # Service worker for offline support
├─ /data/
│  ├─ games.json       # Game data
│  └─ teams.json       # Team information and logos
├─ /icons/            # Team logos (150x150 PNG)
└─ /icons/            # App icons
```

## Setup

1. Clone the repository
2. Serve the files using a local server (required for PWA features)
3. Open in browser

## Development

- Use Live Server extension in VS Code/Cursor
- Or use any static file server
- PWA features require HTTPS or localhost

## Data Format

### games.json
```json
{
  "id": "unique-game-id",
  "season": 2024,
  "date": "2024-01-01",
  "teamA": { "name": "Team A", "abbr": "TA", "score": 21 },
  "teamB": { "name": "Team B", "abbr": "TB", "score": 14 },
  "winner": "TA"
}
```

### teams.json
```json
{
  "Team Name": { "abbr": "ABBR", "logo": "icons/team.png" }
}
```

## Future Enhancements

- CFBD API integration
- More game modes
- Social sharing features
- Tournament brackets