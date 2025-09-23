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
     */
    function applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        console.log(`Theme applied: ${themeName}`); // Debug message
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
     * Gets the user's preferred color scheme from the browser/OS settings.
     * @returns {string} 'dark' or 'light'.
     */
    function getSystemPreference() {
        // This project doesn't have a dark/light mode distinction in that way,
        // so we will default to the project's default theme.
        return 'default'; 
    }

    /**
     * Public method to set and persist the application theme.
     * @param {string} themeName - The theme to set.
     */
    function setTheme(themeName) {
        applyTheme(themeName);
        saveThemePreference(themeName);
    }

    /**
     * Initializes the theme on application startup.
     * It prioritizes:
     * 1. A theme saved in localStorage.
     * 2. A default of 'default'.
     */
    function initialize() {
        const savedTheme = getSavedThemePreference();
        if (savedTheme) {
            applyTheme(savedTheme);
            console.log(`Loaded theme '${savedTheme}' from localStorage.`);
        } else {
            const defaultTheme = getSystemPreference();
            applyTheme(defaultTheme);
            console.log(`No saved theme found, applying default: '${defaultTheme}'`);
        }
    }

    // --- Initialize on script load ---
    initialize();

    // --- Expose public methods ---
    return {
        set: setTheme,
        getSaved: getSavedThemePreference,
        initialize: initialize
    };
})();

// Exporting for use in other modules
export { themeManager };
