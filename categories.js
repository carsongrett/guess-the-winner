// Category configuration for CFB timeframes
const CATEGORIES = {
  'cfb-2021-2024': {
    name: 'College Football 2021-2024',
    description: 'Recent seasons with complete data',
    icon: '🏈',
    dataFile: 'data/games.json',
    teamsFile: 'data/teams.json',
    available: true
  },
  'cfb-2025': {
    name: 'College Football 2025',
    description: 'Upcoming 2025 season',
    icon: '🏈',
    dataFile: 'data/games-2025.json',
    teamsFile: 'data/teams-2025.json',
    available: false // Will be available when we add 2025 data
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CATEGORIES;
}
