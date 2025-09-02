// settings.js - makes the settings toggles actually work
// handles invert colors, font size, and sound settings with localStorage persistence

document.addEventListener('DOMContentLoaded', function() {
    console.log('settings page loaded - initializing functional toggles');
    
    // get all the toggle elements
    const invertColoursToggle = document.getElementById('invertColours');
    const fontSizeToggle = document.getElementById('fontSize');
    const soundToggle = document.getElementById('soundToggle');

    // settings keys for localStorage
    const SETTINGS_KEYS = {
        invertColours: 'clash_hub_invert_colours',
        fontSize: 'clash_hub_large_font',
        sound: 'clash_hub_sound_enabled'
    };

    // initialize settings from localStorage or defaults
    initializeSettings();

    // add event listeners to toggles
    if (invertColoursToggle) {
        invertColoursToggle.addEventListener('change', handleInvertColours);
    }
    if (fontSizeToggle) {
        fontSizeToggle.addEventListener('change', handleFontSize);
    }
    if (soundToggle) {
        soundToggle.addEventListener('change', handleSound);
    }

    // INITIALIZE SETTINGS - load saved preferences or set defaults
    function initializeSettings() {
        console.log('loading saved settings from localStorage');

        // load invert colours setting
        const savedInvertColours = localStorage.getItem(SETTINGS_KEYS.invertColours);
        if (savedInvertColours !== null) {
            const isInverted = savedInvertColours === 'true';
            if (invertColoursToggle) {
                invertColoursToggle.checked = isInverted;
            }
            applyInvertColours(isInverted);
        }

        // load font size setting
        const savedFontSize = localStorage.getItem(SETTINGS_KEYS.fontSize);
        if (savedFontSize !== null) {
            const isLargeFont = savedFontSize === 'true';
            if (fontSizeToggle) {
                fontSizeToggle.checked = isLargeFont;
            }
            applyFontSize(isLargeFont);
        }

        // load sound setting
        const savedSound = localStorage.getItem(SETTINGS_KEYS.sound);
        if (savedSound !== null) {
            const isSoundEnabled = savedSound === 'true';
            if (soundToggle) {
                soundToggle.checked = isSoundEnabled;
            }
            // sound setting is stored but doesn't need immediate application
        } else {
            // default sound to enabled if no preference saved
            if (soundToggle) {
                soundToggle.checked = true;
            }
            localStorage.setItem(SETTINGS_KEYS.sound, 'true');
        }
    }

    // INVERT COLOURS HANDLER - switches between dark and light theme
    function handleInvertColours(event) {
        const isInverted = event.target.checked;
        console.log('invert colours toggled:', isInverted);
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.invertColours, isInverted.toString());
        
        // apply the theme change
        applyInvertColours(isInverted);
        
        // play sound effect if enabled
        playSettingsSound();
    }

    // APPLY INVERT COLOURS - actually changes the theme
    function applyInvertColours(isInverted) {
        if (isInverted) {
            // add light theme class to body
            document.body.classList.add('light-theme');
            console.log('applied light theme');
        } else {
            // remove light theme class (back to dark theme)
            document.body.classList.remove('light-theme');
            console.log('applied dark theme');
        }
    }

    // FONT SIZE HANDLER - toggles between normal and large text
    function handleFontSize(event) {
        const isLargeFont = event.target.checked;
        console.log('font size toggled:', isLargeFont ? 'large' : 'normal');
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.fontSize, isLargeFont.toString());
        
        // apply the font size change
        applyFontSize(isLargeFont);
        
        // play sound effect if enabled
        playSettingsSound();
    }

    // APPLY FONT SIZE - actually changes the font sizes
    function applyFontSize(isLargeFont) {
        if (isLargeFont) {
            // add large font class to body
            document.body.classList.add('large-font');
            console.log('applied large font');
        } else {
            // remove large font class (back to normal)
            document.body.classList.remove('large-font');
            console.log('applied normal font');
        }
    }

    // SOUND HANDLER - enables/disables UI sounds
    function handleSound(event) {
        const isSoundEnabled = event.target.checked;
        console.log('sound toggled:', isSoundEnabled ? 'enabled' : 'disabled');
        
        // save to localStorage
        localStorage.setItem(SETTINGS_KEYS.sound, isSoundEnabled.toString());
        
        // play sound effect to confirm (even if disabling sound)
        // this gives immediate feedback that the toggle worked
        playSettingsSound(true); // force play this one time
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

    // UTILITY FUNCTION - check if sound is enabled (for other parts of the app)
    window.isClashHubSoundEnabled = function() {
        return localStorage.getItem('clash_hub_sound_enabled') === 'true';
    };

    // UTILITY FUNCTION - get current font size setting (for other parts of the app)
    window.isClashHubLargeFontEnabled = function() {
        return localStorage.getItem('clash_hub_large_font') === 'true';
    };

    // UTILITY FUNCTION - get current color theme (for other parts of the app)
    window.isClashHubLightThemeEnabled = function() {
        return localStorage.getItem('clash_hub_invert_colours') === 'true';
    };

    console.log('settings functionality initialized successfully');
});