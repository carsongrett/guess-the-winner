/* Guess the Winner – CFB-only, local JSON first, API later. 3-strike score system.
   Data format aligns to /data/games.json and /data/teams.json.
*/

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dataSource: 'local',   // Switch back to local since we'll have the data
  maxStrikes: 3
};

// Category management
let currentCategory = 'cfb-2021-2024'; // Default category

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const els = {
  scoreChip: document.getElementById('scoreChip'),
  bestChip: document.getElementById('bestChip'),
  accuracyChip: document.getElementById('accuracyChip'),
  subtitle: document.getElementById('subtitle'),
  btnA: document.getElementById('btnA'),
  btnB: document.getElementById('btnB'),
  scoreA: document.getElementById('scoreA'),
  scoreB: document.getElementById('scoreB'),
  resultRow: document.getElementById('resultRow'),
  nextBtn: document.getElementById('nextBtn'),
  strikeDots: [
    document.getElementById('strike1'), 
    document.getElementById('strike2'), 
    document.getElementById('strike3')
  ],
  welcomeModal: document.getElementById('welcomeModal'),
  startGameBtn: document.getElementById('startGameBtn'),
  gameOverText: document.getElementById('gameOverText'),
  resetBtn: document.getElementById('resetBtn'),
  shareBtn: document.getElementById('shareBtn'),
  howBtn: document.getElementById('howBtn'),
  categoryBtns: document.querySelectorAll('.category-btn'),
  footnote: document.getElementById('footnote'),
  categoryToggle: document.getElementById('categoryToggle'),
  categoryDropdown: document.getElementById('categoryDropdown'),
  currentCategoryName: document.getElementById('currentCategoryName'),
  categoryOptions: document.querySelectorAll('.category-option'),
  // Game Over Modal elements
  gameOverModal: document.getElementById('gameOverModal'),
  finalScore: document.getElementById('finalScore'),
  bestScoreDisplay: document.getElementById('bestScoreDisplay'),
  accuracyDisplay: document.getElementById('accuracyDisplay'),
  shareScoreBtn: document.getElementById('shareScoreBtn'),
  playAgainBtn: document.getElementById('playAgainBtn'),
  modalCloseBtn: document.getElementById('modalCloseBtn')
};

// ============================================================================
// GAME STATE
// ============================================================================

const state = {
  games: [],
  teams: {},
  current: null,
  seenIds: new Set(),
  roundsPlayed: 0,
  answering: false
};

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

const LS = {
  get(key, fallback) {
    try { 
      const v = localStorage.getItem(key); 
      return v ? JSON.parse(v) : fallback; 
    } catch { 
      return fallback; 
    }
  },
  set(key, val) { 
    localStorage.setItem(key, JSON.stringify(val)); 
  }
};

// ============================================================================
// GAME STATISTICS
// ============================================================================

let score = LS.get('gtw.score', 0);
let bestScore = LS.get('gtw.best', 0);
let strikes = 0; // Session-only, not stored in localStorage
let gamesPlayed = LS.get('gtw.played', 0);
let correctCount = LS.get('gtw.correct', 0);

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function updateHeader() {
  els.scoreChip.textContent = `Score: ${score}`;
  els.bestChip.textContent = `Best: ${bestScore}`;
  const acc = gamesPlayed ? Math.round((correctCount / gamesPlayed) * 100) : 0;
  els.accuracyChip.textContent = `Acc: ${acc}%`;
  
  els.strikeDots.forEach((dot, idx) => {
    dot.classList.toggle('filled', idx < strikes);
    dot.classList.toggle('empty', idx >= strikes);
  });
}

function saveStats() {
  LS.set('gtw.score', score);
  LS.set('gtw.best', bestScore);
  // strikes is session-only, not stored in localStorage
  LS.set('gtw.played', gamesPlayed);
  LS.set('gtw.correct', correctCount);
}

function boundNoScroll() {
  // Keep focus inside main card to avoid virtual keyboard scrolling; basic guard.
  document.activeElement?.blur?.();
}

function renderTeamButton(btn, team) {
  btn.innerHTML = `
    <div class="team-logo">
      ${team.logo 
        ? `<img src="${team.logo}" alt="${team.name} logo" width="64" height="64" />` 
        : `<span>${team.abbr || team.name.slice(0,3).toUpperCase()}</span>`
      }
    </div>
    <div class="team-name">${team.name}</div>
  `;
}

function setButtonsEnabled(enabled) {
  els.btnA.disabled = !enabled;
  els.btnB.disabled = !enabled;
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function renderGame(game) {
  state.current = game;
  state.answering = true;
  els.resultRow.hidden = true;
  els.nextBtn.hidden = true;
  
  // Clear any result classes from previous game
  els.resultRow.classList.remove('correct', 'wrong');
  
  // Hide Game Over text when starting new game
  els.gameOverText.hidden = true;
  
  // Hide Game Over modal when starting new game
  els.gameOverModal.hidden = true;
  
  setButtonsEnabled(true);
  boundNoScroll();

  renderTeamButton(els.btnA, game.teamA);
  renderTeamButton(els.btnB, game.teamB);
  
  // Reset score boxes
  els.scoreA.textContent = '--';
  els.scoreB.textContent = '--';
  els.scoreA.className = 'score-box';
  els.scoreB.className = 'score-box';

  els.subtitle.textContent = formatDate(game.date, game.id);

  els.btnA.onclick = () => handleGuess(game.teamA.abbr);
  els.btnB.onclick = () => handleGuess(game.teamB.abbr);
}

function handleGuess(choiceAbbr) {
  if (!state.answering) return;
  state.answering = false;
  setButtonsEnabled(false);

  const g = state.current;
  const correct = (choiceAbbr === g.winner);
  gamesPlayed++;
  
  if (correct) {
    score++;
    correctCount++;
    bestScore = Math.max(bestScore, score);
  } else {
    strikes++;
  if (strikes >= CONFIG.maxStrikes) {
    // Show game over text immediately
    els.gameOverText.hidden = false;
    // Delay Game Over modal by 1 second so user can see the last result
    setTimeout(() => {
      showGameOverModal();
    }, 1000);
  }
  }

  saveStats();
  updateHeader();
  showResult(correct, g);
}

function showResult(correct, g) {
  els.resultRow.hidden = false;
  
  // Populate score boxes with digital score bug
  els.scoreA.textContent = g.teamA.score;
  els.scoreB.textContent = g.teamB.score;
  
  // Apply winner/loser styling
  if (g.winner === g.teamA.abbr) {
    els.scoreA.classList.add('winner');
    els.scoreB.classList.add('loser');
  } else {
    els.scoreA.classList.add('loser');
    els.scoreB.classList.add('winner');
  }
  
  // Clear any existing result classes
  els.resultRow.classList.remove('correct', 'wrong');
  
  // Set text content
  els.resultRow.textContent = correct
    ? `Correct! ${winnerName(g)} won ${g.teamA.score}-${g.teamB.score}`
    : `Wrong — ${winnerName(g)} won ${g.teamA.score}-${g.teamB.score}`;
  
  // Add appropriate CSS class for color
  els.resultRow.classList.add(correct ? 'correct' : 'wrong');
  
  els.nextBtn.hidden = false;
  
  // Change button text based on whether Game Over is shown
  if (els.gameOverText.hidden) {
    els.nextBtn.textContent = 'Next';
  } else {
    els.nextBtn.textContent = 'New Game';
  }
  
  els.nextBtn.onclick = () => nextGame();
}

function winnerName(g) {
  return g.winner === g.teamA.abbr ? g.teamA.name : g.teamB.name;
}

function nextGame() {
  const next = pickNextGame();
  if (!next) {
    // Reset session memory to allow repeats
    state.seenIds.clear();
  }
  renderGame(next || randomFromArray(state.games));
}

function pickNextGame() {
  const pool = state.games.filter(g => !state.seenIds.has(g.id));
  if (pool.length === 0) return null;
  const g = randomFromArray(pool);
  state.seenIds.add(g.id);
  return g;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================================
// GAME CONTROL FUNCTIONS
// ============================================================================

function restart() {
  score = 0;
  strikes = 0;
  state.seenIds.clear();
  saveStats();
  updateHeader();
  renderGame(pickNextGame() || randomFromArray(state.games));
}

function resetGame() {
  // Clear all localStorage data
  localStorage.removeItem('gtw.score');
  localStorage.removeItem('gtw.best');
  // strikes is session-only, no need to remove from localStorage
  localStorage.removeItem('gtw.played');
  localStorage.removeItem('gtw.correct');
  
  // Reset all stats
  score = 0;
  bestScore = 0;
  strikes = 0;
  gamesPlayed = 0;
  correctCount = 0;
  
  // Clear seen games
  state.seenIds.clear();
  
  // Update UI
  updateHeader();
  
  // Start fresh game
  renderGame(pickNextGame() || randomFromArray(state.games));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(iso, gameId = null) {
  // yyyy-mm-dd -> Mon DD, YYYY
  if (!iso) return '';
  const d = new Date(iso);
  if (String(d) === 'Invalid Date') return iso;
  
  const dateStr = d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  // Extract week number from game ID if provided
  if (gameId) {
    const weekMatch = gameId.match(/^\d{4}-(\d+)-/);
    if (weekMatch) {
      const week = weekMatch[1];
      return `${dateStr} - Week ${week}`;
    }
  }
  
  return dateStr;
}

function dateHash(yyyymmdd) {
  let h = 0;
  for (let i = 0; i < yyyymmdd.length; i++) {
    h = (h * 31 + yyyymmdd.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ============================================================================
// SOCIAL & HELP FUNCTIONS
// ============================================================================

function shareScore() {
  const url = location.href;
  const text = `I scored ${score} points on Guess the Winner!`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, '_blank', 'noopener,noreferrer');
}

function howTo() {
  alert('Historical CFB games will display. Tap the team that won. You get 3 strikes before your score resets.');
}

function showWelcome() {
  els.welcomeModal.hidden = false;
}

function hideWelcome() {
  els.welcomeModal.hidden = true;
}

function startGame() {
  // Load data for selected category first
  loadCategoryData(currentCategory).then(() => {
    hideWelcome();
    if (state.games.length > 0) {
      renderGame(pickNextGame() || randomFromArray(state.games));
    } else {
      showError('No games available to play');
    }
  }).catch(error => {
    console.error('Error loading category data:', error);
    showError('Error loading game data');
  });
}

// Category selection functions
function selectCategory(categoryId) {
  // Remove selected class from all buttons
  els.categoryBtns.forEach(btn => btn.classList.remove('selected'));
  
  // Add selected class to clicked button
  const selectedBtn = document.querySelector(`[data-category="${categoryId}"]`);
  if (selectedBtn && !selectedBtn.classList.contains('disabled')) {
    selectedBtn.classList.add('selected');
    currentCategory = categoryId;
    
    // Update header switcher
    const category = CATEGORIES[categoryId];
    if (categoryId === 'cfb-last-week') {
      els.currentCategoryName.textContent = 'Last Week';
    } else {
      els.currentCategoryName.textContent = category.name.split(' ').pop();
    }
    
    // Enable start button
    els.startGameBtn.disabled = false;
    els.startGameBtn.textContent = 'Play Now';
  }
}

function loadCategoryData(categoryId) {
  const category = CATEGORIES[categoryId];
  if (!category || !category.available) {
    console.error('Category not available:', categoryId);
    return;
  }
  
  // Update footnote based on category
  if (categoryId === 'cfb-2021-2024') {
    els.footnote.textContent = 'Games from 2021-2024.';
  } else if (categoryId === 'cfb-2025') {
    els.footnote.textContent = 'Games from 2025 season.';
  } else if (categoryId === 'cfb-last-week') {
    // Will update after loading games to show week number
    els.footnote.textContent = 'Loading latest week...';
  }
  
  // Load games and teams data for the selected category
  return Promise.all([
    fetch(category.dataFile).then(r => r.json()),
    fetch(category.teamsFile).then(r => r.json())
  ]).then(([games, teams]) => {
    // Filter to latest week if needed
    if (category.filterLatestWeek) {
      const filteredGames = filterLatestWeekGames(games);
      state.games = filteredGames.games;
      if (filteredGames.week) {
        els.footnote.textContent = `Games from Week ${filteredGames.week}.`;
      }
    } else {
      state.games = games;
    }
    state.teams = teams;
    console.log(`Loaded ${state.games.length} games for ${category.name}`);
  });
}

function filterLatestWeekGames(games) {
  // Find the highest week number in the games
  let maxWeek = 0;
  games.forEach(game => {
    const match = game.id.match(/^2025-(\d+)-/);
    if (match) {
      const week = parseInt(match[1], 10);
      if (week > maxWeek) {
        maxWeek = week;
      }
    }
  });
  
  // Filter games to only include that week
  const filtered = games.filter(game => {
    const match = game.id.match(/^2025-(\d+)-/);
    return match && parseInt(match[1], 10) === maxWeek;
  });
  
  return { games: filtered, week: maxWeek };
}

// Category switcher functions
function toggleCategoryDropdown() {
  const isOpen = !els.categoryDropdown.hidden;
  els.categoryDropdown.hidden = isOpen;
  els.categoryToggle.classList.toggle('open', !isOpen);
}

function switchCategory(categoryId) {
  const category = CATEGORIES[categoryId];
  if (!category || !category.available) {
    console.error('Category not available:', categoryId);
    return;
  }
  
  // Update current category
  currentCategory = categoryId;
  
  // Update UI
  if (categoryId === 'cfb-last-week') {
    els.currentCategoryName.textContent = 'Last Week';
  } else {
    els.currentCategoryName.textContent = category.name.split(' ').pop(); // Get last part (e.g., "2021-2024")
  }
  
  // Update selected state in dropdown
  els.categoryOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.category === categoryId) {
      option.classList.add('selected');
    }
  });
  
  // Close dropdown
  els.categoryDropdown.hidden = true;
  els.categoryToggle.classList.remove('open');
  
  // Load new category data and start new game
  loadCategoryData(categoryId).then(() => {
    // Reset game state for new category (treat as new game)
    state.seenIds.clear();
    score = 0; // Reset current score
    strikes = 0; // Reset strikes
    updateHeader(); // Update UI to show reset values
    renderGame(pickNextGame() || randomFromArray(state.games));
  }).catch(error => {
    console.error('Error switching category:', error);
    showError('Error loading new category');
  });
}

function showError(message) {
  els.subtitle.textContent = message;
  els.subtitle.style.color = '#F44336'; // Red color for error
  els.btnA.disabled = true;
  els.btnB.disabled = true;
  els.resultRow.hidden = true;
  els.nextBtn.hidden = true;
}

function showGameOverModal() {
  // Update modal content with current stats
  els.finalScore.textContent = score;
  els.bestScoreDisplay.textContent = bestScore;
  const accuracy = gamesPlayed ? Math.round((correctCount / gamesPlayed) * 100) : 0;
  els.accuracyDisplay.textContent = `${accuracy}%`;
  
  // Show the modal
  els.gameOverModal.hidden = false;
  
  // Disable main game buttons
  setButtonsEnabled(false);
}

function hideGameOverModal() {
  els.gameOverModal.hidden = true;
}

function shareScore() {
  const category = CATEGORIES[currentCategory];
  const categoryName = category ? category.name.split(' ').pop() : 'CFB';
  const accuracy = gamesPlayed ? Math.round((correctCount / gamesPlayed) * 100) : 0;
  
  const shareText = `Just scored ${score} points in Guess the Winner (${categoryName})!\n\n` +
    `Final Stats:\n` +
    `• Score: ${score}\n` +
    `• Best Score: ${bestScore}\n` +
    `• Lifetime Accuracy: ${accuracy}%\n\n` +
    `Can you beat my score?`;
  
  // Create Twitter share URL
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
  
  // Open Twitter in a new window/tab
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function playAgain() {
  // Reset game state
  strikes = 0;
  score = 0;
  state.seenIds.clear();
  
  // Hide modal
  hideGameOverModal();
  
  // Start new game
  updateHeader();
  renderGame(pickNextGame() || randomFromArray(state.games));
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadData() {
  try {
    console.log('Loading local data...');
    
    // Load teams and games from local JSON files
    const [teamsRes, gamesRes] = await Promise.all([
      fetch('data/teams.json'),
      fetch('data/games.json')
    ]);
    
    const [teams, games] = await Promise.all([
      teamsRes.json(), 
      gamesRes.json()
    ]);
    
    state.teams = teams;
    state.games = games;
    
    console.log(`Loaded ${games.length} games and ${Object.keys(teams).length} teams from local data`);
  } catch (error) {
    console.error('Failed to load local data:', error);
    showError(`Failed to load game data: ${error.message}`);
    return;
  }
}


// ============================================================================
// SERVICE WORKER
// ============================================================================

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  // UI events
  els.nextBtn.addEventListener('click', nextGame);
  els.startGameBtn.addEventListener('click', startGame);
  els.resetBtn.addEventListener('click', resetGame);
  els.shareBtn.addEventListener('click', shareScore);
  els.howBtn.addEventListener('click', howTo);
  
  // Category selection events
  els.categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const categoryId = btn.dataset.category;
      selectCategory(categoryId);
    });
  });

  // Category switcher events
  els.categoryToggle.addEventListener('click', toggleCategoryDropdown);
  els.categoryOptions.forEach(option => {
    option.addEventListener('click', () => {
      const categoryId = option.dataset.category;
      if (!option.classList.contains('disabled')) {
        switchCategory(categoryId);
      }
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-switcher')) {
      els.categoryDropdown.hidden = true;
      els.categoryToggle.classList.remove('open');
    }
  });

  // Game Over Modal events
  els.shareScoreBtn.addEventListener('click', shareScore);
  els.playAgainBtn.addEventListener('click', playAgain);
  els.modalCloseBtn.addEventListener('click', hideGameOverModal);

  updateHeader();
  registerSW();

  await loadData();

  // Show welcome screen first
  showWelcome();
});
