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

    // main function that coordinates everything
    async function handleLoadMatches() {
        const raw = playerTagInput.value.trim();
        if (!raw) {
            showError('need a player tag first');
            return;
        }

        // normalize player tag for api + display
        const normalized = raw.replace(/^#/, '').toUpperCase();
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
                showError('no matches found for this player');
                return;
            }
            
            // process and display the data
            displayMatches(matches);
            calculateAndShowStats(matches);
            showRecentGamePattern(matches.slice(0, 5));
            
            // show everything
            showAllMatchSections();

            // optional: remember tag
            localStorage.setItem('playerTag', normalized);
            
        } catch (error) {
            console.error('failed to load matches:', error);
            showError('couldnt load matches - check the player tag');
        } finally {
            showLoading(false);
        }
    }

    // makes the actual api request through our proxy
    async function loadRecentMatches(tag) {
        // clean up the tag for the url
        const cleanTag = encodeURIComponent(String(tag).replace(/^#/, ""));
        const apiUrl = `/api/player/${cleanTag}/battles`;
        
        console.log('calling api:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`api call failed: ${response.status}`);
        }
        
        return response.json();
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
        
        // figure out if we won or lost
        const result = analyzeMatchResult(match);
        const timeAgo = formatTimeAgo(match.battleTime);
        const opponentInfo = getOpponentInfo(match);
        
        // build the html
        card.innerHTML = `
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
        
        return {
            status,
            playerCrowns,
            opponentCrowns
        };
    }

    // gets opponent name and clan info
    function getOpponentInfo(match) {
        if (!match.opponent || match.opponent.length === 0) {
            return { name: 'unknown', clan: null };
        }
        
        // handle 2v2 matches with multiple opponents
        if (match.opponent.length > 1) {
            const names = match.opponent.map(op => op.name).join(' & ');
            return { name: names, clan: match.opponent[0]?.clan?.name };
        }
        
        // regular 1v1 match
        return {
            name: match.opponent[0]?.name || 'unknown',
            clan: match.opponent[0]?.clan?.name
        };
    }

    // calculates win rate and other stats
    function calculateAndShowStats(matches) {
        let totalWins = 0;
        let crownWins = 0;
        let totalMatches = matches.length;
        
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
        
        console.log(`stats: ${winPercentage}% win rate, ${totalWins}/${totalMatches}, ${crownWins} crown wins`);
        
        // update the ui
        document.getElementById('winPercentage').textContent = `${winPercentage}%`;
        document.getElementById('totalWins').textContent = totalWins;
        document.getElementById('crownWins').textContent = crownWins;
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

    // converts api timestamp to readable format
    function formatTimeAgo(battleTimeString) {
        try {
            const battleTime = new Date(battleTimeString);
            const now = new Date();
            const timeDiffMs = now - battleTime;
            
            const minutes = Math.floor(timeDiffMs / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                return `${days}d ago`;
            } else if (hours > 0) {
                return `${hours}h ago`;
            } else if (minutes > 0) {
                return `${minutes}m ago`;
            } else {
                return 'just now';
            }
        } catch (error) {
            console.error('time formatting failed:', error);
            return 'recently';
        }
    }

    // ui helper functions
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
});
