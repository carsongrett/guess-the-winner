/* Guess the Winner – CFB-only, local JSON first, API later. 3-strike streak.
   Data format aligns to /data/games.json and /data/teams.json.
*/

const CONFIG = {
  mode: 'random',        // 'random' | 'daily'
  dataSource: 'local',   // 'local' | 'cfbd' (future)
  maxStrikes: 3
};

const els = {
  streakChip: document.getElementById('streakChip'),
  bestChip: document.getElementById('bestChip'),
  accuracyChip: document.getElementById('accuracyChip'),
  subtitle: document.getElementById('subtitle'),
  btnA: document.getElementById('btnA'),
  btnB: document.getElementById('btnB'),
  resultRow: document.getElementById('resultRow'),
  nextBtn: document.getElementById('nextBtn'),
  strikeDots: [document.getElementById('strike1'), document.getElementById('strike2'), document.getElementById('strike3')],
  modal: document.getElementById('modal'),
  summaryText: document.getElementById('summaryText'),
  restartBtn: document.getElementById('restartBtn'),
  modeToggle: document.getElementById('modeToggle'),
  shareBtn: document.getElementById('shareBtn'),
  howBtn: document.getElementById('howBtn')
};

const state = {
  games: [],
  teams: {},
  current: null,
  seenIds: new Set(),
  roundsPlayed: 0,
  answering: false
};

const LS = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

// Stats
let streak = LS.get('gtw.streak', 0);
let bestStreak = LS.get('gtw.best', 0);
let strikes = LS.get('gtw.strikes', 0);
let gamesPlayed = LS.get('gtw.played', 0);
let correctCount = LS.get('gtw.correct', 0);

function updateHeader() {
  els.streakChip.textContent = `Streak: ${streak}`;
  els.bestChip.textContent = `Best: ${bestStreak}`;
  const acc = gamesPlayed ? Math.round((correctCount / gamesPlayed) * 100) : 0;
  els.accuracyChip.textContent = `Acc: ${acc}%`;
  els.strikeDots.forEach((dot, idx) => {
    dot.classList.toggle('filled', idx < strikes);
    dot.classList.toggle('empty', idx >= strikes);
  });
}

function saveStats() {
  LS.set('gtw.streak', streak);
  LS.set('gtw.best', bestStreak);
  LS.set('gtw.strikes', strikes);
  LS.set('gtw.played', gamesPlayed);
  LS.set('gtw.correct', correctCount);
}

function boundNoScroll() {
  // Keep focus inside main card to avoid virtual keyboard scrolling; basic guard.
  document.activeElement?.blur?.();
}

function renderTeamButton(btn, team) {
  btn.innerHTML = `
    <div class="team-logo">${team.logo ? `<img src="${team.logo}" alt="${team.name} logo" width="44" height="44" />` : `<span>${team.abbr || team.name.slice(0,3).toUpperCase()}</span>`}</div>
    <div class="team-name">${team.name}</div>
  `;
}

function setButtonsEnabled(enabled) {
  els.btnA.disabled = !enabled;
  els.btnB.disabled = !enabled;
}

function renderGame(game) {
  state.current = game;
  state.answering = true;
  els.resultRow.hidden = true;
  els.nextBtn.hidden = true;
  setButtonsEnabled(true);
  boundNoScroll();

  renderTeamButton(els.btnA, game.teamA);
  renderTeamButton(els.btnB, game.teamB);

  els.subtitle.textContent = `Season ${game.season} • ${formatDate(game.date)}`;

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
    streak++;
    correctCount++;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    strikes++;
    if (strikes >= CONFIG.maxStrikes) {
      // End of run
      showGameOver();
      saveStats();
      updateHeader();
      return;
    }
  }

  saveStats();
  updateHeader();
  showResult(correct, g);
}

function showResult(correct, g) {
  els.resultRow.hidden = false;
  els.resultRow.textContent = correct
    ? `Correct! ${winnerName(g)} won ${g.teamA.score}-${g.teamB.score}`
    : `Wrong — ${winnerName(g)} won ${g.teamA.score}-${g.teamB.score}`;
  els.nextBtn.hidden = false;
  els.nextBtn.onclick = () => nextGame();
}

function winnerName(g) {
  return g.winner === g.teamA.abbr ? g.teamA.name : g.teamB.name;
}

function nextGame() {
  if (CONFIG.mode === 'daily') {
    // In daily mode we only allow one play; start a new round with the same game but keep strikes/streak going if you want multiple plays.
    // For v1: show the same daily game again but mark as seen.
  }
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

function formatDate(iso) {
  // yyyy-mm-dd -> Mon DD, YYYY
  if (!iso) return '';
  const d = new Date(iso);
  if (String(d) === 'Invalid Date') return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateHash(yyyymmdd) {
  let h = 0;
  for (let i = 0; i < yyyymmdd.length; i++) h = (h * 31 + yyyymmdd.charCodeAt(i)) >>> 0;
  return h;
}

function selectDailyGame() {
  const today = new Date();
  const ymd = today.toISOString().slice(0,10).replace(/-/g,'');
  const idx = dateHash(ymd) % state.games.length;
  return state.games[idx];
}

function showGameOver() {
  els.modal.hidden = false;
  const acc = gamesPlayed ? Math.round((correctCount / gamesPlayed) * 100) : 0;
  els.summaryText.textContent = `Streak ended. Best: ${bestStreak}. Games: ${gamesPlayed}. Accuracy: ${acc}%.`;
}

function hideGameOver() {
  els.modal.hidden = true;
}

function restart() {
  streak = 0;
  strikes = 0;
  state.seenIds.clear();
  saveStats();
  updateHeader();
  hideGameOver();
  renderGame(CONFIG.mode === 'daily' ? selectDailyGame() : pickNextGame() || randomFromArray(state.games));
}

function toggleMode() {
  CONFIG.mode = CONFIG.mode === 'random' ? 'daily' : 'random';
  els.modeToggle.textContent = `Daily: ${CONFIG.mode === 'daily' ? 'On' : 'Off'}`;
  // Optional: reset session on mode change
  state.seenIds.clear();
  renderGame(CONFIG.mode === 'daily' ? selectDailyGame() : pickNextGame() || randomFromArray(state.games));
}

function shareStreak() {
  const url = location.href;
  const text = `I'm on a ${streak}-in-a-row streak on Guess the Winner!`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, '_blank', 'noopener,noreferrer');
}

function howTo() {
  alert('Tap the team that won. You have 3 strikes before your streak ends. No accounts, no scroll. Enjoy!');
}

async function loadLocalData() {
  const [teamsRes, gamesRes] = await Promise.all([
    fetch('data/teams.json'),
    fetch('data/games.json')
  ]);
  const [teams, games] = await Promise.all([teamsRes.json(), gamesRes.json()]);

  state.teams = teams;
  // Ensure logos resolved even if JSON items omit full path:
  state.games = games.map(g => ({
    ...g,
    teamA: resolveTeamAsset(g.teamA),
    teamB: resolveTeamAsset(g.teamB)
  }));
}

function resolveTeamAsset(team) {
  // If logo already provided, keep it. Otherwise, map by name/abbr.
  if (team.logo) return team;
  // Try by name then abbr from teams.json
  const byName = state.teams[team.name];
  const logo = byName?.logo || (team.abbr ? `logos/${team.abbr}.png` : '');
  return { ...team, logo };
}

/* CFBD example (Phase 2) – keep commented for now:

async function fetchFromCFBD(season = 2024) {
  const headers = { 'accept': 'application/json', 'x-api-key': 'YOUR_CFBD_KEY' };
  const url = `https://api.collegefootballdata.com/games?year=${season}&seasonType=regular`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data.map(normalizeCFBDGame).filter(Boolean);
}

function normalizeCFBDGame(row) {
  // Map CFBD fields to local schema. Requires team logo mapping from teams.json
  if (!row.home_team || !row.away_team || row.home_points == null || row.away_points == null) return null;
  const teamAName = row.home_team;
  const teamBName = row.away_team;
  const teamA = resolveFromTeamsJson(teamAName, row.home_points);
  const teamB = resolveFromTeamsJson(teamBName, row.away_points);
  const winner = row.home_points > row.away_points ? teamA.abbr : teamB.abbr;
  return {
    id: `${row.season}-${row.week}-${teamA.abbr}-${teamB.abbr}`,
    season: row.season,
    date: row.start_date ? row.start_date.slice(0,10) : '',
    teamA, teamB, winner
  };
}

function resolveFromTeamsJson(name, score) {
  const t = state.teams[name] || {};
  return { name, abbr: t.abbr || name.slice(0,3).toUpperCase(), logo: t.logo || '', score };
}
*/

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

/* Init */
window.addEventListener('DOMContentLoaded', async () => {
  // UI events
  els.nextBtn.addEventListener('click', nextGame);
  els.restartBtn.addEventListener('click', restart);
  els.modeToggle.addEventListener('click', toggleMode);
  els.shareBtn.addEventListener('click', shareStreak);
  els.howBtn.addEventListener('click', howTo);

  updateHeader();
  registerSW();

  await loadLocalData();

  const first = (CONFIG.mode === 'daily') ? selectDailyGame() : pickNextGame() || randomFromArray(state.games);
  renderGame(first);
});
