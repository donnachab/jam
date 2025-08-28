import { showModal } from '../ui/modal.js';

const PIN_VERIFICATION_URL = "https://script.google.com/macros/s/AKfycby34RunDhZjds7M7rUA5wP-m1M2uBv3UfJ6vpCxqKhMq36oGkHTIQ1BFF3-9kStGaTyAA/exec";

/**
 * Verifies the admin PIN by sending it in a GET request.
 * @param {string} pin - The PIN to verify.
 * @returns {Promise<boolean>} - True if the PIN is correct, false otherwise.
 */
async function verifyPin(pin) {
  try {
    const response = await fetch(`${PIN_VERIFICATION_URL}?pin=${encodeURIComponent(pin)}&action=check`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error verifying PIN:", error);
    showModal("Could not verify PIN. Please check your connection.", "alert");
    return false;
  }
}

/**
 * Toggles the admin mode UI on or off.
 * @param {boolean} enable - Whether to enable or disable admin mode.
 */
function toggleAdminMode(enable) {
  document.body.classList.toggle("admin-mode", enable);
  const adminModeBtn = document.getElementById("admin-mode-btn");
  if (adminModeBtn) {
    adminModeBtn.textContent = enable ? "Exit Admin" : "Admin";
  }
}

/**
 * Handles the logic when the main admin button is clicked.
 * @param {Event} e - The click event.
 */
function handleAdminClick(e) {
  e.preventDefault();
  const isAdmin = document.body.classList.contains("admin-mode");

  if (isAdmin) {
    sessionStorage.removeItem("gjc_isAdmin");
    toggleAdminMode(false);
  } else {
    showModal("Enter admin PIN:", "prompt", async (pin) => {
      if (!pin) return;
      
      showModal("Verifying...", "loading");

      const isCorrect = await verifyPin(pin);
      if (isCorrect) {
        sessionStorage.setItem("gjc_isAdmin", "true");
        toggleAdminMode(true);
        showModal("PIN verified!", "alert");
      } else {
        showModal("Incorrect PIN.", "alert");
      }
    });
  }
}

/**
 * Initializes all admin mode event listeners.
 */
export function initializeAdminMode() {
  const adminModeBtn = document.getElementById("admin-mode-btn");
  if (adminModeBtn) {
    adminModeBtn.addEventListener("click", handleAdminClick);
  }

  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("exit-admin-btn")) {
      sessionStorage.removeItem("gjc_isAdmin");
      toggleAdminMode(false);
    }
  });

  if (sessionStorage.getItem("gjc_isAdmin") === "true") {
    toggleAdminMode(true);
  }
  console.log("✅ Admin mode initialized.");
}
