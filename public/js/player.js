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

    // main search function
    async function handlePlayerSearch() {
        const playerTag = playerTagInput.value.trim();
        
        if (!playerTag) {
            showError('need a player tag to search');
            return;
        }
        
        // show what we're loading
        if (playerText && currentPlayerBar) {
            playerText.textContent = playerTag;
            currentPlayerBar.classList.remove('hidden');
        }
        
        showLoading(true);
        hideError();
        hideAllPlayerSections();
        
        try {
            console.log('fetching player data for:', playerTag);
            
            const player = await loadPlayerData(playerTag);
            
            console.log('player data loaded:', player.name);
            
            // display all the player info
            displayPlayerProfile(player);
            displayPlayerStats(player);
            displayPlayerClan(player);
            displayPlayerArena(player);
            
            showAllPlayerSections();
            
        } catch (error) {
            console.error('failed to load player:', error);
            showError('couldnt find player - check the tag and try again');
        } finally {
            showLoading(false);
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

    // loads player data from the api
    async function loadPlayerData(tag) {
        const cleanTag = encodeURIComponent(tag.replace(/^#/, ''));
        const response = await fetch(`/api/royale?path=players&tag=${cleanTag}`);
        const text = await response.text();
        
        if (!response.ok) throw new Error(`player lookup failed: ${response.status}`);
        
        return JSON.parse(text);
    }

    // displays basic player profile info
    function displayPlayerProfile(player) {
        // basic info
        document.getElementById('playerName').textContent = player.name || 'Unknown Player';
        document.getElementById('playerTag').textContent = player.tag || '#UNKNOWN';
        document.getElementById('playerLevel').textContent = player.expLevel || 1;
        
        // main stats
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
        // battle stats
        document.getElementById('playerWins').textContent = (player.wins || 0).toLocaleString();
        document.getElementById('playerLosses').textContent = (player.losses || 0).toLocaleString();
        document.getElementById('playerThreeCrowns').textContent = (player.threeCrownWins || 0).toLocaleString();
        
        // clan activity stats
        document.getElementById('playerDonations').textContent = (player.donations || 0).toLocaleString();
        document.getElementById('playerReceived').textContent = (player.donationsReceived || 0).toLocaleString();
        document.getElementById('playerClanWars').textContent = (player.clanCardsCollected || 0).toLocaleString();
    }

    // displays player clan information if they have one
    function displayPlayerClan(player) {
        const clanInfo = document.getElementById('playerClanInfo');
        
        if (player.clan) {
            clanInfo.innerHTML = `
                <div class="clan-info-content">
                    <div class="clan-info-header">
                        <div class="clan-badge">
                            <img src="./assets/magnifier.png" alt="Clan Badge" />
                        </div>
                        <div class="clan-details">
                            <h4 class="clan-name">${player.clan.name}</h4>
                            <div class="clan-tag">${player.clan.tag}</div>
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
        
        if (player.arena) {
            arenaInfo.innerHTML = `
                <div class="arena-info-content">
                    <div class="arena-header">
                        <div class="arena-icon">
                            <img src="./assets/trophy.png" alt="Arena" />
                        </div>
                        <div class="arena-details">
                            <h4 class="arena-name">${player.arena.name}</h4>
                            <div class="arena-id">Arena ${player.arena.id}</div>
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