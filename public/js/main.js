// Main application entry point
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { initializeAdminMode } from './admin/admin-mode.js';
import { initializeAdminPanel } from './admin/admin-panel.js';

// State
export let siteData = {};

// Functions
async function loadComponent(path, containerId) {
    const response = await fetch(path);
    document.getElementById(containerId).innerHTML = await response.text();
}

async function loadAllData(db) {
    const [configDoc] = await Promise.all([
        getDoc(doc(db, "site_config", "main")),
    ]);
    siteData.config = configDoc.exists() ? configDoc.data() : {};
}

export function renderAll() {
    const activeTheme = localStorage.getItem('selectedTheme') || 'default';
    document.body.className = '';
    document.body.classList.add(`${activeTheme}-theme`);

    const siteLogo = document.getElementById('site-logo');
    if (siteLogo && siteData.config.logoUrls && siteData.config.logoUrls[activeTheme]) {
        siteLogo.src = siteData.config.logoUrls[activeTheme];
    } else if (siteLogo) {
        siteLogo.src = 'images/logo.svg';
    }
}

function initializeThemeSwitcher() {
    document.querySelectorAll('.theme-switcher').forEach(switcher => {
        const toggle = switcher.querySelector('.dropdown-toggle');
        const menu = switcher.querySelector('.dropdown-menu');
        const themeNameSpan = switcher.querySelector('.theme-name');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        menu.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const newTheme = e.target.dataset.value;
                localStorage.setItem('selectedTheme', newTheme);
                renderAll();
                if(themeNameSpan) themeNameSpan.textContent = e.target.textContent;
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

    initializeMobileMenu();
    initFestivalCarousel();
    initializeAdminMode();
    initializeAdminPanel(db, auth, loadAllData);
    initializeThemeSwitcher();
    renderAll();
});