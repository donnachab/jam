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

// --- CORE FUNCTIONS --- //

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

async function loadAllData(db) {
    try {
        const [configDoc, jamsSnap, venuesSnap, eventsSnap, gallerySnap, communitySnap] = await Promise.all([
            getDoc(doc(db, "site_config", "main")),
            getDocs(collection(db, "jams")),
            getDocs(collection(db, "venues")),
            getDocs(collection(db, "events")),
            getDocs(collection(db, "photos")),
            getDocs(collection(db, "community")),
        ]);

        siteData.config = configDoc.exists() ? configDoc.data() : {};
        siteData.jams = jamsSnap.docs.map(doc => doc.data());
        siteData.venues = venuesSnap.docs.map(doc => doc.data());
        siteData.events = eventsSnap.docs.map(doc => doc.data());
        siteData.photos = gallerySnap.docs.map(doc => doc.data()); // Corrected this line
        siteData.community = communitySnap.docs.map(doc => doc.data());

        console.log("✅ All Firebase data loaded.");
    } catch (error) {
        console.error("Failed to load site data:", error);
    }
}

function renderAllComponents() {
    if (!siteData) return console.error("Site data not available for rendering.");
    
    renderHero();
    renderLogo(themeManager.getSaved() || 'default');
    renderJams(siteData.jams, siteData.venues, siteData.config);
    renderEvents(siteData.events, siteData.venues);
    renderGallery(siteData.photos, siteData.config);
    renderCommunity(siteData.community);
    
    console.log("✅ All components rendered.");
}

function renderLogo(theme) {
    const siteLogo = document.getElementById('site-logo');
    if (!siteLogo) return;
    const logoUrl = siteData.config?.logoUrls?.[theme] || 'images/logo.svg';
    siteLogo.src = logoUrl;
}

function renderHero() {
    const heroImage = document.getElementById('cover-photo');
    if (heroImage && siteData.config?.coverPhotoUrl) {
        heroImage.src = siteData.config.coverPhotoUrl;
    }
}

function initializeThemeSwitcher() {
    document.querySelectorAll('.theme-switcher').forEach(switcher => {
        const select = switcher.querySelector('select');
        if (!select) return;
        select.value = themeManager.getSaved() || 'default';
        select.addEventListener('change', (e) => {
            themeManager.set(e.target.value);
            renderLogo(e.target.value);
        });
    });
}

async function refreshDataAndRender(db) {
    await loadAllData(db);
    renderAllComponents();
}

// --- MAIN EXECUTION --- //
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await signInAnonymously(auth);

    // 2. Load all data from Firestore first
    await loadAllData(db);

    // 3. Load all HTML components into the DOM
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

    // 4. Render all data into the newly loaded HTML
    renderAllComponents();

    // 5. Initialize all interactive modules now that HTML and data are ready
    themeManager.initialize();
    initializeThemeSwitcher();
    initializeMobileMenu();
    initFestivalCarousel(); 
    initializeAdminMode(db, auth, () => refreshDataAndRender(db));
    initializeAdminPanel(db, auth, functions, () => refreshDataAndRender(db));
    initializeJams(siteData.venues, () => refreshDataAndRender(db));
    initializeEvents(siteData.venues, () => refreshDataAndRender(db));
    initializeGallery(() => refreshDataAndRender(db));
    initializeCommunity(() => refreshDataAndRender(db));
    initializeHeroAdmin(db, auth, functions, () => refreshDataAndRender(db));
});