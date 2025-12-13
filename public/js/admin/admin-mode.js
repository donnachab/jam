import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { showModal } from '../ui/modal.js';

// Store parameters for use in inner functions
let storedFunctions;
let storedRefreshCallback;

// In-memory fallback for admin state when session storage is blocked
let inMemoryAdminState = false;

/**
 * Verifies the admin PIN using a secure POST request.
 */
async function verifyPin(pin) {
  const setAdminClaimCallable = httpsCallable(storedFunctions, 'setAdminClaim');
  try {
    const result = await setAdminClaimCallable({ pin: pin });
    // Backend returns {success, message, expiresAt}
    if (result.data.success) {
      // Store expiration time if needed for session management
      if (result.data.expiresAt) {
        try {
          sessionStorage.setItem("gjc_adminExpiresAt", result.data.expiresAt.toString());
        } catch (storageError) {
          console.warn("Session storage blocked, using in-memory fallback:", storageError);
        }
      }
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.data.message || "Authentication failed" };
  } catch (error) {
    console.error("Error calling setAdminClaim function:", error);
    const errorMessage = error.message || "An error occurred during authentication";
    showModal(`Error: ${errorMessage}`, "alert");
    return { success: false, message: errorMessage };
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
        inMemoryAdminState = false;
        try {
            sessionStorage.removeItem("gjc_isAdmin");
            sessionStorage.removeItem("gjc_adminExpiresAt");
        } catch (storageError) {
            console.warn("Session storage blocked during exit:", storageError);
        }
        toggleAdminMode(false);
    } else {
        // Enter admin mode
        showModal("Enter admin PIN:", "prompt", async (pin) => {
            if (!pin) return;
            
            showModal("Verifying...", "loading");
            const result = await verifyPin(pin);
            
            if (result.success) {
                // CRITICAL: Toggle admin mode BEFORE attempting session storage
                // This ensures UI updates even if storage is blocked
                toggleAdminMode(true);
                inMemoryAdminState = true;
                
                // Attempt to store in session storage (may fail due to tracking prevention)
                try {
                    sessionStorage.setItem("gjc_isAdmin", "true");
                } catch (storageError) {
                    console.warn("Session storage blocked, using in-memory fallback:", storageError);
                }
                
                // Always show success modal and refresh
                showModal("PIN verified! You are now in admin mode.", "alert");
                
                // Always refresh data to show admin controls
                if (storedRefreshCallback) {
                    storedRefreshCallback();
                }
            } else {
                showModal(result.message || "Incorrect PIN.", "alert");
            }
        });
    }
}

/**
 * Initializes all admin mode event listeners.
 */
export function initializeAdminMode(db, auth, functions, refreshCallback) {
    // Store parameters for use in inner functions
    storedFunctions = functions;
    storedRefreshCallback = refreshCallback;
    const adminModeBtn = document.getElementById("admin-mode-btn");
    
    if (adminModeBtn) {
        adminModeBtn.addEventListener("click", handleAdminClick);
    }

    // Handle exit admin buttons
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("exit-admin-btn")) {
            inMemoryAdminState = false;
            try {
                sessionStorage.removeItem("gjc_isAdmin");
            } catch (storageError) {
                console.warn("Session storage blocked during exit:", storageError);
            }
            toggleAdminMode(false);
        }
    });

    // Check initial state on page load
    let isAdminStored = inMemoryAdminState;
    try {
        isAdminStored = sessionStorage.getItem("gjc_isAdmin") === "true" || inMemoryAdminState;
    } catch (storageError) {
        console.warn("Session storage blocked during initialization, using in-memory fallback:", storageError);
    }
    
    if (isAdminStored) {
        toggleAdminMode(true);
    }

    console.log("✅ Admin mode initialized.");
}








