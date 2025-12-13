import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
const firebaseConfig = {
  apiKey: "AIzaSyC4SnqaOMQWmEFulkN8zZALZsqJLK7hOh0",
  authDomain: "galway-jam-circle-live.firebaseapp.com",
  projectId: "galway-jam-circle-live",
  storageBucket: "galway-jam-circle-live.appspot.com",
  messagingSenderId: "140452021164",
  appId: "1:140452021164:web:049a190be3ba0b6c9a3009"
};
import { initializeMobileMenu } from './ui/mobile-menu.js';
import { initFestivalCarousel } from './ui/carousels.js';
import { themeManager } from './ui/theme-switcher.js';
import { initializeAdminMode } from './admin/admin-mode.js';
import { initializeAdminPanel } from './admin/admin-panel.js';
import { initializeHeroAdmin } from './admin/hero-admin.js';
import { renderJams, initializeJams } from './jams.js';
import { renderEvents, initializeEvents } from './events.js';
import { renderGallery, initializeGallery } from './gallery.js';
import { renderCommunity, initializeCommunity } from './community.js';
export let siteData = {};
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
function showLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.classList.remove('hidden');
}
function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.classList.add('hidden');
}
async function loadAllData(db) {
    showLoading();
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
        siteData.photos = gallerySnap.docs.map(doc => doc.data());
        siteData.community = communitySnap.docs.map(doc => doc.data());
        console.log("✅ All Firebase data loaded.");
    } catch (error) {
        console.error("Failed to load site data:", error);
    } finally {
        hideLoading();
    }
}
function renderAllComponents(db) {
    if (!siteData) return console.error("Site data not available for rendering.");
    renderHero();
    renderLogo(themeManager.getSaved() || 'default');
    renderJams(siteData.jams, siteData.venues, siteData.config, db);
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
    renderAllComponents(db);
}
document.addEventListener("DOMContentLoaded", async () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);
    await signInAnonymously(auth);
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        connectAuthEmulator(auth, "http://localhost:9099");
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectFunctionsEmulator(functions, "localhost", 5001);
    }
    await loadAllData(db);
    await Promise.all([
        loadComponent('components/ui/loading.html', 'loading-container'),
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
    renderAllComponents(db);
    themeManager.initialize();
    initializeThemeSwitcher();
    initializeMobileMenu();
    initFestivalCarousel();
    initializeAdminMode(db, auth, functions, () => refreshDataAndRender(db));
    initializeAdminPanel(db, auth, () => refreshDataAndRender(db));
    initializeJams(db, siteData.venues, () => refreshDataAndRender(db));
    initializeEvents(db, siteData.venues, () => refreshDataAndRender(db));
    initializeGallery(db, auth, functions, () => refreshDataAndRender(db));
    initializeCommunity(db, auth, functions, () => refreshDataAndRender(db));
    initializeHeroAdmin(db, auth, functions, () => refreshDataAndRender(db));
    
    // Header scroll behavior - add 'scrolled' class when user scrolls past 50px
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    
    // Update copyright year dynamically
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
});
