// Fix specific logo mappings for teams that still aren't working
const fs = require('fs');

// Read current teams data
const teamsData = JSON.parse(fs.readFileSync('data/teams.json', 'utf8'));

console.log('🔧 Fixing specific logo mappings...');

// Specific fixes for the problematic teams
const logoFixes = {
  "Western Michigan": "western-michigan.png",      // was: westernMichigan.png
  "Florida State": "florida-state.png",            // was: floridaState.png  
  "North Carolina": "north-carolina.png",          // was: northCarolina.png
  "Central Michigan": "central-michigan.png",      // was: centralMichigan.png
  "Louisiana Tech": "LouisianaTech.png",           // was: LouisianaTech.png (this one is correct)
  "North Texas": "north-texas.png",                // was: northTexas.png
  "Northern Illinois": "northern-illinois.png",     // was: northernIllinois.png
  "South Florida": "south-florida.png",            // was: southFlorida.png
  "Western Kentucky": "western-kentucky.png"      // was: westernKentucky.png
};

let fixedCount = 0;

Object.entries(logoFixes).forEach(([teamName, correctLogo]) => {
  if (teamsData[teamName]) {
    const oldLogo = teamsData[teamName].logo;
    teamsData[teamName].logo = `icons/${correctLogo}`;
    console.log(`✓ Fixed ${teamName}: ${oldLogo} → icons/${correctLogo}`);
    fixedCount++;
  } else {
    console.log(`⚠ Team not found: ${teamName}`);
  }
});

// Save updated teams data
fs.writeFileSync('data/teams.json', JSON.stringify(teamsData, null, 2));

console.log(`\n✅ Fixed ${fixedCount} logo mappings!`);

// Verify the fixes
console.log('\n🔍 Verification:');
Object.entries(logoFixes).forEach(([teamName, correctLogo]) => {
  if (teamsData[teamName]) {
    console.log(`  ${teamName}: ${teamsData[teamName].logo}`);
  }
});
