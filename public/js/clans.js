// clans.js - handles the clan search page functionality
// searches for clans by tag/name and location from clash royale api
// now includes:
//   - results limited to 20 initially
//   - Show More button to reveal additional clans
//   - optional flag emojis based on countryCode
//   - refresh button to re-render current results
//   - mobile autofocus and responsive tweaks
//   - re-added joinable tick/cross icons

// wait until the whole page is loaded before running anything

// SETUP SECTION

// wraps all logic to ensure it runs after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('clan search page loaded');

    // grab all the DOM elements we need to work with
    const clanSearchInput = document.getElementById('clanSearchInput');
    const locationSelect = document.getElementById('locationSelect');
    const searchClansBtn = document.getElementById('searchClansBtn');
    const refreshBtn = document.getElementById('refreshClansBtn'); // added this so user can refresh results
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const clansResultsSection = document.getElementById('clansResultsSection');
    const popularClansSection = document.getElementById('popularClansSection');
    const clansList = document.getElementById('clansList');
    const currentSearchBar = document.getElementById('currentSearchBar');
    const searchText = document.getElementById('searchText');

    // add the show more button manually in JS
    let showMoreBtn = document.createElement('button');
    showMoreBtn.textContent = 'Show More';
    showMoreBtn.className = 'show-more-btn';
    showMoreBtn.classList.add('hidden');
    clansResultsSection.appendChild(showMoreBtn);

    // store state of all found clans
    let allClans = [];
    let displayedCount = 0;

    // EVENTS

    // button to run search
    searchClansBtn.addEventListener('click', handleClanSearch);

    // support enter key for convenience
    clanSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleClanSearch();
    });

    // button for show more
    showMoreBtn.addEventListener('click', function() {
        renderNextClans();
    });

    // optional: button to re-render current batch
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            clansList.innerHTML = '';
            displayedCount = 0;
            renderNextClans();
        });
    }

    // main search function - this triggers the API call
    async function handleClanSearch() {
        const searchQuery = clanSearchInput.value.trim();
        const locationId = locationSelect.value;

        if (!searchQuery) {
            showError('Need a clan tag or name to search.');
            return;
        }

        const isTagSearch = searchQuery.startsWith('#') || searchQuery.match(/^[A-Z0-9]{3,}$/i);
        const locationText = locationSelect.options[locationSelect.selectedIndex].text;

        if (searchText && currentSearchBar) {
            const searchDisplay = isTagSearch ? `Tag: ${searchQuery}` : `Name: "${searchQuery}"`;
            searchText.textContent = locationId ? `${searchDisplay} in ${locationText}` : searchDisplay;
            currentSearchBar.classList.remove('hidden');
        }

        showLoading(true);
        hideError();
        hideAllClanSections();
        clansList.innerHTML = '';

        try {
            let clans = isTagSearch
                ? await searchClanByTag(searchQuery)
                : await searchClansByName(searchQuery, locationId);

            if (!clans || clans.length === 0) {
                showError('No clans found for this search.');
                return;
            }

            allClans = clans;
            displayedCount = 0;

            renderNextClans(); // load first 20
            showAllClanSections();

        } catch (error) {
            console.error('Error searching clans:', error);
            showError('Failed to find clans. Check your search terms.');
        } finally {
            showLoading(false);
        }
    }

    function renderNextClans() {
        const slice = allClans.slice(displayedCount, displayedCount + 20);
        slice.forEach((clan, index) => {
            const card = createClanCard(clan, displayedCount + index);
            clansList.appendChild(card);
        });

        displayedCount += slice.length;

        if (displayedCount < allClans.length) {
            showMoreBtn.classList.remove('hidden');
        } else {
            showMoreBtn.classList.add('hidden');
        }
    }

    async function searchClanByTag(tag) {
        const cleanTag = encodeURIComponent(tag.replace(/^#/, ''));
        const response = await fetch(`/api/royale?path=clans&tag=${cleanTag}`);
        const text = await response.text();
        if (!response.ok) throw new Error(text);
        return [JSON.parse(text)];
    }

    async function searchClansByName(name, locationId) {
        let url = `/api/royale?path=clans&name=${encodeURIComponent(name)}`;
        if (locationId) url += `&locationId=${locationId}`;
        const response = await fetch(url);
        const text = await response.text();
        if (!response.ok) throw new Error(text);
        const data = JSON.parse(text);
        return data.items || data;
    }

    function createClanCard(clan) {
        const card = document.createElement('div');
        card.className = 'clan-card';

        const flagEmoji = getCountryFlag(clan.location);
        const joinable = clan.type === 'open';

        card.innerHTML = `
            <div class="clan-card-content">
                <div class="clan-card-center">
                    <div class="clan-card-header">
                        <div class="clan-name-section">
                            <h4 class="clan-name">${clan.name}</h4>
                            <div class="clan-tag">${clan.tag}</div>
                        </div>
                        <div class="clan-location">${flagEmoji} ${clan.location?.name || 'Unknown'}</div>
                    </div>
                    <div class="clan-stats-row">
                        <span><strong>Members:</strong> ${clan.members || 0}/50</span>
                        <span><strong>Score:</strong> ${clan.clanScore?.toLocaleString() || 0}</span>
                        <span><strong>War:</strong> ${clan.clanWarTrophies || 0}</span>
                    </div>
                    <div class="clan-description">
                        ${clan.description ? clan.description.slice(0, 100) + '...' : 'No description available'}
                    </div>
                    <div class="clan-joinable-status">
                        <strong>Joinable:</strong> ${joinable ? '✓' : '✗'}
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    function getCountryFlag(location) {
        if (!location || !location.countryCode) return '🌍';
        const code = location.countryCode.toUpperCase();
        return code.replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
    }

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

    // mobile enhancement - autofocus input
    if (window.innerWidth <= 480) {
        clanSearchInput.setAttribute('autofocus', 'true');
    }
});
