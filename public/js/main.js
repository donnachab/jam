console.log("✅ main.js script has started.");

/**
 * Loads an HTML component from the components folder into a specified container.
 * @param {string} componentName - The name of the component file (e.g., 'header.html').
 * @param {string} containerId - The ID of the element to load the component into.
 */
async function loadComponent(componentName, containerId) {
  const componentPath = `components/${componentName}`;
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
      console.log(`✅ Component '${componentName}' loaded successfully into #${containerId}.`);
    } else {
      console.warn(`⚠️ Container with ID #${containerId} not found in the DOM.`);
    }
  } catch (error) {
    console.error(`❌ FAILED to load component ${componentName}:`, error);
  }
}

/**
 * Main function to load all page components.
 */
async function loadPage() {
  console.log("🚀 Starting to load page components...");
  
  await loadComponent('header.html', 'header-container');
  // Later, we will add the rest of the component loading and initialization logic here.

  console.log("👍 Page components loading process finished.");
}

// --- Main execution on page load ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded. Initializing page.");
    loadPage();
});
