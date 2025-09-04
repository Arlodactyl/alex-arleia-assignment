// matches.js - handles the recent matches page functionality
// loads battle data from clash royale api and displays match history

document.addEventListener('DOMContentLoaded', function() {
    console.log('matches page loaded');
    
    // grab all the elements we need
    const playerTagInput = document.getElementById('playerTagInput');
    const loadMatchesBtn = document.getElementById('loadMatchesBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const matchesStats = document.getElementById('matchesStats');
    const recentMatchesSection = document.getElementById('recentMatchesSection');
    const gamePatternSection = document.getElementById('gamePatternSection');
    const matchesList = document.getElementById('matchesList');

    // new: display current tag bar
    let currentTagBar = document.getElementById('currentTagBar');
    let tagText = document.getElementById('tagText');
    
    // button click handler
    loadMatchesBtn.addEventListener('click', handleLoadMatches);
    
    // enter key support
    playerTagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLoadMatches();
        }
    });

    // enhanced input validation with real-time feedback
    playerTagInput.addEventListener('input', function() {
        const value = this.value.trim();
        hideError();
        
        // provide real-time feedback
        if (value.length > 0) {
            if (!value.startsWith('#') && !value.match(/^[A-Z0-9]+$/i)) {
                showError('Player tags should start with # or contain only letters and numbers');
                return;
            }
            
            if (value.length > 15) {
                showError('Player tags are usually shorter - check for extra characters');
                return;
            }
            
            if (value.length < 3 && value.startsWith('#')) {
                showError('Player tag seems too short - need at least 3 characters after #');
                return;
            }
        }
    });

    // main function that coordinates everything with enhanced error handling
    async function handleLoadMatches() {
        const raw = playerTagInput.value.trim();
        if (!raw) {
            showError('Please enter a player tag first');
            return;
        }

        // enhanced tag validation
        const normalized = raw.replace(/^#/, '').toUpperCase();
        if (!normalized.match(/^[A-Z0-9]{3,}$/)) {
            showError('Invalid player tag format - use only letters and numbers (e.g., #9Q2YJ0U)');
            return;
        }

        if (normalized.length < 3) {
            showError('Player tag too short - need at least 3 characters');
            return;
        }

        if (normalized.length > 12) {
            showError('Player tag too long - most tags are 8-10 characters');
            return;
        }

        const displayTag = `#${normalized}`;

        // show tag in UI
        if (tagText && currentTagBar) {
            tagText.textContent = displayTag;
            currentTagBar.classList.remove('hidden');
        }
        
        // show loading state
        showLoading(true);
        hideError();
        hideAllMatchSections();
        
        try {
            console.log('fetching matches for:', normalized);
            
            // call the api
            const matches = await loadRecentMatches(normalized);
            
            console.log('got', matches.length, 'matches');
            
            if (matches.length === 0) {
                showError('No recent matches found for this player - they may not have played recently');
                return;
            }
            
            // process and display the data
            displayMatches(matches);
            calculateAndShowStats(matches);      // last-25 stats
            showRecentGamePattern(matches.slice(0, 5));
            
            // show everything
            showAllMatchSections();

            // optional: remember tag
            localStorage.setItem('playerTag', normalized);
            
        } catch (error) {
            console.error('failed to load matches:', error);
            handleMatchesError(error, normalized);
        } finally {
            showLoading(false);
        }
    }

    // enhanced error handling with specific messages
    function handleMatchesError(error, playerTag) {
        const errorMessage = error.message || 'Unknown error';
        
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            showError(`Player #${playerTag} not found - check the tag is correct`);
        } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
            showError('API access issue - please try again in a moment');
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            showError('Too many requests - please wait a moment and try again');
        } else if (errorMessage.includes('500') || errorMessage.includes('internal')) {
            showError('Clash Royale servers are having issues - try again later');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            showError('Connection problem - check your internet and try again');
        } else if (errorMessage.includes('No recent matches')) {
            showError('This player has no recent match history available');
        } else {
            showError('Could not load match data - please try again');
        }
    }

    // makes the actual api request through our proxy with better error handling
    async function loadRecentMatches(tag) {
        // clean up the tag for the url
        const cleanTag = encodeURIComponent(String(tag).replace(/^#/, ""));
        const apiUrl = `/api/royale?path=players&tag=${cleanTag}&battlelog=true`;
        
        console.log('calling api:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Player not found - check the tag is correct');
            } else if (response.status === 403) {
                throw new Error('API access forbidden - please try again');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded - please wait and try again');
            } else if (response.status >= 500) {
                throw new Error('Server error - Clash Royale API is having issues');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }
        
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid match data received from server');
            }
            
            if (data.length === 0) {
                throw new Error('No recent matches found for this player');
            }
            
            return data;
        } catch (parseError) {
            if (parseError.message.includes('No recent matches')) {
                throw parseError;
            }
            throw new Error('Invalid response from server - please try again');
        }
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

    // builds a single match card element with safe data handling
    function createMatchCard(match, index) {
        const card = document.createElement('div');
        card.className = 'match-card';
        
        // figure out if we won or lost with safe fallbacks
        const result = analyzeMatchResult(match);
        const timeAgo = formatTimeAgo(match.battleTime);
        const opponentInfo = getOpponentInfo(match);

        // pick the right-side icon based on result
        const iconSrc = getResultIcon(result.status);
        
        // build the html with safe fallbacks
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
                        <div class="game-mode">${match.gameMode?.name || 'Unknown Mode'}</div>
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

    // compares crown counts to determine win/loss/draw with safe handling
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
        
        return {
            status,
            playerCrowns,
            opponentCrowns
        };
    }

    // gets opponent name and clan info with safe fallbacks
    function getOpponentInfo(match) {
        if (!match.opponent || match.opponent.length === 0) {
            return { name: 'Unknown Player', clan: null };
        }
        
        // handle 2v2 matches with multiple opponents
        if (match.opponent.length > 1) {
            const names = match.opponent.map(op => op.name || 'Unknown').join(' & ');
            return { name: names, clan: match.opponent[0]?.clan?.name };
        }
        
        // regular 1v1 match
        return {
            name: match.opponent[0]?.name || 'Unknown Player',
            clan: match.opponent[0]?.clan?.name
        };
    }

    // calculates win rate and other stats (for the returned battle log only)
    function calculateAndShowStats(matches) {
        let totalWins = 0;
        let crownWins = 0;
        let totalMatches = matches.length; // up to 25
        
        matches.forEach(match => {
            const result = analyzeMatchResult(match);
            if (result.status === 'WON') {
                totalWins++;
                // 3-0 victories count as crown wins
                if (result.playerCrowns === 3 && result.opponentCrowns === 0) {
                    crownWins++;
                }
            }
        });
        
        const winPercentage = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
        
        console.log(`stats(last ${totalMatches}): ${winPercentage}% win rate, ${totalWins}/${totalMatches}, ${crownWins} 3-crown wins`);
        
        // update the ui values with safe fallbacks
        const winPercentageEl = document.getElementById('winPercentage');
        const totalWinsEl = document.getElementById('totalWins');
        const crownWinsEl = document.getElementById('crownWins');
        
        if (winPercentageEl) winPercentageEl.textContent = `${winPercentage}%`;
        if (totalWinsEl) totalWinsEl.textContent = totalWins;
        if (crownWinsEl) crownWinsEl.textContent = crownWins;

        // update the labels so it's obvious these are from the log
        const statLabels = matchesStats.querySelectorAll('.stat-label');
        if (statLabels[0]) statLabels[0].textContent = 'Win Rate (last 25):';
        if (statLabels[1]) statLabels[1].textContent = 'Wins (last 25):';
        if (statLabels[2]) statLabels[2].textContent = '3-Crown Wins (last 25):';
    }

    // shows the w/l pattern for last 5 games
    function showRecentGamePattern(recentMatches) {
        const patternContainer = document.getElementById('gamePattern');
        if (!patternContainer) return;
        
        patternContainer.innerHTML = '';
        
        console.log('showing pattern for last', recentMatches.length, 'games');
        
        recentMatches.forEach(match => {
            const result = analyzeMatchResult(match);
            const patternLetter = document.createElement('span');
            patternLetter.className = `pattern-letter ${result.status.toLowerCase()}`;
            
            // set the letter
            if (result.status === 'WON') {
                patternLetter.textContent = 'W';
            } else if (result.status === 'LOST') {
                patternLetter.textContent = 'L';
            } else {
                patternLetter.textContent = 'D';
            }
            
            patternContainer.appendChild(patternLetter);
        });
    }

    // converts CR battleTime ("YYYYMMDDTHHMMSS.000Z") to "xh ago" properly
    function formatTimeAgo(crTime) {
        try {
            if (!crTime) return 'unknown';
            
            const m = String(crTime).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
            if (!m) return 'recently';
            const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
            const battleTime = new Date(iso);

            if (isNaN(battleTime.getTime())) return 'recently';

            const now = new Date();
            const diff = Math.max(0, now - battleTime);
            const mins = Math.floor(diff / 60000);
            const hrs  = Math.floor(mins / 60);
            const days = Math.floor(hrs / 24);

            if (days > 0)  return `${days}d ago`;
            if (hrs > 0)   return `${hrs}h ago`;
            if (mins > 0)  return `${mins}m ago`;
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

    // ui helper functions
    function showLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.classList.toggle('hidden', !show);
        }
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
        }
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }

    function showAllMatchSections() {
        if (matchesStats) matchesStats.classList.remove('hidden');
        if (recentMatchesSection) recentMatchesSection.classList.remove('hidden');
        if (gamePatternSection) gamePatternSection.classList.remove('hidden');
    }

    function hideAllMatchSections() {
        if (matchesStats) matchesStats.classList.add('hidden');
        if (recentMatchesSection) recentMatchesSection.classList.add('hidden');
        if (gamePatternSection) gamePatternSection.classList.add('hidden');
    }

    // expose handleLoadMatches globally for refresh functionality
    window.handleLoadMatches = handleLoadMatches;
});