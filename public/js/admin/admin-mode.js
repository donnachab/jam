import { showModal } from '../ui/modal.js';

const PIN_VERIFICATION_URL = "https://script.google.com/macros/s/1UAV2BChzkyO4YYRrXK5tL66E9qr9U2WBM8lQT0E3gd28mNeRkEP2w_3i/exec";

/**
 * Verifies the admin PIN - EXACT COPY from working monolithic site
 */
async function verifyPin(pin) {
    try {
        const checkResponse = await fetch(`${PIN_VERIFICATION_URL}?pin=${encodeURIComponent(pin)}&action=check`);
        if (!checkResponse.ok) return false;
        const result = await checkResponse.json();
        return result.success;
    } catch (error) {
        console.error("Error verifying PIN:", error);
        showModal("Could not verify PIN. Please check your connection.", "alert");
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
