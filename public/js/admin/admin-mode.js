import { showModal } from '../ui/modal.js';
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const PIN_VERIFICATION_URL = "https://script.google.com/macros/s/AKfycby34RunDhZjds7M7rUA5wP-m1M2uBv3UfJ6vpCxqKhMq36oGkHTIQ1BFF3-9kStGaTyAA/exec";
const TOKEN_URL = "https://script.google.com/macros/s/YOUR_AUTH_SCRIPT_HERE/exec"; // Replace with your token generation script URL

/**
 * Verifies the admin PIN and fetches a custom auth token.
 * @param {string} pin - The PIN to verify.
 * @returns {Promise<string|null>} - The custom token if correct, otherwise null.
 */
async function getCustomToken(pin) {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ pin, action: 'getToken' })
    });
    const result = await response.json();
    return result.token || null;
  } catch (error) {
    console.error("Error fetching custom token:", error);
    return null;
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
  const auth = getAuth();

  if (isAdmin) {
    sessionStorage.removeItem("gjc_isAdmin");
    toggleAdminMode(false);
  } else {
    showModal("Enter admin PIN:", "prompt", async (pin) => {
      if (!pin) return;

      showModal("Verifying...", "loading");
      const token = await getCustomToken(pin);

      if (token) {
        try {
          await signInWithCustomToken(auth, token);
          sessionStorage.setItem("gjc_isAdmin", "true");
          toggleAdminMode(true);
          showModal("PIN verified! You are now an authenticated admin.", "alert");
        } catch (error) {
          console.error("Firebase custom token sign-in failed:", error);
          showModal("Authentication failed. Please check your network connection.", "alert");
        }
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
