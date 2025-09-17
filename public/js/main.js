// -----------------------------------------------------------------------------
// --- 1. IMPORTS
// -----------------------------------------------------------------------------
import { app, db, auth } from './firebase-config.js';
import { showModal } from './ui/modal.js';
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { initializeAdminMode } from './admin/admin-mode.js?v=2.0';
import { initializeHeroAdmin } from './admin/hero-admin.js';
import { initializeVenueManagement } from './admin/venue-management.js';
import { initializeJams } from './jams.js';
import { initializeEvents } from './events.js';
import { initializeCommunity } from './community.js';
import { initializeGallery } from './gallery.js';
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


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
        siteData.jams = jamSnap.docs.map(doc => doc.data());
        console.log('✅ Jams data loaded', siteData.jams);
    } catch (error) {
        console.error("❌ Error loading jams:", error);
        showModal("Could not load jam data from the database. Please try refreshing the page.", "alert");
        return;
    }

    try {
        const eventSnap = await getDocs(collection(db, "events"));
        siteData.events = eventSnap.docs.map(doc => doc.data());
        console.log('✅ Events data loaded', siteData.events);
    } catch (error) {
        console.error("❌ Error loading events:", error);
        showModal("Could not load event data from the database. Please try refreshing the page.", "alert");
        return;
    }

    try {
        const photoSnap = await getDocs(collection(db, "photos"));
        siteData.photos = photoSnap.docs.map(doc => doc.data());
        console.log('✅ Photos data loaded', siteData.photos);
    } catch (error) {
        console.error("❌ Error loading photos:", error);
        showModal("Could not load photo data from the database. Please try refreshing the page.", "alert");
        return;
    }

    try {
        const venueSnap = await getDocs(collection(db, "venues"));
        siteData.venues = venueSnap.docs.map(doc => doc.data());
        console.log('✅ Venues data loaded', siteData.venues);
    } catch (error) {
        console.error("❌ Error loading venues:", error);
        showModal("Could not load venue data from the database. Please try refreshing the page.", "alert");
        return;
    }

    try {
        const communitySnap = await getDocs(collection(db, "community"));
        siteData.communityItems = communitySnap.docs.map(doc => doc.data());
        console.log('✅ Community items data loaded', siteData.communityItems);
    } catch (error) {
        console.error("❌ Error loading community items:", error);
        showModal("Could not load community data from the database. Please try refreshing the page.", "alert");
        return;
    }

    try {
        const configDoc = await getDoc(doc(db, "site_config", "main"));
        siteData.config = configDoc.exists() ? configDoc.data() : {};
        console.log('✅ Site config data loaded', siteData.config);
    } catch (error) {
        console.error("❌ Error loading site config:", error);
        showModal("Could not load site configuration from the database. Please try refreshing the page.", "alert");
        return;
    }

    console.log("✅ All data loaded successfully.");
    renderAll();
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
    console.log("🎨 All components rendered.");
}

// -----------------------------------------------------------------------------
// --- 6. MAIN APPLICATION ENTRY POINT
// -----------------------------------------------------------------------------
async function main() {
    console.log("🚀 Initializing application...");

    // Sign in with the custom token or anonymously if not available
    const initialAuthToken = (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) ? __initial_auth_token : null;
    console.log("🔑 Initial auth token:", initialAuthToken);

    try {
        if (initialAuthToken) {
            console.log("Attempting to sign in with custom token...");
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("✅ Signed in with custom token.");
        } else {
            console.log("No custom token, attempting anonymous sign-in...");
            await signInAnonymously(auth);
            console.log("✅ Signed in anonymously.");
        }
    } catch (error) {
        console.error("❌ Firebase authentication failed:", error);
        showModal("Authentication failed. Please check your network connection and see the console for details.", "alert");
    }

    console.log("🔄 Loading all HTML components...");
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
    console.log("Initializing non-data-dependent UI modules...");
    initializeMobileMenu();
    initFestivalCarousel();
    console.log("✅ Non-data-dependent UI modules initialized.");

// Initialize admin mode AFTER footer is loaded - wait for DOM to be ready
function initAdminWhenReady() {
    const adminButton = document.getElementById('admin-mode-btn');
    if (adminButton) {
        console.log('✅ Admin button found, initializing admin mode...');
        initializeAdminMode();
    } else {
        console.log('⏳ Admin button not ready, retrying in 50ms...');
        setTimeout(initAdminWhenReady, 50);
    }
}
initAdminWhenReady();

    // Initialize admin modules that depend on Firebase being authenticated
    console.log("Initializing data-dependent admin modules...");
    initializeHeroAdmin(loadAllData);
    console.log("✅ Data-dependent admin modules initialized.");

    // Load initial data from Firestore, which will then trigger all data-dependent rendering
    console.log("Inspecting db object before loading data:", db);
    await loadAllData();

    console.log("🎉 Application initialization complete.");
}

// -----------------------------------------------------------------------------
// --- 7. SCRIPT EXECUTION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", main);