// Main application entry point
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { initializeAdminMode } from './admin/admin-mode.js';
import { initializeAdminPanel } from './admin/admin-panel.js';
import { themeManager } from './ui/theme-switcher.js';

// State
export let siteData = {};

// Functions
async function loadComponent(path, containerId) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load component: ${path}`);
        document.getElementById(containerId).innerHTML = await response.text();
    } catch (error) {
        console.error(error);
    }
}

async function loadAllData(db) {
    try {
        const configDoc = await getDoc(doc(db, "site_config", "main"));
        siteData.config = configDoc.exists() ? configDoc.data() : {};
    } catch (error) {
        console.error("Failed to load site configuration:", error);
    }
}

// Renders just the site logo based on the current theme
export function renderLogo(theme) {
    const siteLogo = document.getElementById('site-logo');
    if (!siteLogo) return;

    const logoUrl = siteData.config?.logoUrls?.[theme] || 'images/logo.svg';
    siteLogo.src = logoUrl;
}

function initializeThemeSwitcher() {
    document.querySelectorAll('.theme-switcher').forEach(switcher => {
        const toggle = switcher.querySelector('.dropdown-toggle');
        const menu = switcher.querySelector('.dropdown-menu');
        const themeNameSpan = switcher.querySelector('.theme-name');

        if (!toggle || !menu) return;

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        menu.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const newTheme = e.target.dataset.value;
                themeManager.set(newTheme); // Use the new theme manager
                renderLogo(newTheme); // Re-render the logo for the new theme
                if (themeNameSpan) themeNameSpan.textContent = e.target.textContent;
                menu.classList.add('hidden');
            }
        });
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
    });
}

// Main Execution
document.addEventListener("DOMContentLoaded", async () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    await signInAnonymously(auth);

    await Promise.all([
        loadComponent('components/header.html', 'header-container'),
        loadComponent('components/hero.html', 'hero-container'),
        loadComponent('components/footer.html', 'footer-container'),
        loadComponent('components/admin/admin-panel.html', 'admin-panel-container'),
    ]);

    await loadAllData(db);

    // The themeManager initializes itself on import, setting the theme.
    // Now we just need to render the logo for the loaded theme.
    renderLogo(themeManager.getSaved() || 'default');

    initializeMobileMenu();
    initFestivalCarousel();
    initializeAdminMode();
    initializeAdminPanel(loadAllData); // Pass loadAllData instead of db/auth
    initializeThemeSwitcher();
});
