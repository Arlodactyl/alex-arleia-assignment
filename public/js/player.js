// player.js - handles the player profile page functionality  
// loads player data from clash royale api and displays profile info

document.addEventListener('DOMContentLoaded', function() {
    console.log('player profile page loaded');
    
    // grab all the elements we need
    const playerTagInput = document.getElementById('playerTagInput');
    const searchPlayerBtn = document.getElementById('searchPlayerBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const currentPlayerBar = document.getElementById('currentPlayerBar');
    const playerText = document.getElementById('playerText');
    
    // player sections
    const playerProfileSection = document.getElementById('playerProfileSection');
    const playerStatsSection = document.getElementById('playerStatsSection');
    const playerClanSection = document.getElementById('playerClanSection');
    const playerArenaSection = document.getElementById('playerArenaSection');

    // event listeners
    searchPlayerBtn.addEventListener('click', handlePlayerSearch);
    clearSearchBtn.addEventListener('click', handleClearSearch);
    
    playerTagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handlePlayerSearch();
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

    // main search function with enhanced error handling
    async function handlePlayerSearch() {
        const playerTag = playerTagInput.value.trim();
        
        if (!playerTag) {
            showError('Please enter a player tag to search');
            return;
        }

        // enhanced tag validation
        const cleanTag = playerTag.replace(/^#/, '');
        if (!cleanTag.match(/^[A-Z0-9]{3,}$/i)) {
            showError('Invalid player tag format - use only letters and numbers (e.g., #9Q2YJ0U)');
            return;
        }

        if (cleanTag.length < 3) {
            showError('Player tag too short - need at least 3 characters');
            return;
        }

        if (cleanTag.length > 12) {
            showError('Player tag too long - most tags are 8-10 characters');
            return;
        }
        
        // show what we're loading
        if (playerText && currentPlayerBar) {
            playerText.textContent = `#${cleanTag}`;
            currentPlayerBar.classList.remove('hidden');
        }
        
        showLoading(true);
        hideError();
        hideAllPlayerSections();
        
        try {
            console.log('fetching player data for:', cleanTag);
            
            const player = await loadPlayerData(cleanTag);
            
            console.log('player data loaded:', player.name);
            
            // display all the player info
            displayPlayerProfile(player);
            displayPlayerStats(player);
            displayPlayerClan(player);
            displayPlayerArena(player);
            
            showAllPlayerSections();
            
        } catch (error) {
            console.error('failed to load player:', error);
            handleSearchError(error, cleanTag);
        } finally {
            showLoading(false);
        }
    }

    // enhanced error handling with specific messages
    function handleSearchError(error, playerTag) {
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
        } else {
            showError('Could not load player data - please try again');
        }
    }

    // clear search function - resets everything
    function handleClearSearch() {
        console.log('clearing player search');
        
        playerTagInput.value = '';
        hideError();
        hideAllPlayerSections();
        currentPlayerBar.classList.add('hidden');
        
        playerTagInput.focus();
    }

    // loads player data from the api with better error handling
    async function loadPlayerData(tag) {
        const cleanTag = encodeURIComponent(tag.replace(/^#/, ''));
        const response = await fetch(`/api/royale?path=players&tag=${cleanTag}`);
        
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
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error('Invalid response from server - please try again');
        }
    }

    // displays basic player profile info
    function displayPlayerProfile(player) {
        // basic info with validation
        document.getElementById('playerName').textContent = player.name || 'Unknown Player';
        document.getElementById('playerTag').textContent = player.tag || '#UNKNOWN';
        document.getElementById('playerLevel').textContent = player.expLevel || 1;
        
        // main stats with safe fallbacks
        document.getElementById('playerTrophies').textContent = (player.trophies || 0).toLocaleString();
        document.getElementById('playerBest').textContent = (player.bestTrophies || 0).toLocaleString();
        document.getElementById('playerExp').textContent = (player.expPoints || 0).toLocaleString();
        
        // update the current player bar with actual name
        if (playerText) {
            playerText.textContent = `${player.name} (${player.tag})`;
        }
    }

    // displays detailed player statistics
    function displayPlayerStats(player) {
        // battle stats with safe fallbacks
        document.getElementById('playerWins').textContent = (player.wins || 0).toLocaleString();
        document.getElementById('playerLosses').textContent = (player.losses || 0).toLocaleString();
        document.getElementById('playerThreeCrowns').textContent = (player.threeCrownWins || 0).toLocaleString();
        
        // clan activity stats with safe fallbacks
        document.getElementById('playerDonations').textContent = (player.donations || 0).toLocaleString();
        document.getElementById('playerReceived').textContent = (player.donationsReceived || 0).toLocaleString();
        document.getElementById('playerClanWars').textContent = (player.clanCardsCollected || 0).toLocaleString();
    }

    // displays player clan information if they have one
    function displayPlayerClan(player) {
        const clanInfo = document.getElementById('playerClanInfo');
        
        if (player.clan && player.clan.name) {
            clanInfo.innerHTML = `
                <div class="clan-info-content">
                    <div class="clan-info-header">
                        <div class="clan-badge">
                            <img src="./assets/magnifier.png" alt="Clan Badge" />
                        </div>
                        <div class="clan-details">
                            <h4 class="clan-name">${player.clan.name}</h4>
                            <div class="clan-tag">${player.clan.tag || 'No tag'}</div>
                        </div>
                    </div>
                    <div class="clan-role">
                        <span class="role-label">Role:</span>
                        <span class="role-value">${formatClanRole(player.clan.role)}</span>
                    </div>
                </div>
            `;
        } else {
            clanInfo.innerHTML = `
                <div class="no-clan">
                    <img src="./assets/user.png" alt="No Clan" />
                    <span>Not in a clan</span>
                </div>
            `;
        }
    }

    // displays player arena information
    function displayPlayerArena(player) {
        const arenaInfo = document.getElementById('playerArenaInfo');
        
        if (player.arena && player.arena.name) {
            arenaInfo.innerHTML = `
                <div class="arena-info-content">
                    <div class="arena-header">
                        <div class="arena-icon">
                            <img src="./assets/trophy.png" alt="Arena" />
                        </div>
                        <div class="arena-details">
                            <h4 class="arena-name">${player.arena.name}</h4>
                            <div class="arena-id">Arena ${player.arena.id || 'Unknown'}</div>
                        </div>
                    </div>
                    <div class="trophy-info">
                        <div class="trophy-current">
                            <span>Current: ${(player.trophies || 0).toLocaleString()}</span>
                        </div>
                        <div class="trophy-best">
                            <span>Best: ${(player.bestTrophies || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            arenaInfo.innerHTML = `
                <div class="no-arena">
                    <img src="./assets/trophy.png" alt="No Arena" />
                    <span>Arena information not available</span>
                </div>
            `;
        }
    }

    // formats clan role for display
    function formatClanRole(role) {
        if (!role) return 'Member';
        
        // capitalize first letter and format role names
        const roleMap = {
            'member': 'Member',
            'elder': 'Elder', 
            'coLeader': 'Co-Leader',
            'leader': 'Leader'
        };
        
        return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
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

    function showAllPlayerSections() {
        playerProfileSection.classList.remove('hidden');
        playerStatsSection.classList.remove('hidden');
        playerClanSection.classList.remove('hidden');
        playerArenaSection.classList.remove('hidden');
    }

    function hideAllPlayerSections() {
        playerProfileSection.classList.add('hidden');
        playerStatsSection.classList.add('hidden');
        playerClanSection.classList.add('hidden');
        playerArenaSection.classList.add('hidden');
    }
});