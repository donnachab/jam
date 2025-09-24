import { siteData } from '../main.js';

/**
 * Manages the application's visual theme.
 * - Applies a theme by setting a 'data-theme' attribute on the <html> element.
 * - Persists the user's theme choice in localStorage.
 * - Initializes the theme on page load from localStorage or system preference.
 */
const themeManager = (() => {
    const THEME_STORAGE_KEY = 'app-theme';

    /**
     * Applies the specified theme to the document.
     * @param {string} themeName - The name of the theme to apply (e.g., 'light', 'dark').
     * @param {string|null} temporaryLogoUrl - An optional, temporary URL for the logo.
     */
    function applyTheme(themeName, temporaryLogoUrl = null) {
        document.documentElement.setAttribute('data-theme', themeName);
        console.log(`Theme applied: ${themeName}`);

        const siteLogo = document.getElementById('site-logo');
        if (!siteLogo) return;

        if (temporaryLogoUrl) {
            siteLogo.src = temporaryLogoUrl;
        } else {
            const logoUrl = siteData.config?.logoUrls?.[themeName] || 'images/logo.svg';
            siteLogo.src = logoUrl;
        }
    }

    /**
     * Saves the user's theme preference to localStorage.
     * @param {string} themeName - The name of the theme to save.
     */
    function saveThemePreference(themeName) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, themeName);
        } catch (error) {
            console.error('Failed to save theme preference to localStorage:', error);
        }
    }

    /**
     * Retrieves the saved theme preference from localStorage.
     * @returns {string|null} The saved theme name or null if not found.
     */
    function getSavedThemePreference() {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to get theme preference from localStorage:', error);
            return null;
        }
    }

    /**
     * Public method to set and persist the application theme.
     * @param {string} themeName - The theme to set.
     * @param {string|null} temporaryLogoUrl - An optional, temporary URL for the logo.
     */
    function setTheme(themeName, temporaryLogoUrl = null) {
        applyTheme(themeName, temporaryLogoUrl);
        saveThemePreference(themeName);
    }

    /**
     * Initializes the theme on application startup.
     */
    function initialize() {
        const savedTheme = getSavedThemePreference() || 'default';
        applyTheme(savedTheme);
    }

    // --- Expose public methods ---
    return {
        set: setTheme,
        getSaved: getSavedThemePreference,
        initialize: initialize
    };
})();

// Exporting for use in other modules
export { themeManager };