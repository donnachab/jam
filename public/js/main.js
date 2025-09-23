// Main application entry point
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// UI and Component Initializers
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { themeManager } from './ui/theme-switcher.js';
import { initializeAdminMode } from './admin/admin-mode.js';
import { initializeAdminPanel } from './admin/admin-panel.js';
import { renderJams, initializeJams } from './jams.js';
import { renderEvents, initializeEvents } from './events.js';
import { renderGallery, initializeGallery } from './gallery.js';
import { renderCommunity, initializeCommunity } from './community.js';

// Global State
export let siteData = {};

// --- DATA LOADING --- //
async function loadAllData(db) {
    try {
        const [configDoc, jamsSnap, venuesSnap, eventsSnap, gallerySnap, communitySnap] = await Promise.all([
            getDoc(doc(db, "site_config", "main")),
            getDocs(collection(db, "jams")),
            getDocs(collection(db, "venues")),
            getDocs(collection(db, "events")),
            getDocs(collection(db, "gallery")),
            getDocs(collection(db, "community")),
        ]);

        siteData.config = configDoc.exists() ? configDoc.data() : {};
        siteData.jams = jamsSnap.docs.map(doc => doc.data());
        siteData.venues = venuesSnap.docs.map(doc => doc.data());
        siteData.events = eventsSnap.docs.map(doc => doc.data());
        siteData.gallery = gallerySnap.docs.map(doc => doc.data());
        siteData.community = communitySnap.docs.map(doc => doc.data());

        console.log("✅ All Firebase data loaded.");

    } catch (error) {
        console.error("Failed to load site data:", error);
    }
}

// --- RENDERING --- //

// Renders all components with the loaded data
function renderAllComponents() {
    if (!siteData) {
        console.error("Site data not available for rendering.");
        return;
    }
    renderHero();
    renderLogo(themeManager.getSaved() || 'default');
    renderJams(siteData.jams, siteData.venues, siteData.config);
    renderEvents(siteData.events, siteData.venues);
    renderGallery(siteData.gallery, siteData.config);
    renderCommunity(siteData.community);
    console.log("✅ All components rendered.");
}

// Renders just the site logo based on the current theme
function renderLogo(theme) {
    const siteLogo = document.getElementById('site-logo');
    if (!siteLogo) return;
    const logoUrl = siteData.config?.logoUrls?.[theme] || 'images/logo.svg';
    siteLogo.src = logoUrl;
}

// Renders the hero image
function renderHero() {
    const heroImage = document.getElementById('cover-photo');
    if (heroImage && siteData.config?.coverPhotoUrl) {
        heroImage.src = siteData.config.coverPhotoUrl;
    }
}

// --- INITIALIZATION --- //

function initializeThemeSwitcher() {
    document.querySelectorAll('.theme-switcher').forEach(switcher => {
        const select = switcher.querySelector('select');
        if (!select) return;

        // Set initial value
        select.value = themeManager.getSaved() || 'default';

        select.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            themeManager.set(newTheme);
            renderLogo(newTheme);
        });
    });
}

async function refreshDataAndRender(db) {
    await loadAllData(db);
    renderAllComponents();
}

// --- MAIN EXECUTION --- //
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await signInAnonymously(auth);

    // Load all HTML components
    await Promise.all([
        loadComponent('components/header.html', 'header-container'),
        loadComponent('components/hero.html', 'hero-container'),
        loadComponent('components/jams.html', 'jams-container'),
        loadComponent('components/format.html', 'format-container'),
        loadComponent('components/events.html', 'events-container'),
        loadComponent('components/community.html', 'community-container'),
        loadComponent('components/gallery.html', 'gallery-container'),
        loadComponent('components/contact.html', 'contact-container'),
        loadComponent('components/footer.html', 'footer-container'),
        loadComponent('components/admin/admin-panel.html', 'admin-panel-container'),
    ]);

    // Load all data from Firestore
    await refreshDataAndRender(db);

    // Initialize all interactive modules
    themeManager.initialize();
    initializeThemeSwitcher();
    initializeMobileMenu();
    initFestivalCarousel();
    initializeAdminMode(db, auth, () => refreshDataAndRender(db));
    initializeAdminPanel(() => refreshDataAndRender(db));
    initializeJams(siteData.venues, () => refreshDataAndRender(db));
    initializeEvents(siteData.venues, () => refreshDataAndRender(db));
    initializeGallery(() => refreshDataAndRender(db));
    initializeCommunity(() => refreshDataAndRender(db));
});

async function loadComponent(path, containerId) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load component: ${path}`);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = await response.text();
    } catch (error) {
        console.error(error);
    }
}