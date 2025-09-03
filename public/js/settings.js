// settings.js - makes the settings toggles and slider actually work
// handles invert colors, font size slider, and sound settings with localStorage persistence

document.addEventListener('DOMContentLoaded', function() {
    console.log('settings page loaded - initializing functional controls');
    
    // get toggle elements (only exist on settings page)
    const invertColoursToggle = document.getElementById('invertColours');
    const fontSizeSlider = document.getElementById('fontSize');
    const soundToggle = document.getElementById('soundToggle');
    const currentFontSize = document.getElementById('currentFontSize');
    const resetButton = document.getElementById('resetSettings');

    // settings keys for localStorage
    const SETTINGS_KEYS = {
        invertColours: 'clash_hub_invert_colours',
        fontSize: 'clash_hub_large_font',
        sound: 'clash_hub_sound_enabled'
    };

    // initialize settings controls
    initializeSettingsControls();

    // INITIALIZE SETTINGS CONTROLS - only runs on settings page
    function initializeSettingsControls() {
        // load invert colours setting and set toggle
        const savedInvertColours = localStorage.getItem(SETTINGS_KEYS.invertColours);
        if (savedInvertColours !== null && invertColoursToggle) {
            const isInverted = savedInvertColours === 'true';
            if (isInverted) {
                invertColoursToggle.classList.add('active');
            } else {
                invertColoursToggle.classList.remove('active');
            }
            applyInvertColours(isInverted);
        }

        // load font size setting and set slider
        const savedFontSize = localStorage.getItem(SETTINGS_KEYS.fontSize);
        if (savedFontSize !== null && fontSizeSlider) {
            const fontSize = parseInt(savedFontSize) || 100;
            fontSizeSlider.value = fontSize;
            updateFontSizeDisplay(fontSize);
            applyFontSize(fontSize);
        } else if (fontSizeSlider) {
            // default to 100%
            fontSizeSlider.value = 100;
            updateFontSizeDisplay(100);
        }

        // load sound setting and set toggle
        const savedSound = localStorage.getItem(SETTINGS_KEYS.sound);
        if (savedSound !== null && soundToggle) {
            const isSoundEnabled = savedSound === 'true';
            if (isSoundEnabled) {
                soundToggle.classList.add('active');
            } else {
                soundToggle.classList.remove('active');
            }
        } else if (soundToggle) {
            // default sound to enabled
            soundToggle.classList.add('active');
            localStorage.setItem(SETTINGS_KEYS.sound, 'true');
        }

        // add event listeners to controls
        if (invertColoursToggle) {
            invertColoursToggle.addEventListener('click', handleInvertColours);
        }
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', handleFontSize);
        }
        if (soundToggle) {
            soundToggle.addEventListener('click', handleSound);
        }
        if (resetButton) {
            resetButton.addEventListener('click', handleResetSettings);
        }
    }

    // INVERT COLOURS HANDLER - switches between dark and light theme
    function handleInvertColours() {
        const isInverted = invertColoursToggle.classList.contains('active');
        const newState = !isInverted;
        
        console.log('invert colours toggled:', newState);
        
        // update toggle appearance
        if (newState) {
            invertColoursToggle.classList.add('active');
        } else {
            invertColoursToggle.classList.remove('active');
        }
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.invertColours, newState.toString());
        
        // apply the theme change
        applyInvertColours(newState);
        
        // play sound effect if enabled
        playSettingsSound();
    }

    // FONT SIZE HANDLER - handles slider input for font scaling
    function handleFontSize(event) {
        const fontSize = parseInt(event.target.value);
        console.log('font size changed to:', fontSize + '%');
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.fontSize, fontSize.toString());
        
        // update display
        updateFontSizeDisplay(fontSize);
        
        // apply the font size change
        applyFontSize(fontSize);
        
        // play sound effect if enabled
        playSettingsSound();
    }

    // SOUND HANDLER - enables/disables UI sounds
    function handleSound() {
        const isSoundEnabled = soundToggle.classList.contains('active');
        const newState = !isSoundEnabled;
        
        console.log('sound toggled:', newState ? 'enabled' : 'disabled');
        
        // update toggle appearance
        if (newState) {
            soundToggle.classList.add('active');
        } else {
            soundToggle.classList.remove('active');
        }
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.sound, newState.toString());
        
        // play sound effect to confirm (even if disabling sound)
        playSettingsSound(true);
    }

    // RESET SETTINGS HANDLER - resets all settings to defaults
    function handleResetSettings() {
        console.log('resetting all settings to defaults');
        
        // confirm with user
        if (!confirm('Reset all settings to default? This will reload the page.')) {
            return;
        }
        
        // clear all settings from localStorage
        localStorage.removeItem(SETTINGS_KEYS.invertColours);
        localStorage.removeItem(SETTINGS_KEYS.fontSize);
        localStorage.removeItem(SETTINGS_KEYS.sound);
        
        // play confirmation sound
        playSettingsSound(true);
        
        // reload page to apply defaults
        setTimeout(() => {
            location.reload();
        }, 300);
    }

    // UPDATE FONT SIZE DISPLAY - updates the percentage shown next to slider
    function updateFontSizeDisplay(fontSize) {
        if (currentFontSize) {
            currentFontSize.textContent = fontSize + '%';
        }
    }

    // APPLY INVERT COLOURS - actually changes the theme
    function applyInvertColours(isInverted) {
        if (isInverted) {
            document.body.classList.add('light-theme');
            console.log('applied light theme');
        } else {
            document.body.classList.remove('light-theme');
            console.log('applied dark theme');
        }
    }

    // APPLY FONT SIZE - actually changes the font sizes using percentage scaling
    function applyFontSize(fontSize) {
        document.body.style.fontSize = fontSize + '%';
        console.log('applied font size:', fontSize + '%');
    }

    // PLAY SETTINGS SOUND - plays a UI sound effect when settings change
    function playSettingsSound(forcePlay = false) {
        // check if sound is enabled (unless we're forcing it)
        const isSoundEnabled = localStorage.getItem(SETTINGS_KEYS.sound) === 'true';
        
        if (!isSoundEnabled && !forcePlay) {
            return; // sound disabled, don't play
        }

        try {
            // create a short beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // connect audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // set sound properties - pleasant UI beep
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz tone
            oscillator.type = 'sine'; // smooth sine wave

            // volume envelope - quick fade out
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // low volume
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            // play sound for 100ms
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);

        } catch (error) {
            // fallback - if Web Audio API fails, just log it
            console.log('settings sound played (audio not available)');
        }
    }

    // APPLY SETTINGS ON ALL PAGES - this runs on every page load
    applyAllSettings();

    function applyAllSettings() {
        // apply saved font size
        const savedFontSize = localStorage.getItem(SETTINGS_KEYS.fontSize);
        if (savedFontSize !== null) {
            const fontSize = parseInt(savedFontSize) || 100;
            document.body.style.fontSize = fontSize + '%';
        }

        // apply saved theme
        const savedInvertColours = localStorage.getItem(SETTINGS_KEYS.invertColours);
        if (savedInvertColours === 'true') {
            document.body.classList.add('light-theme');
        }
    }

    // UTILITY FUNCTION - check if sound is enabled (for other parts of the app)
    window.isClashHubSoundEnabled = function() {
        return localStorage.getItem('clash_hub_sound_enabled') === 'true';
    };

    // UTILITY FUNCTION - get current font size setting (for other parts of the app)
    window.isClashHubLargeFontEnabled = function() {
        const fontSize = localStorage.getItem('clash_hub_large_font');
        return parseInt(fontSize) || 100;
    };

    // UTILITY FUNCTION - get current color theme (for other parts of the app)
    window.isClashHubLightThemeEnabled = function() {
        return localStorage.getItem('clash_hub_invert_colours') === 'true';
    };

    console.log('settings functionality initialized successfully');
});