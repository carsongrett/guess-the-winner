// Script to rename logo files to match API-generated paths
const fs = require('fs');
const path = require('path');

// Read the teams data to get the expected logo paths
const teamsData = JSON.parse(fs.readFileSync('data/teams.json', 'utf8'));

console.log('Renaming logo files to match API-generated paths...');

let renamedCount = 0;
let skippedCount = 0;
let errorCount = 0;

Object.entries(teamsData).forEach(([teamName, teamData]) => {
  const expectedPath = teamData.logo; // e.g., "icons/penn-state.png"
  const actualPath = path.join('icons', path.basename(expectedPath));
  
  // Convert hyphenated name to camelCase to find the actual file
  const fileName = path.basename(expectedPath, '.png'); // e.g., "penn-state"
  const camelCaseName = fileName.split('-').map((part, index) => 
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join(''); // e.g., "pennState"
  
  const actualFile = path.join('icons', `${camelCaseName}.png`);
  
  try {
    // Check if the camelCase file exists
    if (fs.existsSync(actualFile)) {
      // Check if the expected file already exists
      if (fs.existsSync(actualPath)) {
        console.log(`✓ ${path.basename(actualPath)} already exists`);
        skippedCount++;
      } else {
        // Rename the file
        fs.renameSync(actualFile, actualPath);
        console.log(`✓ Renamed: ${path.basename(actualFile)} → ${path.basename(actualPath)}`);
        renamedCount++;
      }
    } else if (fs.existsSync(actualPath)) {
      console.log(`✓ ${path.basename(actualPath)} already exists`);
      skippedCount++;
    } else {
      console.log(`⚠ Missing: ${path.basename(actualPath)} (looked for ${path.basename(actualFile)})`);
      errorCount++;
    }
  } catch (error) {
    console.error(`❌ Error renaming ${path.basename(actualFile)}:`, error.message);
    errorCount++;
  }
});

console.log('\n📊 Summary:');
console.log(`✓ Renamed: ${renamedCount} files`);
console.log(`✓ Already correct: ${skippedCount} files`);
console.log(`⚠ Missing/Errors: ${errorCount} files`);

if (errorCount > 0) {
  console.log('\n🔍 Missing files that need to be addressed:');
  console.log('Check the warnings above for files that couldn\'t be found.');
}
