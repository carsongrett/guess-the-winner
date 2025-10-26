// Filter data to only include FBS teams
const fs = require('fs');

// Read the current data files
const teamsData = JSON.parse(fs.readFileSync('data/teams.json', 'utf8'));
const gamesData = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));

console.log(`Original data: ${Object.keys(teamsData).length} teams, ${gamesData.length} games`);

// We need to get the team classifications from the API
const https = require('https');

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function filterToFBS() {
  try {
    console.log('Fetching team classifications...');
    const apiTeams = await makeRequest(`${CONFIG.apiBaseUrl}/teams`);
    
    // Create a map of team names to classifications
    const teamClassifications = {};
    apiTeams.forEach(team => {
      teamClassifications[team.school] = team.classification;
    });
    
    // Filter teams to only FBS
    const fbsTeams = {};
    Object.entries(teamsData).forEach(([teamName, teamData]) => {
      const classification = teamClassifications[teamName];
      if (classification === 'fbs') {
        fbsTeams[teamName] = teamData;
      }
    });
    
    console.log(`FBS teams found: ${Object.keys(fbsTeams).length}`);
    
    // Filter games to only include FBS teams
    const fbsGames = gamesData.filter(game => {
      const teamAClassification = teamClassifications[game.teamA.name];
      const teamBClassification = teamClassifications[game.teamB.name];
      return teamAClassification === 'fbs' && teamBClassification === 'fbs';
    });
    
    console.log(`FBS games found: ${fbsGames.length}`);
    
    // Save filtered data
    fs.writeFileSync('data/teams.json', JSON.stringify(fbsTeams, null, 2));
    fs.writeFileSync('data/games.json', JSON.stringify(fbsGames, null, 2));
    
    console.log('✅ Data filtered to FBS teams only!');
    console.log(`📁 Teams: ${Object.keys(fbsTeams).length} FBS teams`);
    console.log(`📁 Games: ${fbsGames.length} FBS games`);
    
    // Show some examples
    console.log('\nSample FBS teams:');
    Object.keys(fbsTeams).slice(0, 10).forEach(team => {
      console.log(`  - ${team} (${fbsTeams[team].abbr})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

filterToFBS();
