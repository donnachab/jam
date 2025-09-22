// -----------------------------------------------------------------------------
// --- 1. IMPORTS
// -----------------------------------------------------------------------------
import { app, db, auth } from './firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { showModal } from './ui/modal.js';
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { initializeAdminMode } from './admin/admin-mode.js?v=2.1';
import { initializeAdminPanel } from './admin/admin-panel.js';
import { initializeHeroAdmin } from './admin/hero-admin.js';
import { initializeVenueManagement, renderVenueList } from './admin/venue-management.js';
import { initializeDefaultJamAdmin } from './admin/default-jam-admin.js';
import { initializeJams, renderJams } from './jams.js';
import { initializeEvents, renderEvents } from './events.js';
import { initializeCommunity, renderCommunity } from './community.js';
import { initializeGallery, renderGallery } from './gallery.js';
import { collection, getDocs, getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// -----------------------------------------------------------------------------
// --- 2. STATE MANAGEMENT
// -----------------------------------------------------------------------------
export let siteData = {
    jams: [],
    events: [],
    photos: [],
    venues: [],
    communityItems: [],
    config: {}
};
let isInitialized = false;

// -----------------------------------------------------------------------------
// --- 3. UTILITIES & HELPERS
// -----------------------------------------------------------------------------
console.log("✅ main.js script has started.");

async function loadComponent(componentPath, containerId) {
    console.log(`Attempting to load component: ${componentPath}`);
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${componentPath}: ${response.status} ${response.statusText}`);
        }
        document.getElementById(containerId).innerHTML = await response.text();
        console.log(`✅ Successfully loaded component: ${componentPath}`);
    } catch (error) {
        console.error(`❌ Error loading component: ${componentPath}`, error);
        showModal(`Failed to load a critical part of the page (${componentPath}). Please check the console for details and try refreshing.`, "alert");
    }
}

// -----------------------------------------------------------------------------
// --- 4. DATA FETCHING & RE-RENDERING
// -----------------------------------------------------------------------------
async function loadAllData() {
    console.log("🔄 Loading all data from Firestore...");
    try {
        const jamSnap = await getDocs(collection(db, "jams"));
        siteData.jams = jamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("❌ Error loading jams:", error);
    }

    try {
        const eventSnap = await getDocs(collection(db, "events"));
        siteData.events = eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("❌ Error loading events:", error);
    }

    try {
        const photoSnap = await getDocs(collection(db, "photos"));
        siteData.photos = photoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("❌ Error loading photos:", error);
    }

    try {
        const venueSnap = await getDocs(collection(db, "venues"));
        siteData.venues = venueSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("❌ Error loading venues:", error);
    }

    try {
        const communitySnap = await getDocs(collection(db, "community"));
        siteData.communityItems = communitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("❌ Error loading community items:", error);
    }

    try {
        const configDoc = await getDoc(doc(db, "site_config", "main"));
        siteData.config = configDoc.exists() ? configDoc.data() : {};
    } catch (error) {
        console.error("❌ Error loading site config:", error);
    }

    console.log("✅ All data loaded successfully.");
    if (!isInitialized) {
        initializeAllModules();
        isInitialized = true;
    }
    renderAll();
}

// -----------------------------------------------------------------------------
// --- 5. INITIALIZATION & RENDERING
// -----------------------------------------------------------------------------
function initializeAllModules() {
    console.log("🚀 Initializing all modules with event listeners...");
    initializeJams(siteData.venues, loadAllData);
    initializeEvents(siteData.venues, loadAllData);
    initializeCommunity(loadAllData);
    initializeGallery(loadAllData);
    initializeVenueManagement(siteData.venues, loadAllData);
    initializeDefaultJamAdmin(siteData.config, siteData.venues, loadAllData);
    initializeHeroAdmin(loadAllData);
    console.log("✅ All modules initialized.");
}

function renderAll() {
    console.log("🎨 Rendering all page components with fresh data...");

    const coverPhoto = document.getElementById('cover-photo');
    if (coverPhoto && siteData.config.coverPhotoUrl) {
        coverPhoto.src = siteData.config.coverPhotoUrl;
    }

    const siteLogo = document.getElementById('site-logo');
    const activeTheme = localStorage.getItem('selectedTheme') || 'default';
    if (siteLogo && siteData.config.logoUrls && siteData.config.logoUrls[activeTheme]) {
        siteLogo.src = siteData.config.logoUrls[activeTheme];
    } else if (siteLogo) {
        // Fallback to default static logo if no dynamic logo is set for the theme
        siteLogo.src = 'images/logo.svg';
    }
    
    renderJams(siteData.jams, siteData.venues, siteData.config);
    renderEvents(siteData.events, siteData.venues);
    renderCommunity(siteData.communityItems);
    renderGallery(siteData.photos, siteData.config);
    renderVenueList(siteData.venues);
    
    console.log("🎨 All components rendered.");
}

// -----------------------------------------------------------------------------
// --- 6. MAIN APPLICATION ENTRY POINT
// -----------------------------------------------------------------------------
async function main() {
    console.log("🚀 Initializing application...");

    // Sign in
    try {
        const initialAuthToken = (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) ? __initial_auth_token : null;
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        console.log("✅ Signed in.");
    } catch (error) {
        console.error("❌ Firebase authentication failed:", error);
    }

    // Load HTML components
    console.log("🔄 Loading all HTML components...");
    await Promise.all([
        loadComponent('components/header.html', 'header-container'),
        loadComponent('components/hero.html', 'hero-container'),
        loadComponent('components/admin/admin-panel.html', 'admin-panel-container'),
        loadComponent('components/jams.html', 'jams-container'),
        loadComponent('components/format.html', 'format-container'),
        loadComponent('components/events.html', 'events-container'),
        loadComponent('components/community.html', 'community-container'),
        loadComponent('components/gallery.html', 'gallery-container'),
        loadComponent('components/contact.html', 'contact-container'),
        loadComponent('components/footer.html', 'footer-container'),
        loadComponent('components/ui/modal.html', 'modal-container')
    ]);
    console.log("👍 All HTML components loaded.");

    // Initialize UI modules
    console.log("Initializing non-data-dependent UI modules...");
    initializeMobileMenu();
    initFestivalCarousel();
    initializeAdminMode();
    initializeAdminPanel(loadAllData);

    // --- Theme Switching Logic ---
    const themeLink = document.getElementById('theme-link');
    const themeSelect = document.getElementById('theme-select');
    const themeSelectMobile = document.getElementById('theme-select-mobile');

    function applyTheme(themeName) {
        themeLink.setAttribute('href', `css/themes/${themeName}.css`);
        localStorage.setItem('selectedTheme', themeName);
        document.body.classList.toggle('maroon-theme', themeName === 'maroon');
        renderAll(); // Re-render to update logo based on new theme
    }

    if (themeSelect && themeSelectMobile) {
        const changeListener = (event) => {
            const newTheme = event.target.value;
            applyTheme(newTheme);
            themeSelect.value = newTheme;
            themeSelectMobile.value = newTheme;
        };

        themeSelect.addEventListener('change', changeListener);
        themeSelectMobile.addEventListener('change', changeListener);

        // Apply saved theme on load
        const savedTheme = localStorage.getItem('selectedTheme') || 'default';
        themeSelect.value = savedTheme;
        themeSelectMobile.value = savedTheme;
        applyTheme(savedTheme);
    }
    // --- End Theme Switching Logic ---

    console.log("✅ Non-data-dependent UI modules initialized.");

    // Load data and render
    await loadAllData();
}

// -----------------------------------------------------------------------------
// --- 7. SCRIPT EXECUTION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", main);
