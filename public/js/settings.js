<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Settings - Clash Hub</title>
  <!-- Link to our separate CSS file -->
  <link rel="stylesheet" href="./css/styles.css" />
</head>
<body>
  <!-- slide-out nav hidden by default opens from left -->
  <aside id="drawer" class="drawer" aria-hidden="true">
    <!-- Logo section at top of drawer -->
    <div class="drawer-header">
      <img src="./assets/logo-full-light.png" alt="Clash Hub Logo" class="drawer-logo" />
    </div>
    
    <!-- Main navigation links with images in the assets folder -->
    <ul class="nav-list">
      <!-- main pages -->
      <li class="nav-item">
        <a href="./index.html">
          <img src="./assets/crown.png" alt="Home" />
          <span>Home</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="./player.html">
          <img src="./assets/user.png" alt="Player Profile" />
          <span>Player Profile</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="./matches.html">
          <img src="./assets/trophy.png" alt="Recent Matches" />
          <span>Recent Matches</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="./clans.html">
          <img src="./assets/magnifier.png" alt="Clan Search" />
          <span>Clan Search</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="./settings.html">
          <img src="./assets/settings.png" alt="Settings" />
          <span>Settings</span>
        </a>
      </li>
    </ul>

    <!-- Secondary links at bottom less frequently used pages -->
    <div class="drawer-footer">
      <a href="./videos.html" class="footer-link">Video Archive</a>
      <a href="./news.html" class="footer-link">News</a>
      <a href="./terms.html" class="footer-link">Terms of Service</a>
    </div>
  </aside>

  <!-- pull-tab arrow that peeks from left closer to content now -->
  <button id="drawerTab" class="drawer-tab" aria-label="Open menu">
    <span style="color: white; font-size: 14px;">→</span>
  </button>

  <!-- translucent overlay when drawer is open -->
  <div id="backdrop" class="backdrop"></div>

  <div class="app">

    <!-- HEADER -->
    <header class="header">
      <!-- hamburger clicking opens drawer like the site you showed -->
      <button id="hamburger" class="hamburger" aria-label="Open menu">
        <span class="bars"><span class="line"></span></span>
      </button>

      <!-- Logo and brand no title text needed since logo includes it -->
      <div class="brand">
        <img src="./assets/logo-full-light.png" alt="Clash Hub Logo" class="brand__logo" />
      </div>

      <button class="icon-btn" title="Settings">
        <img src="./assets/settings.png" alt="Settings" />
      </button>
    </header>

    <!-- greeting like other pages -->
    <div class="hi">App Settings</div>

    <!-- SETTINGS SECTION matches other Clash Hub pages -->
    <section class="settings-section">
      <h3>PREFERENCES</h3>
      
      <!-- INVERT COLOURS SETTING -->
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Light Theme</div>
          <div class="setting-description">Switch between dark and light color themes</div>
        </div>
        <div class="setting-control">
          <button type="button" id="invertColours" class="toggle-switch">
            <span class="toggle-handle"></span>
          </button>
        </div>
      </div>

      <!-- FONT SIZE SETTING - Now with slider -->
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Font Size</div>
          <div class="setting-description">Adjust text size from 100% to 200%</div>
        </div>
        <div class="setting-control">
          <div class="font-size-control">
            <input type="range" id="fontSize" class="font-size-slider" min="100" max="200" step="10" value="100">
            <span id="fontSizeDisplay" class="font-size-display">100%</span>
          </div>
        </div>
      </div>

      <!-- SOUND SETTING -->
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Sound Effects</div>
          <div class="setting-description">Enable or disable UI sound feedback</div>
        </div>
        <div class="setting-control">
          <button type="button" id="soundToggle" class="toggle-switch active">
            <span class="toggle-handle"></span>
          </button>
        </div>
      </div>

      <!-- Reset button -->
      <button id="resetSettings" class="reset-settings-btn">Reset All Settings</button>
    </section>

    <!-- FOOTER WITH SOCIAL ICONS this will be on all pages -->
    <footer class="footer">
      <div class="social-icons">
        <!-- YouTube this is where our real YouTube channel link would be if this was a real deployment -->
        <a href="https://youtube.com" target="_blank" class="social-link" title="YouTube">
          <img src="./assets/youtube.png" alt="YouTube" />
        </a>
        <!-- Discord this is where our real Discord server invite would be if this was a real deployment -->
        <a href="https://discord.com" target="_blank" class="social-link" title="Discord">
          <img src="./assets/discord.png" alt="Discord" />
        </a>
        <!-- Instagram this is where our real Instagram profile would be if this was a real deployment -->
        <a href="https://instagram.com" target="_blank" class="social-link" title="Instagram">
          <img src="./assets/instagram.png" alt="Instagram" />
        </a>
        <!-- Facebook this is where our real Facebook page would be if this was a real deployment -->
        <a href="https://facebook.com" target="_blank" class="social-link" title="Facebook">
          <img src="./assets/facebook.png" alt="Facebook" />
        </a>
      </div>
      <div class="footer-text">
        <p>&copy; 2025 Clash Hub. Follow us for the latest updates!</p>
      </div>
    </footer>

  </div>

  <!-- tiny JS to handle drawer open close no framework -->
  <script>
    const drawer = document.getElementById('drawer');
    const tab = document.getElementById('drawerTab');
    const burger = document.getElementById('hamburger');
    const backdrop = document.getElementById('backdrop');

    function openDrawer() {
      drawer.classList.add('open');
      backdrop.classList.add('show');
      drawer.setAttribute('aria-hidden', 'false');
    }
    
    function closeDrawer() {
      drawer.classList.remove('open');
      backdrop.classList.remove('show');
      drawer.setAttribute('aria-hidden', 'true');
    }

    burger.addEventListener('click', openDrawer);
    tab.addEventListener('click', openDrawer);
    backdrop.addEventListener('click', closeDrawer);

    window.addEventListener('keydown', (e)=>{ 
      if(e.key === 'Escape') closeDrawer(); 
    });
  </script>

  <!-- Settings page functionality -->
  <script src="./js/settings.js"></script>
</body>
</html>