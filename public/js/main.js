/**
 * Loads an HTML component from the components folder into a specified container.
 * @param {string} componentName - The name of the component file (e.g., 'header.html').
 * @param {string} containerId - The ID of the element to load the component into.
 */
async function loadComponent(componentName, containerId) {
  try {
    const response = await fetch(`components/${componentName}`);
    if (!response.ok) {
      throw new Error(`Component ${componentName} not found.`);
    }
    const content = await response.text();
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = content;
    } else {
      console.warn(`Container with ID #${containerId} not found.`);
    }
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
  }
}

/**
 * Main function to load all page components.
 */
async function loadPage() {
  // Load essential components first
  await loadComponent('header.html', 'header-container');
  
  // Later, we will add the rest of the component loading and initialization logic here.
}

// --- Main execution on page load ---
document.addEventListener("DOMContentLoaded", loadPage);
