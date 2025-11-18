// Fix logo mappings in 2025 data files
const fs = require('fs');

// Custom mapping for teams with special naming conventions
const CUSTOM_LOGO_MAP = {
  "Texas A&M": "texasAM.png",
  "Sam Houston": "samHoustonState.png", 
  "Appalachian State": "appalachianState.png",
  "Boston College": "boston.png",
  "Miami (OH)": "miamiOH.png",
  "San José State": "sanJoseState.png",
  "Florida International": "floridaIntl.png",
  "UL Monroe": "louisianaMonroe.png",
  "UTSA": "texasSanAntonio.png",
  "UConn": "connecticut.png",
  "Louisiana": "louisianaLafayette.png",
  "Southern Miss": "southernMississippi.png",
  "Hawai'i": "hawaii.png",
  "UCF": "ucf.png",
  "UAB": "uab.png",
  "BYU": "byu.png",
  "LSU": "lsu.png",
  "Louisiana Tech": "LouisianaTech.png",
  "Louisiana-Lafayette": "louisianaLafayette.png",
  "Louisiana-Monroe": "louisianaMonroe.png",
  "Louisiana Monroe": "louisianaMonroe.png",
  "UL Lafayette": "louisianaLafayette.png",
  "Southern Mississippi": "southernMississippi.png",
  "Miami Ohio": "miamiOH.png",
  "Miami OH": "miamiOH.png",
  "San Jose State": "sanJoseState.png",
  "Connecticut": "connecticut.png",
  "Central Florida": "ucf.png",
  "Alabama-Birmingham": "uab.png",
  "Brigham Young": "byu.png",
  "Louisiana State": "lsu.png"
};

console.log('🔧 Fixing logo mappings in 2025 data files...');

// Read current data
const games = JSON.parse(fs.readFileSync('data/games-2025.json', 'utf8'));
const teams = JSON.parse(fs.readFileSync('data/teams-2025.json', 'utf8'));

let gamesFixed = 0;
let teamsFixed = 0;

// Fix games
games.forEach(game => {
  let fixed = false;
  
  // Fix teamA logo
  if (CUSTOM_LOGO_MAP[game.teamA.name]) {
    const correctLogo = `icons/${CUSTOM_LOGO_MAP[game.teamA.name]}`;
    if (game.teamA.logo !== correctLogo) {
      game.teamA.logo = correctLogo;
      fixed = true;
    }
  }
  
  // Fix teamB logo
  if (CUSTOM_LOGO_MAP[game.teamB.name]) {
    const correctLogo = `icons/${CUSTOM_LOGO_MAP[game.teamB.name]}`;
    if (game.teamB.logo !== correctLogo) {
      game.teamB.logo = correctLogo;
      fixed = true;
    }
  }
  
  if (fixed) gamesFixed++;
});

// Fix teams mapping
Object.keys(teams).forEach(teamName => {
  if (CUSTOM_LOGO_MAP[teamName]) {
    const correctLogo = `icons/${CUSTOM_LOGO_MAP[teamName]}`;
    if (teams[teamName].logo !== correctLogo) {
      teams[teamName].logo = correctLogo;
      teamsFixed++;
    }
  }
});

// Save updated files
fs.writeFileSync('data/games-2025.json', JSON.stringify(games, null, 2));
fs.writeFileSync('data/teams-2025.json', JSON.stringify(teams, null, 2));

console.log(`✅ Fixed ${gamesFixed} games and ${teamsFixed} team entries`);
console.log('\n🔍 Verification (sample teams):');
const sampleTeams = ['Louisiana', 'UL Monroe', 'Southern Miss', 'Miami (OH)', 'Boston College', 'Troy'];
sampleTeams.forEach(team => {
  const game = games.find(g => g.teamA.name === team || g.teamB.name === team);
  if (game) {
    const teamData = game.teamA.name === team ? game.teamA : game.teamB;
    console.log(`  ${team}: ${teamData.logo}`);
  } else if (teams[team]) {
    console.log(`  ${team}: ${teams[team].logo}`);
  }
});

