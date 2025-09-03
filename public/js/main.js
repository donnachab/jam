// -----------------------------------------------------------------------------
// --- 1. IMPORTS
// -----------------------------------------------------------------------------
import { app, db, auth } from './firebase-config.js';
import { showModal } from './ui/modal.js';
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { initializeAdminMode } from './admin/admin-mode.js';
import { initializeHeroAdmin } from './admin/hero-admin.js';
import { initializeVenueManagement } from './admin/venue-management.js';
import { initializeJams } from './jams.js';
import { initializeEvents } from './events.js';
import { initializeCommunity } from './community.js';
import { initializeGallery } from './gallery.js';
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// -----------------------------------------------------------------------------
// --- 2. STATE MANAGEMENT
// -----------------------------------------------------------------------------
let siteData = {
    jams: [],
    events: [],
    photos: [],
    venues: [],
    communityItems: [],
    config: {}
};

// -----------------------------------------------------------------------------
// --- 3. UTILITIES & HELPERS
// -----------------------------------------------------------------------------
console.log("✅ main.js script has started.");

async function loadComponent(componentPath, containerId) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to fetch ${componentPath}`);
        document.getElementById(containerId).innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading component: ${error}`);
    }
}

// -----------------------------------------------------------------------------
// --- 4. DATA FETCHING & RE-RENDERING
// -----------------------------------------------------------------------------
async function loadAllData() {
    console.log("🔄 Loading all data from Firestore...");
    try {
        const [jamSnap, eventSnap, photoSnap, venueSnap, communitySnap, configDoc] = await Promise.all([
            getDocs(collection(db, "jams")),
            getDocs(collection(db, "events")),
            getDocs(collection(db, "photos")),
            getDocs(collection(db, "venues")),
            getDocs(collection(db, "community")),
            getDoc(doc(db, "site_config", "main")),
        ]);

        siteData.jams = jamSnap.docs.map(doc => doc.data());
        siteData.events = eventSnap.docs.map(doc => doc.data());
        siteData.photos = photoSnap.docs.map(doc => doc.data());
        siteData.venues = venueSnap.docs.map(doc => doc.data());
        siteData.communityItems = communitySnap.docs.map(doc => doc.data());
        siteData.config = configDoc.exists() ? configDoc.data() : {};

        console.log("✅ All data loaded successfully.");
        renderAll();
    } catch (error) {
        console.error("❌ Error loading data from Firestore:", error);
        showModal("Could not load data from the database. Please try refreshing the page.", "alert");
    }
}

// -----------------------------------------------------------------------------
// --- 5. INITIALIZATION HUB
// -----------------------------------------------------------------------------
function renderAll() {
    console.log("🎨 Rendering all page components with fresh data...");
    
    // Initialize all the feature modules with the data they need
    initializeJams(siteData.jams, siteData.venues, loadAllData);
    initializeEvents(siteData.events, loadAllData);
    initializeCommunity(siteData.communityItems, loadAllData);
    initializeGallery(siteData.photos, siteData.config, loadAllData);

    // Re-initialize admin components that depend on dynamic data
    initializeVenueManagement(siteData.venues, loadAllData);
}

// -----------------------------------------------------------------------------
// --- 6. MAIN APPLICATION ENTRY POINT
// -----------------------------------------------------------------------------
async function main() {
    console.log("🚀 Initializing application...");

    // Sign in with the custom token or anonymously if not available
    const initialAuthToken = (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) ? __initial_auth_token : null;

    try {
        if (initialAuthToken) {
            await auth.signInWithCustomToken(initialAuthToken);
            console.log("✅ Signed in with custom token.");
        }
    } catch (error) {
        console.error("❌ Firebase authentication with custom token failed:", error);
        try {
            // Fallback to anonymous sign-in
            await auth.signInAnonymously();
            console.log("✅ Signed in anonymously.");
        } catch (anonError) {
            console.error("❌ Anonymous sign-in failed:", anonError);
            showModal("Authentication failed. Please check your network connection.", "alert");
        }
    }

    // Load all HTML components in parallel
    await Promise.all([
        loadComponent('components/header.html', 'header-container'),
        loadComponent('components/hero.html', 'hero-container'),
        loadComponent('components/admin/hero-controls.html', 'admin-hero-controls-container'),
        loadComponent('components/jams.html', 'jams-container'),
        loadComponent('components/admin/jam-controls.html', 'admin-jam-controls-container'),
        loadComponent('components/format.html', 'format-container'),
        loadComponent('components/events.html', 'events-container'),
        loadComponent('components/admin/event-controls.html', 'admin-event-controls-container'),
        loadComponent('components/community.html', 'community-container'),
        loadComponent('components/admin/community-controls.html', 'admin-community-controls-container'),
        loadComponent('components/gallery.html', 'gallery-container'),
        loadComponent('components/admin/gallery-controls.html', 'admin-gallery-controls-container'),
        loadComponent('components/contact.html', 'contact-container'),
        loadComponent('components/footer.html', 'footer-container'),
        loadComponent('components/ui/modal.html', 'modal-container')
    ]);

    console.log("👍 All HTML components loaded.");

    // Initialize UI modules that don't depend on data
    initializeMobileMenu();
    initFestivalCarousel();

// Initialize admin mode AFTER footer is loaded - wait for DOM to be ready
function initAdminWhenReady() {
    const adminButton = document.getElementById('admin-mode-btn');
    if (adminButton) {
        console.log('✅ Admin button found, initializing...');
        initializeAdminMode();
    } else {
        console.log('⏳ Admin button not ready, retrying...');
        setTimeout(initAdminWhenReady, 50);
    }
}
initAdminWhenReady();

    // Initialize admin modules that depend on Firebase being authenticated
    initializeHeroAdmin(loadAllData);

    // Load initial data from Firestore, which will then trigger all data-dependent rendering
    await loadAllData();

    console.log("🎉 Application initialization complete.");
}

// -----------------------------------------------------------------------------
// --- 7. SCRIPT EXECUTION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", main);


