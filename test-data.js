// Quick test to see game data structure
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

async function testData() {
  try {
    const data = await makeRequest(`${CONFIG.apiBaseUrl}/games?year=2024&seasonType=regular`);
    console.log('Sample game data:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\nChecking for completed games...');
    const completedGames = data.filter(game => 
      game.home_points !== null && 
      game.away_points !== null &&
      game.completed === true
    );
    console.log(`Found ${completedGames.length} completed games out of ${data.length} total games`);
    
    if (completedGames.length > 0) {
      console.log('\nSample completed game:');
      console.log(JSON.stringify(completedGames[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testData();
