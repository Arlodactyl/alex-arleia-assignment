// clans.js - handles the clan search page functionality
// searches for clans by tag/name and location from clash royale api

document.addEventListener('DOMContentLoaded', function() {
    console.log('clan search page loaded');
    
    // grab all the elements we need
    const clanSearchInput = document.getElementById('clanSearchInput');
    const locationSelect = document.getElementById('locationSelect');
    const searchClansBtn = document.getElementById('searchClansBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const clansResultsSection = document.getElementById('clansResultsSection');
    const popularClansSection = document.getElementById('popularClansSection');
    const clansList = document.getElementById('clansList');
    
    // current search display elements
    const currentSearchBar = document.getElementById('currentSearchBar');
    const searchText = document.getElementById('searchText');

    // create show more button
    const showMoreBtn = document.createElement('button');
    showMoreBtn.textContent = 'Show More Clans';
    showMoreBtn.className = 'load-matches-btn show-more-btn hidden';
    showMoreBtn.style.marginTop = '16px';
    showMoreBtn.style.width = '100%';

    // storage for pagination
    let allClans = [];
    let displayedCount = 0;
    const clansPerPage = 15; // show 15 at a time on mobile

    // event listeners
    searchClansBtn.addEventListener('click', handleClanSearch);
    clearSearchBtn.addEventListener('click', handleClearSearch);
    
    clanSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleClanSearch();
        }
    });

    showMoreBtn.addEventListener('click', function() {
        renderNextClans();
    });

    // main search function with fuzzy matching
    async function handleClanSearch() {
        const searchQuery = clanSearchInput.value.trim();
        const locationId = locationSelect.value;
        
        if (!searchQuery) {
            showError('need a clan tag or name to search');
            return;
        }
        
        // determine search type
        const isTagSearch = searchQuery.startsWith('#') || searchQuery.match(/^[A-Z0-9]{3,}$/i);
        const locationText = locationSelect.options[locationSelect.selectedIndex].text;
        
        // show what we're searching for
        if (searchText && currentSearchBar) {
            const searchDisplay = isTagSearch ? `Tag: ${searchQuery}` : `Name: "${searchQuery}"`;
            searchText.textContent = locationId ? `${searchDisplay} in ${locationText}` : searchDisplay;
            currentSearchBar.classList.remove('hidden');
        }
        
        showLoading(true);
        hideError();
        hideAllClanSections();
        resetPagination();
        
        try {
            console.log('searching clans:', searchQuery, 'location:', locationId);
            
            let clans;
            if (isTagSearch) {
                clans = await searchClanByTag(searchQuery);
            } else {
                // try fuzzy name search with multiple variations
                clans = await fuzzyNameSearch(searchQuery, locationId);
            }
            
            console.log('found', clans ? clans.length : 0, 'clans');
            
            if (!clans || clans.length === 0) {
                showError('no clans found - try different spelling or shorter name');
                return;
            }
            
            allClans = Array.isArray(clans) ? clans : [clans];
            renderNextClans();
            showAllClanSections();
            
        } catch (error) {
            console.error('failed to search clans:', error);
            showError('couldnt find clans - check your search terms');
        } finally {
            showLoading(false);
        }
    }

    // clear search function - resets everything
    function handleClearSearch() {
        console.log('clearing search');
        
        // clear input fields
        clanSearchInput.value = '';
        locationSelect.value = '';
        
        // hide all sections and messages
        hideError();
        hideAllClanSections();
        currentSearchBar.classList.add('hidden');
        
        // reset pagination
        resetPagination();
        
        // focus back to search input
        clanSearchInput.focus();
    }

    // fuzzy search that tries multiple variations
    async function fuzzyNameSearch(name, locationId) {
        const searchVariations = generateSearchVariations(name);
        
        for (const variation of searchVariations) {
            try {
                const results = await searchClansByName(variation, locationId);
                if (results && results.length > 0) {
                    console.log(`found results with variation: "${variation}"`);
                    return results;
                }
            } catch (error) {
                console.log(`no results for variation: "${variation}"`);
                continue;
            }
        }
        
        return []; // no results found
    }

    // generates search variations for better matching
    function generateSearchVariations(name) {
        const variations = [name]; // start with exact search
        
        // remove special characters
        const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (cleaned !== name) variations.push(cleaned);
        
        // try first few words only
        const words = name.split(' ');
        if (words.length > 1) {
            variations.push(words[0]); // first word only
            variations.push(words.slice(0, 2).join(' ')); // first two words
        }
        
        // try shorter versions if name is long
        if (name.length > 8) {
            variations.push(name.substring(0, 6));
            variations.push(name.substring(0, 4));
        }
        
        // remove duplicates
        return [...new Set(variations)];
    }

    // search for specific clan by tag
    async function searchClanByTag(tag) {
        const cleanTag = encodeURIComponent(tag.replace(/^#/, ''));
        const response = await fetch(`/api/royale?path=clans&tag=${cleanTag}`);
        const text = await response.text();
        
        if (!response.ok) throw new Error(`clan lookup failed: ${response.status}`);
        
        return [JSON.parse(text)];
    }

    // search for clans by name and location
    async function searchClansByName(name, locationId) {
        let url = `/api/royale?path=clans&name=${encodeURIComponent(name)}`;
        if (locationId) url += `&locationId=${locationId}`;
        
        const response = await fetch(url);
        const text = await response.text();
        
        if (!response.ok) throw new Error(`clan search failed: ${response.status}`);
        
        const data = JSON.parse(text);
        return data.items || data;
    }

    // reset pagination state
    function resetPagination() {
        allClans = [];
        displayedCount = 0;
        clansList.innerHTML = '';
        showMoreBtn.remove();
    }

    // render next batch of clans
    function renderNextClans() {
        const nextBatch = allClans.slice(displayedCount, displayedCount + clansPerPage);
        
        nextBatch.forEach((clan, index) => {
            const card = createClanCard(clan, displayedCount + index);
            clansList.appendChild(card);
        });
        
        displayedCount += nextBatch.length;
        
        // show/hide show more button
        if (displayedCount < allClans.length) {
            if (!clansList.contains(showMoreBtn)) {
                clansList.appendChild(showMoreBtn);
            }
            showMoreBtn.classList.remove('hidden');
            showMoreBtn.textContent = `Show More (${allClans.length - displayedCount} remaining)`;
        } else {
            showMoreBtn.classList.add('hidden');
        }
    }

    // create individual clan card
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
        
        // get clan type info
        const typeInfo = getClanTypeInfo(clan.type);
        
        // get country flag
        const countryFlag = getCountryFlag(clan.location);
        
        // build the card html
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
                            <span class="stat-label">Members</span>
                            <span class="stat-value">${memberCount}/50</span>
                        </div>
                        <div class="clan-stat">
                            <span class="stat-label">Score</span>
                            <span class="stat-value">${clanScore.toLocaleString()}</span>
                        </div>
                        <div class="clan-stat">
                            <span class="stat-label">War</span>
                            <span class="stat-value">${warTrophies}</span>
                        </div>
                    </div>
                    <div class="clan-details">
                        <div class="clan-type ${typeInfo.className}">
                            ${typeInfo.icon} ${typeInfo.text}
                        </div>
                        <div class="required-trophies">
                            Min: ${requiredTrophies} trophies
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
        
        // add click handler for mobile tap feedback
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
        
        return card;
    }

    // determine clan type and join status
    function getClanTypeInfo(type) {
        switch (type) {
            case 'open':
                return {
                    text: 'Open',
                    icon: '',
                    className: 'open',
                    joinable: true
                };
            case 'inviteOnly':
                return {
                    text: 'Invite Only',
                    icon: '',
                    className: 'invite-only',
                    joinable: false
                };
            case 'closed':
                return {
                    text: 'Closed',
                    icon: '',
                    className: 'closed',
                    joinable: false
                };
            default:
                return {
                    text: 'Unknown',
                    icon: '',
                    className: 'unknown',
                    joinable: false
                };
        }
    }

    // get country flag emoji from country code
    function getCountryFlag(location) {
        if (!location || !location.countryCode) return '';
        
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
        
        return flagMap[countryCode] || '';
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

    function showAllClanSections() {
        clansResultsSection.classList.remove('hidden');
    }

    function hideAllClanSections() {
        clansResultsSection.classList.add('hidden');
        popularClansSection.classList.add('hidden');
    }
});