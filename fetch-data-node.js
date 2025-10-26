// Data fetcher script - Node.js version with proper error handling
const https = require('https');

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  rateLimitDelay: 1000,
  seasons: [2024, 2023, 2022, 2021],
};

// Make HTTPS request with proper headers
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'User-Agent': 'GuessTheWinner/1.0',
        ...headers
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
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

// Fetch teams from CFBD API
async function fetchTeamsFromCFBD() {
  try {
    console.log('Fetching teams from CFBD API...');
    const url = `${CONFIG.apiBaseUrl}/teams`;
    const teams = await makeRequest(url);
    console.log(`✅ Fetched ${teams.length} teams`);
    return teams;
  } catch (error) {
    console.error(`❌ Error fetching teams: ${error.message}`);
    return [];
  }
}

// Fetch games from CFBD API for a specific season
async function fetchFromCFBD(season = 2023) {
  try {
    console.log(`Fetching games for season ${season}...`);
    const url = `${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=regular`;
    const data = await makeRequest(url);
    console.log(`✅ Fetched ${data.length} raw games for ${season}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching games for ${season}: ${error.message}`);
    return [];
  }
}

// Normalize CFBD game data to our format
function normalizeCFBDGame(row, teams) {
  if (!row.homeTeam || !row.awayTeam || row.homePoints == null || row.awayPoints == null || !row.completed) return null;
  
  const teamAName = row.awayTeam;
  const teamBName = row.homeTeam;
  const teamA = resolveTeam(teamAName, row.awayPoints, teams);
  const teamB = resolveTeam(teamBName, row.homePoints, teams);
  const winner = row.homePoints > row.awayPoints ? teamB.abbr : teamA.abbr;
  
  return {
    id: `${row.season}-${row.week}-${teamA.abbr}-${teamB.abbr}`,
    season: row.season,
    date: row.startDate ? row.startDate.slice(0,10) : '',
    teamA, teamB, winner
  };
}

// Resolve team information
function resolveTeam(name, score, teams) {
  const apiTeam = teams.find(t => t.school === name || t.abbreviation === name);
  
  return {
    name: apiTeam ? apiTeam.school : name,
    abbr: apiTeam ? apiTeam.abbreviation : name.slice(0, 3).toUpperCase(),
    logo: `icons/${(name || '').toLowerCase().replace(/\s+/g, '-')}.png`,
    score
  };
}

// Fetch all seasons with rate limiting
async function fetchAllSeasons(teams) {
  const allGames = [];
  
  for (const season of CONFIG.seasons) {
    const rawGames = await fetchFromCFBD(season);
    const normalizedGames = rawGames.map(game => normalizeCFBDGame(game, teams)).filter(Boolean);
    allGames.push(...normalizedGames);
    
    console.log(`  → Found ${normalizedGames.length} valid games for ${season}`);
    
    // Rate limiting - wait between API calls
    if (season !== CONFIG.seasons[CONFIG.seasons.length - 1]) {
      console.log(`⏳ Waiting ${CONFIG.rateLimitDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));
    }
  }
  
  return allGames;
}

// Main function to fetch and save data
async function fetchAndSaveData() {
  console.log('🚀 Starting data fetch...');
  
  try {
    const teams = await fetchTeamsFromCFBD();
    const games = await fetchAllSeasons(teams);
    
    console.log(`\n📊 Total games fetched: ${games.length}`);
    
    if (games.length > 0) {
      const gamesBySeason = games.reduce((acc, game) => {
        acc[game.season] = (acc[game.season] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Games by season:');
      Object.entries(gamesBySeason).forEach(([season, count]) => {
        console.log(`  ${season}: ${count} games`);
      });
      
      const teamsMapping = {};
      teams.forEach(team => {
        teamsMapping[team.school] = {
          abbr: team.abbreviation,
          logo: `icons/${team.school.toLowerCase().replace(/\s+/g, '-')}.png`
        };
      });
      
      console.log('\n📋 === COPY THIS TO data/teams.json ===');
      console.log(JSON.stringify(teamsMapping, null, 2));
      
      console.log('\n📋 === COPY THIS TO data/games.json ===');
      console.log(JSON.stringify(games, null, 2));
      
      console.log('\n✅ Data fetch complete! Copy the JSON above to your files.');
    } else {
      console.log('❌ No games were fetched. Check your API key and try again.');
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Run the fetch
fetchAndSaveData();
