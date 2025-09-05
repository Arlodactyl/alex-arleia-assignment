// clans.js - handles the clan search page functionality
// searches for clans by tag/name and location from clash royale api

document.addEventListener('DOMContentLoaded', function () {
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

  clanSearchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      handleClanSearch();
    }
  });

  showMoreBtn.addEventListener('click', function () {
    renderNextClans();
  });

  // main search function with fuzzy matching and case insensitive search
  async function handleClanSearch() {
    const searchQuery = clanSearchInput.value.trim();
    const locationId = locationSelect.value;

    if (!searchQuery) {
      showError('need a clan tag or name to search');
      return;
    }

    // determine search type - make case insensitive
    const upperQuery = searchQuery.toUpperCase();
    const isTagSearch =
      upperQuery.startsWith('#') || upperQuery.match(/^[A-Z0-9]{3,}$/);
    const locationText =
      locationSelect.options[locationSelect.selectedIndex]?.text || '';

    // show what we're searching for
    if (searchText && currentSearchBar) {
      const searchDisplay = isTagSearch
        ? `Tag: ${upperQuery}`
        : `Name: "${searchQuery}"`;
      searchText.textContent = locationId
        ? `${searchDisplay} in ${locationText}`
        : searchDisplay;
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
        // make tag uppercase for API
        clans = await searchClanByTag(upperQuery);
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
    if (currentSearchBar) currentSearchBar.classList.add('hidden');

    // reset pagination
    resetPagination();

    // focus back to search input
    clanSearchInput.focus();
  }

  // fuzzy search that tries multiple variations - case insensitive
  async function fuzzyNameSearch(name, locationId) {
    const searchVariations = generateSearchVariations(name);

    for (const variation of searchVariations) {
      try {
        const results = await searchClansByName(variation, locationId);
        if (results && results.length > 0) {
          console.log(`found results with variation: "${variation}"`);
          return results;
        }
      } catch {
        console.log(`no results for variation: "${variation}"`);
        continue;
      }
    }

    return []; // no results found
  }

  // generates search variations for better matching - handles case variations
  function generateSearchVariations(name) {
    const variations = [];

    // original search as-is
    variations.push(name);

    // try different case combinations
    variations.push(name.toLowerCase());
    variations.push(name.toUpperCase());

    // capitalize first letter of each word
    const titleCase = name.replace(/\b\w/g, (l) => l.toUpperCase());
    if (titleCase !== name) variations.push(titleCase);

    // remove special characters
    const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (cleaned !== name) {
      variations.push(cleaned);
      variations.push(cleaned.toLowerCase());
      variations.push(cleaned.toUpperCase());
    }

    // try first few words only
    const words = name.split(' ').filter(Boolean);
    if (words.length > 1) {
      variations.push(words[0]); // first word only
      variations.push(words[0].toLowerCase());
      variations.push(words[0].toUpperCase());

      const firstTwo = words.slice(0, 2).join(' ');
      variations.push(firstTwo); // first two words
      variations.push(firstTwo.toLowerCase());
      variations.push(firstTwo.toUpperCase());
    }

    // try shorter versions if name is long
    if (name.length > 8) {
      const short6 = name.substring(0, 6);
      variations.push(short6, short6.toLowerCase(), short6.toUpperCase());

      const short4 = name.substring(0, 4);
      variations.push(short4, short4.toLowerCase(), short4.toUpperCase());
    }

    // remove duplicates and return
    return [...new Set(variations)];
  }

  // search for specific clan by tag - case insensitive
  async function searchClanByTag(tag) {
    // ensure tag is uppercase and clean for API
    const cleanTag = encodeURIComponent(tag.toUpperCase().replace(/^#/, ''));
    const response = await fetch(`/api/royale?path=clans&tag=${cleanTag}`);
    const text = await response.text();

    if (!response.ok)
      throw new Error(`clan lookup failed: ${response.status}`);

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
    if (clansList) clansList.innerHTML = '';
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
    const memberCount = clan.members ?? 0;
    const requiredTrophies = clan.requiredTrophies ?? 0;
    const clanScore = clan.clanScore ?? clan.trophies ?? 0;
    const warTrophies = clan.clanWarTrophies ?? 0;
    const locationName = clan.location?.name ?? 'Unknown';
    const description = clan.description ?? 'No description available';

    // get clan type info
    const typeInfo = getClanTypeInfo(clan.type);

    // get country flag
    const countryFlag = getCountryFlag(clan.location);

    const cleanTag = String(clan.tag || '').replace(/^#/, '');

    // build the card html (fixed stray `$` and closed template literal)
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
              <h4 class="clan-name">${escapeHTML(clan.name || 'Unknown')}</h4>
              <div class="clan-tag">#${escapeHTML(cleanTag)}</div>
            </div>
            <div class="clan-location">
              ${countryFlag} ${escapeHTML(locationName)}
            </div>
          </div>
          <div class="clan-stats-row">
            <div class="clan-stat">
              <span class="stat-label">Members</span>
              <span class="stat-value">${memberCount}/50</span>
            </div>
            <div class="clan-stat">
              <span class="stat-label">Score</span>
              <span class="stat-value">${Number(clanScore).toLocaleString()}</span>
            </div>
            <div class="clan-stat">
              <span class="stat-label">War</span>
              <span class="stat-value">${warTrophies}</span>
            </div>
            <div class="clan-stat">
              <span class="stat-label">Req. Trophies</span>
              <span class="stat-value">${requiredTrophies}</span>
            </div>
          </div>
          <div class="clan-details">
            <div class="clan-type ${escapeHTML(typeInfo.className || '')}">
              ${typeInfo.icon || ''} ${escapeHTML(typeInfo.label || '')}
            </div>
            <p class="clan-description">${escapeHTML(description)}</p>
          </div>
          <div class="clan-actions">
            <a class="view-clan-btn" href="./clan.html?tag=${encodeURIComponent(cleanTag)}">View clan</a>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // ===== UI helpers (mirroring player.js style) =====
  function showLoading(show) {
    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !show);
  }

  function showError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    if (errorMessage) errorMessage.classList.add('hidden');
  }

  function showAllClanSections() {
    if (clansResultsSection) clansResultsSection.classList.remove('hidden');
    if (popularClansSection) popularClansSection.classList.remove('hidden');
  }

  function hideAllClanSections() {
    if (clansResultsSection) clansResultsSection.classList.add('hidden');
    if (popularClansSection) popularClansSection.classList.add('hidden');
  }

  // ===== Safe text / display helpers =====
  function escapeHTML(str = '') {
    return String(str).replace(/[&<>"']/g, (m) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
  }

  function getClanTypeInfo(type = 'open') {
    const map = {
      open: { className: 'type-open', icon: '🔓', label: 'Open' },
      inviteOnly: { className: 'type-invite', icon: '✉️', label: 'Invite only' },
      closed: { className: 'type-closed', icon: '🔒', label: 'Closed' },
    };
    return map[type] || {
      className: 'type-unknown',
      icon: '❔',
      label: String(type || 'Unknown'),
    };
  }

  function getCountryFlag(location) {
    if (!location) return '🌐';
    if (location.isCountry && location.countryCode) {
      return countryCodeToEmoji(location.countryCode);
    }
    return '🌐';
  }

  function countryCodeToEmoji(cc = '') {
    const base = 127397;
    return cc
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 2)
      .split('')
      .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
      .join('');
  }
});
