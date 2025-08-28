import { showModal } from '../ui/modal.js';
import { db } from '../firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/**
 * Verifies the admin PIN by fetching the correct PIN from Firestore.
 * @param {string} pin - The PIN to verify.
 * @returns {Promise<boolean>} - True if the PIN is correct, false otherwise.
 */
async function verifyPin(pin) {
  try {
    const configDocRef = doc(db, "site_config", "main");
    const configDoc = await getDoc(configDocRef);
    const correctPin = configDoc.exists() ? configDoc.data().adminPin : null;

    if (!correctPin) {
      console.error("ADMIN_PIN not found in Firestore.");
      showModal("Admin PIN not configured. Please contact site administrator.", "alert");
      return false;
    }
    
    // Compare the submitted PIN with the one from Firestore
    return pin === correctPin;
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
