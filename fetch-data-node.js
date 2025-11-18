// Data fetcher script - Node.js version with proper error handling
const https = require('https');

const CONFIG = {
  apiKey: process.env.CFBD_API_KEY || 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  rateLimitDelay: 1000,
  seasons: [2025], // Fetch 2025 season data
};

// Custom mapping for teams with special naming conventions
const CUSTOM_LOGO_MAP = {
  // Teams with special characters or unique naming
  "Texas A&M": "texasAM.png",
  "Sam Houston": "samHoustonState.png", 
  "Appalachian State": "appalachianState.png",
  "Boston College": "boston.png",
  "Miami (OH)": "miamiOH.png",
  "San José State": "sanJoseState.png",
  "Florida International": "floridaIntl.png",
  "North Carolina A&T": "northCarolinaAT.png",
  "Texas A&M-Commerce": "texasAMCommerce.png",
  "UT Martin": "tennesseeMartin.png",
  "UCF": "ucf.png",
  "UAB": "uab.png",
  "BYU": "byu.png",
  "LSU": "lsu.png",
  "Hawai'i": "hawaii.png",
  "Southern Miss": "southernMississippi.png",
  "UL Monroe": "louisianaMonroe.png",
  "UTSA": "texasSanAntonio.png",
  "UConn": "connecticut.png",
  
  // Additional mappings for consistency
  "Louisiana": "louisianaLafayette.png",
  "App State": "appalachianState.png",
  "Miami Ohio": "miamiOH.png",
  "San Jose State": "sanJoseState.png",
  "Florida A&M": "floridaAM.png",
  "North Carolina Central": "northCarolinaCentral.png",
  "Texas Southern": "texasSouthern.png",
  "Southern Illinois": "southernIllinois.png",
  "Eastern Illinois": "easternIllinois.png",
  "Eastern Kentucky": "easternKentucky.png",
  "Eastern Michigan": "easternMichigan.png",
  "Eastern Washington": "easternWashington.png",
  "Northern Arizona": "northernArizona.png",
  "Northern Colorado": "northernColorado.png",
  "Northern Illinois": "northernIllinois.png",
  "Northern Iowa": "northernIowa.png",
  "Southern Utah": "southernUtah.png",
  "Western Carolina": "westernCarolina.png",
  "Western Illinois": "westernIllinois.png",
  "Western Kentucky": "westernKentucky.png",
  "Western Michigan": "westernMichigan.png",
  "Middle Tennessee": "middleTennessee.png",
  "Central Michigan": "centralMichigan.png",
  "Central Arkansas": "centralArkansas.png",
  "Central Connecticut": "centralConnecticut.png",
  "South Alabama": "southAlabama.png",
  "South Carolina": "southCarolina.png",
  "South Carolina State": "southCarolinaState.png",
  "South Dakota": "southDakota.png",
  "South Dakota State": "southDakotaState.png",
  "South Florida": "southFlorida.png",
  "Southeast Missouri State": "southeastMissouriState.png",
  "Southeastern Louisiana": "southeasternLouisiana.png",
  "North Dakota": "northDakota.png",
  "North Dakota State": "northDakotaState.png",
  "North Carolina": "northCarolina.png",
  "North Carolina A&T": "northCarolinaAT.png",
  "North Carolina Central": "northCarolinaCentral.png",
  "North Texas": "northTexas.png",
  "Northwestern": "northwestern.png",
  "Northwestern State": "northwesternState.png",
  "Louisiana Tech": "LouisianaTech.png",
  "Louisiana-Lafayette": "louisianaLafayette.png",
  "Louisiana-Monroe": "louisianaMonroe.png",
  "Louisiana Monroe": "louisianaMonroe.png",
  "UL Lafayette": "louisianaLafayette.png",
  "UL Monroe": "louisianaMonroe.png",
  "UT Martin": "tennesseeMartin.png",
  "UTEP": "utep.png",
  "UTSA": "texasSanAntonio.png",
  "Texas San Antonio": "texasSanAntonio.png",
  "Texas A&M": "texasAM.png",
  "Texas A&M-Commerce": "texasAMCommerce.png",
  "Texas Southern": "texasSouthern.png",
  "Texas State": "texasState.png",
  "Texas Tech": "texasTech.png",
  "San Diego": "sanDiego.png",
  "San Diego State": "san-diego-state.png",
  "San Jose State": "sanJoseState.png",
  "San José State": "sanJoseState.png",
  "Miami": "miami.png",
  "Miami (OH)": "miamiOH.png",
  "Miami Ohio": "miamiOH.png",
  "Miami OH": "miamiOH.png",
  "Florida A&M": "floridaAM.png",
  "Florida Atlantic": "floridaAtlantic.png",
  "Florida International": "floridaIntl.png",
  "Florida State": "floridaState.png",
  "Florida Tech": "floridaTech.png",
  "Appalachian State": "appalachianState.png",
  "App State": "appalachianState.png",
  "Sam Houston": "samHoustonState.png",
  "Sam Houston State": "samHoustonState.png",
  "Boston College": "boston.png",
  "Boston University": "boston.png",
  "Hawai'i": "hawaii.png",
  "Hawaii": "hawaii.png",
  "Southern Miss": "southernMississippi.png",
  "Southern Mississippi": "southernMississippi.png",
  "UConn": "connecticut.png",
  "Connecticut": "connecticut.png",
  "UCF": "ucf.png",
  "Central Florida": "ucf.png",
  "UAB": "uab.png",
  "Alabama-Birmingham": "uab.png",
  "BYU": "byu.png",
  "Brigham Young": "byu.png",
  "LSU": "lsu.png",
  "Louisiana State": "lsu.png"
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
  
  // Use custom mapping if available, otherwise generate standard path
  let logoPath;
  if (CUSTOM_LOGO_MAP[name]) {
    logoPath = `icons/${CUSTOM_LOGO_MAP[name]}`;
  } else {
    logoPath = `icons/${(name || '').toLowerCase().replace(/\s+/g, '-')}.png`;
  }
  
  return {
    name: apiTeam ? apiTeam.school : name,
    abbr: apiTeam ? apiTeam.abbreviation : name.slice(0, 3).toUpperCase(),
    logo: logoPath,
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
    
    // Generate teams mapping with correct logo paths
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
    
    // Also add teams from API that might not be in games yet
    teams.forEach(team => {
      if (!teamsMapping[team.school]) {
        let logoPath;
        if (CUSTOM_LOGO_MAP[team.school]) {
          logoPath = `icons/${CUSTOM_LOGO_MAP[team.school]}`;
        } else {
          logoPath = `icons/${team.school.toLowerCase().replace(/\s+/g, '-')}.png`;
        }
        teamsMapping[team.school] = {
          abbr: team.abbreviation,
          logo: logoPath
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
