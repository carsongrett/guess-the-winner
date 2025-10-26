// Comprehensive logo mapping script
const fs = require('fs');
const https = require('https');

const CONFIG = {
  apiKey: 'AYkI+Yu/PHFp5lbWxTjrAjN0q4DFidrdJgSoiGvPXve807qSdw0BJ6c08Vf0kFcN',
  apiBaseUrl: 'https://api.collegefootballdata.com',
  seasons: [2024, 2023, 2022, 2021],
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
  
  // Use custom mapping if available, otherwise generate standard path
  let logoPath;
  if (CUSTOM_LOGO_MAP[name]) {
    logoPath = `icons/${CUSTOM_LOGO_MAP[name]}`;
  } else {
    logoPath = `icons/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  }
  
  return {
    name: apiTeam ? apiTeam.school : name,
    abbr: apiTeam ? apiTeam.abbreviation : name.slice(0, 3).toUpperCase(),
    logo: logoPath,
    score
  };
}

async function fetchAllSeasons(teams) {
  const allGames = [];
  
  for (const season of CONFIG.seasons) {
    console.log(`Fetching games for season ${season}...`);
    const rawGames = await makeRequest(`${CONFIG.apiBaseUrl}/games?year=${season}&seasonType=regular`);
    const normalizedGames = rawGames.map(game => normalizeCFBDGame(game, teams)).filter(Boolean);
    allGames.push(...normalizedGames);
    
    console.log(`  → Found ${normalizedGames.length} valid games for ${season}`);
    
    if (season !== CONFIG.seasons[CONFIG.seasons.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allGames;
}

async function regenerateDataWithCorrectLogos() {
  try {
    console.log('🔄 Regenerating data with correct logo mappings...');
    
    // Fetch teams from API
    const teams = await makeRequest(`${CONFIG.apiBaseUrl}/teams`);
    console.log(`✅ Fetched ${teams.length} teams from API`);
    
    // Fetch games
    const games = await fetchAllSeasons(teams);
    console.log(`✅ Fetched ${games.length} games`);
    
    // Create teams mapping with correct logo paths
    const teamsMapping = {};
    teams.forEach(team => {
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
    });
    
    // Save updated data
    fs.writeFileSync('data/teams.json', JSON.stringify(teamsMapping, null, 2));
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));
    
    console.log('✅ Data regenerated with correct logo mappings!');
    console.log(`📁 Teams: ${Object.keys(teamsMapping).length} teams`);
    console.log(`📁 Games: ${games.length} games`);
    
    // Verify some key teams
    console.log('\n🔍 Logo path verification:');
    const keyTeams = ['Texas A&M', 'Sam Houston', 'Appalachian State', 'Boston College', 'Miami (OH)', 'San José State'];
    keyTeams.forEach(team => {
      if (teamsMapping[team]) {
        console.log(`  ${team}: ${teamsMapping[team].logo}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

regenerateDataWithCorrectLogos();
