// matches.js - handles the recent matches page functionality
// loads battle data from clash royale api and displays match history

document.addEventListener('DOMContentLoaded', function () {
  console.log('matches page loaded');

  // ---------- ELEMENTS ----------
  let playerTagInput = document.getElementById('playerTagInput');
  let loadMatchesBtn = document.getElementById('loadMatchesBtn');
  let loadingIndicator = document.getElementById('loadingIndicator');
  let errorMessage = document.getElementById('errorMessage');
  let matchesStats = document.getElementById('matchesStats');
  let recentMatchesSection = document.getElementById('recentMatchesSection');
  let gamePatternSection = document.getElementById('gamePatternSection');
  let matchesList = document.getElementById('matchesList');

  // display current tag bar (ALIGN IDs TO HTML)
  let currentPlayerBar = document.getElementById('currentPlayerBar');
  let playerText = document.getElementById('playerText');

  // ---------- HARDEN: STRIP FOREIGN LISTENERS ----------
  // Any earlier inline script may have already attached event listeners.
  // Cloning elements removes all existing listeners cleanly.
  function stripListeners(elId) {
    const el = document.getElementById(elId);
    if (!el) return null;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  playerTagInput = stripListeners('playerTagInput') || playerTagInput;
  loadMatchesBtn = stripListeners('loadMatchesBtn') || loadMatchesBtn;

  // If you have a clear button on this page, strip it too (it exists in your HTML):
  let clearSearchBtn = document.getElementById('clearSearchBtn');
  clearSearchBtn = clearSearchBtn ? stripListeners('clearSearchBtn') : null;

  // ---------- EVENT LISTENERS (ours only) ----------
  loadMatchesBtn.addEventListener('click', handleLoadMatches);
  if (clearSearchBtn) clearSearchBtn.addEventListener('click', handleClearSearch);

  playerTagInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleLoadMatches();
  });

  // ---------- MAIN FLOW ----------
  async function handleLoadMatches() {
    const raw = playerTagInput.value.trim();
    if (!raw) {
      showError('need a player tag first');
      return;
    }

    // normalize player tag for api + display - make case insensitive
    const normalized = raw.replace(/^#/, '').toUpperCase();
    const displayTag = `#${normalized}`;

    // show tag in UI (ALIGN IDs)
    if (playerText && currentPlayerBar) {
      playerText.textContent = displayTag;
      currentPlayerBar.classList.remove('hidden');
    }

    showLoading(true);
    hideError();
    hideAllMatchSections();

    try {
      console.log('fetching matches for:', normalized);

      const matches = await loadRecentMatches(normalized);

      console.log('got', matches.length, 'matches');

      if (!Array.isArray(matches) || matches.length === 0) {
        showError('no matches found for this player');
        return;
      }

      // render
      displayMatches(matches);
      calculateAndShowStats(matches); // last-25 stats as returned
      showRecentGamePattern(matches.slice(0, 5));

      showAllMatchSections();

      // remember tag
      try {
        localStorage.setItem('playerTag', normalized);
      } catch {}

    } catch (error) {
      console.error('failed to load matches:', error);
      showError('couldnt load matches - check the player tag');
    } finally {
      showLoading(false);
    }
  }

  // makes the actual api request through our proxy - handles case insensitive tags
  async function loadRecentMatches(tag) {
    const cleanTag = encodeURIComponent(String(tag).toUpperCase().replace(/^#/, ''));
    const apiUrl = `/api/royale?path=players&tag=${cleanTag}&battlelog=true`;

    console.log('calling api:', apiUrl);

    const response = await fetch(apiUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error('proxy error:', response.status, text);
      throw new Error(`api call failed: ${response.status}`);
    }

    return JSON.parse(text);
  }

  // creates all the match cards and adds them to the page
  function displayMatches(matches) {
    matchesList.innerHTML = '';

    console.log('rendering', matches.length, 'match cards');

    matches.forEach((match, index) => {
      const matchCard = createMatchCard(match, index);
      matchesList.appendChild(matchCard);
    });
  }

  // builds a single match card element
  function createMatchCard(match, index) {
    const card = document.createElement('div');
    card.className = 'match-card';

    const result = analyzeMatchResult(match);
    const timeAgo = formatTimeAgo(match.battleTime);
    const opponentInfo = getOpponentInfo(match);

    const iconSrc = getResultIcon(result.status); // up arrow for win, down for loss

    card.innerHTML = `
      <div class="match-card-content">
        <div class="match-card-left">
          <div class="clan-icon">
            <img src="./assets/icon_menu_battle.png" alt="Battle Icon" />
          </div>
        </div>
        <div class="match-card-center">
          <div class="match-card-header">
            <div class="match-result ${result.status.toLowerCase()}">
              <span class="result-badge">${result.status}</span>
              <span class="match-score">${result.playerCrowns} - ${result.opponentCrowns}</span>
            </div>
            <div class="match-time">${timeAgo}</div>
          </div>
          <div class="match-details">
            <div class="game-mode">${match.gameMode?.name || 'unknown mode'}</div>
            <div class="opponent-info">
              <strong>vs ${opponentInfo.name}</strong>
              ${opponentInfo.clan ? `<span class="opponent-clan">[${opponentInfo.clan}]</span>` : ''}
            </div>
            ${match.arena?.name ? `<div class="arena-name">${match.arena.name}</div>` : ''}
          </div>
        </div>
        <div class="match-card-right">
          <div class="result-arrow">
            <img src="${iconSrc}" alt="${result.status} icon" />
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // compares crown counts to determine win/loss/draw
  function analyzeMatchResult(match) {
    const playerCrowns = (match.team || []).reduce((sum, p) => sum + (p.crowns || 0), 0);
    const opponentCrowns = (match.opponent || []).reduce((sum, p) => sum + (p.crowns || 0), 0);

    let status;
    if (playerCrowns > opponentCrowns) {
      status = 'WON';
    } else if (playerCrowns < opponentCrowns) {
      status = 'LOST';
    } else {
      status = 'DRAW';
    }

    return { status, playerCrowns, opponentCrowns };
  }

  // gets opponent name and clan info
  function getOpponentInfo(match) {
    if (!match.opponent || match.opponent.length === 0) {
      return { name: 'unknown', clan: null };
    }

    if (match.opponent.length > 1) {
      const names = match.opponent.map(op => op.name).join(' & ');
      return { name: names, clan: match.opponent[0]?.clan?.name };
    }

    return {
      name: match.opponent[0]?.name || 'unknown',
      clan: match.opponent[0]?.clan?.name || null
    };
  }

  // calculates win rate and other stats (for the returned battle log only)
  function calculateAndShowStats(matches) {
    let totalWins = 0;
    let crownWins = 0;
    const totalMatches = matches.length;

    matches.forEach(match => {
      const result = analyzeMatchResult(match);
      if (result.status === 'WON') {
        totalWins++;
        if (result.playerCrowns === 3 && result.opponentCrowns === 0) {
          crownWins++;
        }
      }
    });

    const winPercentage = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    console.log(`stats(last ${totalMatches}): ${winPercentage}% win rate, ${totalWins}/${totalMatches}, ${crownWins} 3-crown wins`);

    document.getElementById('winPercentage').textContent = `${winPercentage}%`;
    document.getElementById('totalWins').textContent = totalWins;
    document.getElementById('crownWins').textContent = crownWins;

    const statLabels = matchesStats.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = 'Win Rate (last 25):';
    if (statLabels[1]) statLabels[1].textContent = 'Wins (last 25):';
    if (statLabels[2]) statLabels[2].textContent = '3-Crown Wins (last 25):';
  }

  // shows the w/l pattern for last 5 games
  function showRecentGamePattern(recentMatches) {
    const patternContainer = document.getElementById('gamePattern');
    patternContainer.innerHTML = '';

    console.log('showing pattern for last', recentMatches.length, 'games');

    recentMatches.forEach(match => {
      const result = analyzeMatchResult(match);
      const patternLetter = document.createElement('span');
      patternLetter.className = `pattern-letter ${result.status.toLowerCase()}`;
      patternLetter.textContent =
        result.status === 'WON' ? 'W' : result.status === 'LOST' ? 'L' : 'D';
      patternContainer.appendChild(patternLetter);
    });
  }

  // converts CR battleTime ("YYYYMMDDTHHMMSS.000Z") to "xh ago" properly
  function formatTimeAgo(crTime) {
    try {
      const m = String(crTime).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (!m) return 'recently';
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
      const battleTime = new Date(iso);

      const now = new Date();
      const diff = Math.max(0, now - battleTime);
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);

      if (days > 0) return `${days}d ago`;
      if (hrs > 0) return `${hrs}h ago`;
      if (mins > 0) return `${mins}m ago`;
      return 'just now';
    } catch {
      return 'recently';
    }
  }

  // pick the arrow icon depending on result - UP for win, DOWN for loss
  function getResultIcon(status) {
    return status === 'WON'
      ? './assets/winarrow.png'
      : status === 'LOST'
        ? './assets/down-arrow.png'
        : './assets/arrow.png';
  }

  // ---------- UI HELPERS ----------
  function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }

  function showAllMatchSections() {
    matchesStats.classList.remove('hidden');
    recentMatchesSection.classList.remove('hidden');
    gamePatternSection.classList.remove('hidden');
  }

  function hideAllMatchSections() {
    matchesStats.classList.add('hidden');
    recentMatchesSection.classList.add('hidden');
    gamePatternSection.classList.add('hidden');
  }

  // const saved = localStorage.getItem('playerTag');
  // if (saved) { playerTagInput.value = `#${saved}`; }
});
