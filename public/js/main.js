// -----------------------------------------------------------------------------
// --- 1. UTILITIES & HELPERS
// -----------------------------------------------------------------------------
console.log("✅ main.js script has started.");

/**
 * Loads an HTML component from a file into a specified container element.
 * @param {string} componentPath - The path to the component file (e.g., 'components/header.html').
 * @param {string} containerId - The ID of the DOM element to load the component into.
 */
async function loadComponent(componentPath, containerId) {
  console.log(`Attempting to load component: ${componentPath}`);
  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const content = await response.text();
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = content;
      console.log(`✅ Component '${componentPath}' loaded successfully into #${containerId}.`);
    } else {
      console.warn(`⚠️ Container with ID #${containerId} not found.`);
    }
  } catch (error) {
    console.error(`❌ FAILED to load component ${componentPath}:`, error);
  }
}

// -----------------------------------------------------------------------------
// --- 2. MAIN APPLICATION LOGIC
// -----------------------------------------------------------------------------

/**
 * Main function to initialize the entire application.
 */
async function main() {
  console.log("🚀 Initializing application...");

  // --- Load all HTML components into the DOM ---
  // We use Promise.all to load them in parallel for speed.
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

  // --- Import and initialize JavaScript modules ---
  // (This section will be filled in as we create the other JS files)
  // Example:
  // const { initializeFirebase } = await import('./firebase-config.js');
  // const { initializeMobileMenu } = await import('./ui/mobile-menu.js');
  //
  // const db = initializeFirebase();
  // initializeMobileMenu();
  // ... and so on for every module.

  console.log("🎉 Application initialization complete.");
}

// -----------------------------------------------------------------------------
// --- 3. SCRIPT EXECUTION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", main);
