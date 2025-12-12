/**
 * Initializes the mobile menu functionality.
 */
export function initializeMobileMenu() {
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!menuBtn || !mobileMenu) {
    console.warn("Mobile menu elements not found, skipping initialization.");
    return;
  }

  // Toggle menu on button click
  menuBtn.addEventListener("click", () => {
    // Toggle visibility using both hidden class and display style for proper control
    if (mobileMenu.classList.contains("hidden")) {
      mobileMenu.classList.remove("hidden");
      mobileMenu.style.display = "block";
    } else {
      mobileMenu.classList.add("hidden");
      mobileMenu.style.display = "none";
    }
  });

  // Close menu when a link inside it is clicked
  const mobileLinks = mobileMenu.getElementsByTagName("a");
  for (let link of mobileLinks) {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
      mobileMenu.style.display = "none";
    });
  }
  console.log("✅ Mobile menu initialized.");
}
