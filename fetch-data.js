// Data fetcher script - Run this once to populate local data
// This script fetches data from CFBD API and saves it to local JSON files

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  rateLimitDelay: 1000, // 1 second between API calls
  seasons: [2024, 2023, 2022, 2021], // 2021-2024 data
};

// Fetch teams from CFBD API
async function fetchTeamsFromCFBD() {
  try {
    const headers = { 
      'accept': 'application/json', 
      'x-api-key': CONFIG.apiKey 
    };
    const url = `${CONFIG.apiBaseUrl}/teams`;
    const res = await fetch(url, { headers });
    
    if (!res.ok) {
      throw new Error(`Teams API request failed: ${res.status} ${res.statusText}`);
    }
    
    const teams = await res.json();
    console.log(`Fetched ${teams.length} teams from CFBD API`);
    return teams;
  } catch (error) {
    console.error('Error fetching teams from CFBD API:', error);
    return [];
  }
}

// Fetch games from CFBD API for a specific season
async function fetchFromCFBD(season = 2023) {
  try {
    const headers = { 
      'accept': 'application/json', 
      'x-api-key': CONFIG.apiKey 
    };
    const url = `${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=regular`;
    const res = await fetch(url, { headers });
    
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching CFBD data for season ${season}:`, error);
    return [];
  }
}

// Normalize CFBD game data to our format
function normalizeCFBDGame(row, teams) {
  if (!row.home_team || !row.away_team || row.home_points == null || row.away_points == null) return null;
  
  const teamAName = row.home_team;
  const teamBName = row.away_team;
  const teamA = resolveTeam(teamAName, row.home_points, teams);
  const teamB = resolveTeam(teamBName, row.away_points, teams);
  const winner = row.home_points > row.away_points ? teamA.abbr : teamB.abbr;
  
  return {
    id: `${row.season}-${row.week}-${teamA.abbr}-${teamB.abbr}`,
    season: row.season,
    date: row.start_date ? row.start_date.slice(0,10) : '',
    teamA, teamB, winner
  };
}

// Resolve team information
function resolveTeam(name, score, teams) {
  // Try to find team in API teams data
  const apiTeam = teams.find(t => t.name === name || t.abbreviation === name);
  
  return {
    name: apiTeam ? apiTeam.name : name,
    abbr: apiTeam ? apiTeam.abbreviation : name.slice(0, 3).toUpperCase(),
    logo: `icons/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    score
  };
}

// Fetch all seasons with rate limiting
async function fetchAllSeasons(teams) {
  const allGames = [];
  
  for (const season of CONFIG.seasons) {
    console.log(`Fetching games for season ${season}...`);
    const rawGames = await fetchFromCFBD(season);
    const normalizedGames = rawGames.map(game => normalizeCFBDGame(game, teams)).filter(Boolean);
    allGames.push(...normalizedGames);
    
    console.log(`  → Found ${normalizedGames.length} games for ${season}`);
    
    // Rate limiting - wait between API calls
    if (season !== CONFIG.seasons[CONFIG.seasons.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));
    }
  }
  
  return allGames;
}

// Main function to fetch and save data
async function fetchAndSaveData() {
  console.log('Starting data fetch...');
  
  try {
    // Fetch teams first
    const teams = await fetchTeamsFromCFBD();
    
    // Fetch all games
    const games = await fetchAllSeasons(teams);
    
    console.log(`\nTotal games fetched: ${games.length}`);
    console.log(`Games by season:`);
    const gamesBySeason = games.reduce((acc, game) => {
      acc[game.season] = (acc[game.season] || 0) + 1;
      return acc;
    }, {});
    Object.entries(gamesBySeason).forEach(([season, count]) => {
      console.log(`  ${season}: ${count} games`);
    });
    
    // Create teams mapping for our app
    const teamsMapping = {};
    teams.forEach(team => {
      teamsMapping[team.name] = {
        abbr: team.abbreviation,
        logo: `icons/${team.name.toLowerCase().replace(/\s+/g, '-')}.png`
      };
    });
    
    // Save data (you'll need to copy this output to your files)
    console.log('\n=== TEAMS.JSON ===');
    console.log(JSON.stringify(teamsMapping, null, 2));
    
    console.log('\n=== GAMES.JSON ===');
    console.log(JSON.stringify(games, null, 2));
    
    console.log('\n✅ Data fetch complete! Copy the JSON output above to your files.');
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Run the fetch
fetchAndSaveData();
