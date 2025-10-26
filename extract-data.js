// Extract teams and games data to separate files
const https = require('https');
const fs = require('fs');

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  seasons: [2024, 2023, 2022, 2021],
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

function normalizeCFBDGame(row, teams) {
  if (!row.homeTeam || !row.awayTeam || row.homePoints == null || row.awayPoints == null || !row.completed) return null;
  
  const teamAName = row.homeTeam;
  const teamBName = row.awayTeam;
  const teamA = resolveTeam(teamAName, row.homePoints, teams);
  const teamB = resolveTeam(teamBName, row.awayPoints, teams);
  const winner = row.homePoints > row.awayPoints ? teamA.abbr : teamB.abbr;
  
  return {
    id: `${row.season}-${row.week}-${teamA.abbr}-${teamB.abbr}`,
    season: row.season,
    date: row.startDate ? row.startDate.slice(0,10) : '',
    teamA, teamB, winner
  };
}

function resolveTeam(name, score, teams) {
  const apiTeam = teams.find(t => t.school === name || t.abbreviation === name);
  
  return {
    name: apiTeam ? apiTeam.school : name,
    abbr: apiTeam ? apiTeam.abbreviation : name.slice(0, 3).toUpperCase(),
    logo: `icons/${(name || '').toLowerCase().replace(/\s+/g, '-')}.png`,
    score
  };
}

async function extractData() {
  try {
    console.log('Fetching teams...');
    const teams = await makeRequest(`${CONFIG.apiBaseUrl}/teams`);
    
    console.log('Fetching games...');
    const allGames = [];
    
    for (const season of CONFIG.seasons) {
      console.log(`Fetching ${season}...`);
      const rawGames = await makeRequest(`${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=regular`);
      const normalizedGames = rawGames.map(game => normalizeCFBDGame(game, teams)).filter(Boolean);
      allGames.push(...normalizedGames);
      
      if (season !== CONFIG.seasons[CONFIG.seasons.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Create teams mapping
    const teamsMapping = {};
    teams.forEach(team => {
      teamsMapping[team.school] = {
        abbr: team.abbreviation,
        logo: `icons/${team.school.toLowerCase().replace(/\s+/g, '-')}.png`
      };
    });
    
    // Save to files
    fs.writeFileSync('teams-output.json', JSON.stringify(teamsMapping, null, 2));
    fs.writeFileSync('games-output.json', JSON.stringify(allGames, null, 2));
    
    console.log(`✅ Data extracted successfully!`);
    console.log(`📁 Teams: ${Object.keys(teamsMapping).length} teams saved to teams-output.json`);
    console.log(`📁 Games: ${allGames.length} games saved to games-output.json`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

extractData();
