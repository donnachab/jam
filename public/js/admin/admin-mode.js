import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { showModal } from '../ui/modal.js';

/**
 * Verifies the admin PIN using a secure POST request. Extra comment for dummy push.
 */
async function verifyPin(pin) {
  const functions = getFunctions();
  const verifyPinCallable = httpsCallable(functions, 'verifyAdminPin');
  try {
    const result = await verifyPinCallable({ pin: pin });
    return result.data.success;
  } catch (error) {
    console.error("Error calling verifyAdminPin function:", error);
    showModal(`Error: ${error.message}`, "alert");
    return false;
  }
}

/**
 * Toggles the admin mode UI on or off.
 */
function toggleAdminMode(enable) {
    document.body.classList.toggle("admin-mode", enable);
    const adminModeBtn = document.getElementById("admin-mode-btn");
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? "Exit Admin" : "Admin";
    }
}

/**
 * Shows the admin login prompt - MISSING FUNCTION RESTORED!
 */
function showAdminLogin() {
    showModal("Enter admin PIN:", "prompt", async (pin) => {
        if (!pin) return;
        
        showModal("Verifying...", "loading");
        const isCorrect = await verifyPin(pin);
        
        if (isCorrect) {
            sessionStorage.setItem("gjc_isAdmin", "true");
            toggleAdminMode(true);
            showModal("PIN verified! You are now in admin mode.", "alert");
        } else {
            showModal("Incorrect PIN.", "alert");
        }
    });
}

/**
 * Handles the logic when the main admin button is clicked.
 */
function handleAdminClick(e) {
    e.preventDefault();
    const isAdmin = document.body.classList.contains("admin-mode");
    if (isAdmin) {
        // Exit admin mode
        sessionStorage.removeItem("gjc_isAdmin");
        toggleAdminMode(false);
    } else {
        // Enter admin mode
        showAdminLogin();
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
    // Handle exit admin buttons
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("exit-admin-btn")) {
            sessionStorage.removeItem("gjc_isAdmin");
            toggleAdminMode(false);
        }
    });
    // Check initial state on page load
    if (sessionStorage.getItem("gjc_isAdmin") === "true") {
        toggleAdminMode(true);
    }
    console.log("✅ Admin mode initialized.");
}

// 🚀 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
window.showAdminLogin = showAdminLogin;
window.toggleAdminMode = toggleAdminMode;
window.verifyPin = verifyPin;
