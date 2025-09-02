// clans.js - handles the clan search page functionality
// searches for clans by tag/name and location from clash royale api

document.addEventListener('DOMContentLoaded', function() {
    console.log('clan search page loaded');
    
    // grab all the elements we need
    const clanSearchInput = document.getElementById('clanSearchInput');
    const locationSelect = document.getElementById('locationSelect');
    const searchClansBtn = document.getElementById('searchClansBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const clansResultsSection = document.getElementById('clansResultsSection');
    const popularClansSection = document.getElementById('popularClansSection');
    const clansList = document.getElementById('clansList');
    
    // current search display elements
    let currentSearchBar = document.getElementById('currentSearchBar');
    let searchText = document.getElementById('searchText');
    
    // button click handler
    searchClansBtn.addEventListener('click', handleClanSearch);
    
    // enter key support
    clanSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleClanSearch();
        }
    });

    // main function that coordinates everything
    async function handleClanSearch() {
        const searchQuery = clanSearchInput.value.trim();
        const locationId = locationSelect.value;
        
        if (!searchQuery) {
            showError('need a clan tag or name to search');
            return;
        }
        
        // determine if its a tag or name search
        const isTagSearch = searchQuery.startsWith('#') || searchQuery.match(/^[A-Z0-9]{3,}$/i);
        const locationText = locationSelect.options[locationSelect.selectedIndex].text;
        
        // show what we're searching for
        if (searchText && currentSearchBar) {
            const searchDisplay = isTagSearch 
                ? `Tag: ${searchQuery}` 
                : `Name: "${searchQuery}"`;
            const fullDisplay = locationId ? `${searchDisplay} in ${locationText}` : searchDisplay;
            searchText.textContent = fullDisplay;
            currentSearchBar.classList.remove('hidden');
        }
        
        // show loading state
        showLoading(true);
        hideError();
        hideAllClanSections();
        
        try {
            console.log('searching clans:', searchQuery, 'location:', locationId);
            
            let clans;
            if (isTagSearch) {
                // single clan lookup by tag
                clans = await searchClanByTag(searchQuery);
            } else {
                // multiple clan search by name/location
                clans = await searchClansByName(searchQuery, locationId);
            }
            
            console.log('found', clans ? clans.length || 1 : 0, 'clans');
            
            if (!clans || (Array.isArray(clans) && clans.length === 0)) {
                showError('no clans found for this search');
                return;
            }
            
            // display the results
            displayClans(clans);
            showAllClanSections();
            
        } catch (error) {
            console.error('failed to search clans:', error);
            showError('couldnt find clans - check your search terms');
        } finally {
            showLoading(false);
        }
    }

    // searches for a specific clan by tag
    async function searchClanByTag(tag) {
        const cleanTag = encodeURIComponent(String(tag).replace(/^#/, ""));
        const apiUrl = `/api/royale?path=clans&tag=${cleanTag}`;
        
        console.log('calling clan api:', apiUrl);
        
        const response = await fetch(apiUrl);
        const text = await response.text();
        
        if (!response.ok) {
            console.error('clan api error:', response.status, text);
            throw new Error(`clan lookup failed: ${response.status}`);
        }
        
        const clan = JSON.parse(text);
        return [clan]; // wrap single clan in array for consistency
    }

    // searches for clans by name and optionally location
    async function searchClansByName(name, locationId) {
        let apiUrl = `/api/royale?path=clans&name=${encodeURIComponent(name)}`;
        if (locationId) {
            apiUrl += `&locationId=${locationId}`;
        }
        
        console.log('calling clan search api:', apiUrl);
        
        const response = await fetch(apiUrl);
        const text = await response.text();
        
        if (!response.ok) {
            console.error('clan search error:', response.status, text);
            throw new Error(`clan search failed: ${response.status}`);
        }
        
        const result = JSON.parse(text);
        // api might return {items: [...]} or direct array
        return result.items || result;
    }

    // displays clan results on the page
    function displayClans(clans) {
        clansList.innerHTML = '';
        
        const clansArray = Array.isArray(clans) ? clans : [clans];
        console.log('rendering', clansArray.length, 'clan cards');
        
        clansArray.forEach((clan, index) => {
            const clanCard = createClanCard(clan, index);
            clansList.appendChild(clanCard);
        });
    }

    // builds a single clan card element
    function createClanCard(clan, index) {
        const card = document.createElement('div');
        card.className = 'clan-card';
        
        // get clan info
        const memberCount = clan.members || 0;
        const requiredTrophies = clan.requiredTrophies || 0;
        const clanScore = clan.clanScore || clan.trophies || 0;
        const warTrophies = clan.clanWarTrophies || 0;
        const location = clan.location?.name || 'Unknown';
        const description = clan.description || 'No description available';
        
        // get clan type icon and text
        const typeInfo = getClanTypeInfo(clan.type);
        
        // get country flag if location is available
        const countryFlag = getCountryFlag(clan.location);
        
        // build the html
        card.innerHTML = `
            <div class="clan-card-content">
                <div class="clan-card-left">
                    <div class="clan-badge">
                        <img src="./assets/magnifier.png" alt="Clan Badge" />
                    </div>
                </div>
                <div class="clan-card-center">
                    <div class="clan-card-header">
                        <div class="clan-name-section">
                            <h4 class="clan-name">${clan.name}</h4>
                            <div class="clan-tag">${clan.tag}</div>
                        </div>
                        <div class="clan-location">
                            ${countryFlag} ${location}
                        </div>
                    </div>
                    <div class="clan-stats-row">
                        <div class="clan-stat">
                            <span class="stat-label">Members:</span>
                            <span class="stat-value">${memberCount}/50</span>
                        </div>
                        <div class="clan-stat">
                            <span class="stat-label">Score:</span>
                            <span class="stat-value">${clanScore.toLocaleString()}</span>
                        </div>
                        <div class="clan-stat">
                            <span class="stat-label">War:</span>
                            <span class="stat-value">${warTrophies}</span>
                        </div>
                    </div>
                    <div class="clan-details">
                        <div class="clan-type ${typeInfo.className}">
                            ${typeInfo.icon} ${typeInfo.text}
                        </div>
                        <div class="required-trophies">
                            Min: ${requiredTrophies} 🏆
                        </div>
                    </div>
                    <div class="clan-description">
                        ${description.length > 100 ? description.substring(0, 100) + '...' : description}
                    </div>
                </div>
                <div class="clan-card-right">
                    <div class="join-indicator ${typeInfo.joinable ? 'joinable' : 'not-joinable'}">
                        ${typeInfo.joinable ? '✓' : '✗'}
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    // determines clan type info and whether its joinable
    function getClanTypeInfo(type) {
        switch (type) {
            case 'open':
                return {
                    text: 'Open',
                    icon: '🌐',
                    className: 'open',
                    joinable: true
                };
            case 'inviteOnly':
                return {
                    text: 'Invite Only',
                    icon: '🔒',
                    className: 'invite-only',
                    joinable: false
                };
            case 'closed':
                return {
                    text: 'Closed',
                    icon: '🚫',
                    className: 'closed',
                    joinable: false
                };
            default:
                return {
                    text: 'Unknown',
                    icon: '❓',
                    className: 'unknown',
                    joinable: false
                };
        }
    }

    // gets country flag emoji or icon for location
    function getCountryFlag(location) {
        if (!location || !location.countryCode) return '🌍';
        
        // convert country code to flag emoji
        const countryCode = location.countryCode.toLowerCase();
        const flagMap = {
            'us': '🇺🇸',
            'gb': '🇬🇧', 
            'uk': '🇬🇧',
            'ca': '🇨🇦',
            'au': '🇦🇺',
            'nz': '🇳🇿',
            'de': '🇩🇪',
            'fr': '🇫🇷',
            'it': '🇮🇹',
            'es': '🇪🇸',
            'br': '🇧🇷',
            'mx': '🇲🇽',
            'in': '🇮🇳',
            'jp': '🇯🇵',
            'kr': '🇰🇷',
            'cn': '🇨🇳'
        };
        
        return flagMap[countryCode] || '🌍';
    }

    // ui helper functions - same pattern as matches page
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

    function showAllClanSections() {
        clansResultsSection.classList.remove('hidden');
        // popularClansSection could be shown later for featured clans
    }

    function hideAllClanSections() {
        clansResultsSection.classList.add('hidden');
        popularClansSection.classList.add('hidden');
    }
});