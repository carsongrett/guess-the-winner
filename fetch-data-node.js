// Data fetcher script - Node.js version with proper error handling
const https = require('https');

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  rateLimitDelay: 1000,
  seasons: [2025], // Fetch 2025 season data
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
    
    // Try fetching different weeks to see what's available
    const allGames = [];
    
    // Fetch regular season games
    const regularUrl = `${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=regular`;
    const regularGames = await makeRequest(regularUrl);
    console.log(`✅ Fetched ${regularGames.length} regular season games for ${season}`);
    allGames.push(...regularGames);
    
    // Fetch postseason games
    const postseasonUrl = `${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=postseason`;
    const postseasonGames = await makeRequest(postseasonUrl);
    console.log(`✅ Fetched ${postseasonGames.length} postseason games for ${season}`);
    allGames.push(...postseasonGames);
    
    // Try fetching by specific weeks to see what's available
    if (season === 2025) {
      console.log('🔍 Checking available weeks for 2025...');
      for (let week = 1; week <= 15; week++) {
        try {
          const weekUrl = `${CONFIG.apiBaseUrl}/games?year=${season}&week=${week}&seasonType=regular`;
          const weekGames = await makeRequest(weekUrl);
          if (weekGames.length > 0) {
            console.log(`  Week ${week}: ${weekGames.length} games`);
            allGames.push(...weekGames);
          }
        } catch (error) {
          // Week might not exist, continue
        }
      }
    }
    
    // Remove duplicates based on game ID
    const uniqueGames = allGames.filter((game, index, self) => 
      index === self.findIndex(g => g.id === game.id)
    );
    
    console.log(`✅ Total unique games: ${uniqueGames.length} for ${season}`);
    
    return uniqueGames;
  } catch (error) {
    console.error(`❌ Error fetching games for ${season}: ${error.message}`);
    return [];
  }
}

// Normalize CFBD game data to our format
function normalizeCFBDGame(row, teams) {
  if (!row.homeTeam || !row.awayTeam || row.homePoints == null || row.awayPoints == null) return null;
  
  // Only include FBS teams
  if (row.homeClassification !== 'fbs' || row.awayClassification !== 'fbs') return null;
  
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
    // Fetch teams
    const teams = await fetchTeamsFromCFBD();
    if (teams.length === 0) {
      console.log('❌ No teams fetched, exiting');
      return;
    }
    
    // Fetch games for all seasons
    const allGames = [];
    for (const season of CONFIG.seasons) {
      const games = await fetchFromCFBD(season);
      const normalizedGames = games
        .map(row => normalizeCFBDGame(row, teams))
        .filter(g => g !== null);
      
      console.log(`✅ ${season}: ${normalizedGames.length} valid games`);
      allGames.push(...normalizedGames);
      
      // Rate limiting
      if (season !== CONFIG.seasons[CONFIG.seasons.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));
      }
    }
    
    console.log(`\n🎯 Total games: ${allGames.length}`);
    
    // Generate teams mapping
    const teamsMapping = {};
    allGames.forEach(game => {
      if (!teamsMapping[game.teamA.name]) {
        teamsMapping[game.teamA.name] = {
          abbr: game.teamA.abbr,
          logo: game.teamA.logo
        };
      }
      if (!teamsMapping[game.teamB.name]) {
        teamsMapping[game.teamB.name] = {
          abbr: game.teamB.abbr,
          logo: game.teamB.logo
        };
      }
    });
    
    // Save to files
    const fs = require('fs');
    fs.writeFileSync('data/games-2025.json', JSON.stringify(allGames, null, 2));
    fs.writeFileSync('data/teams-2025.json', JSON.stringify(teamsMapping, null, 2));
    
    console.log('\n✅ Files saved:');
    console.log('  - data/games-2025.json');
    console.log('  - data/teams-2025.json');
    
    // Show week distribution
    const weeks = {};
    allGames.forEach(game => {
      const week = game.id.split('-')[1];
      weeks[week] = (weeks[week] || 0) + 1;
    });
    
    console.log('\n📊 Week distribution:');
    Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b)).forEach(week => {
      console.log(`  Week ${week}: ${weeks[week]} games`);
    });
    
    console.log(`\n🏈 Total FBS teams: ${Object.keys(teamsMapping).length}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Run the fetch
fetchAndSaveData();
