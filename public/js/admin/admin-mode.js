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
  console.log("🔐 [DEBUG] verifyPin called");
  console.log("🔐 [DEBUG] PIN length:", pin ? pin.length : 0);
  console.log("🔐 [DEBUG] storedFunctions available:", !!storedFunctions);
  
  const setAdminClaimCallable = httpsCallable(storedFunctions, 'setAdminClaim');
  console.log("🔐 [DEBUG] httpsCallable created successfully");
  
  try {
    console.log("🔐 [DEBUG] Calling setAdminClaim function...");
    const result = await setAdminClaimCallable({ pin: pin });
    console.log("🔐 [DEBUG] setAdminClaim response received:", result);
    console.log("🔐 [DEBUG] Response data:", JSON.stringify(result.data, null, 2));
    
    // Backend returns {success, message, expiresAt}
    if (result.data.success) {
      console.log("✅ [DEBUG] PIN verification successful");
      console.log("✅ [DEBUG] Expiration time:", result.data.expiresAt);
      
      // Store expiration time if needed for session management
      if (result.data.expiresAt) {
        try {
          sessionStorage.setItem("gjc_adminExpiresAt", result.data.expiresAt.toString());
          console.log("✅ [DEBUG] Expiration time stored in sessionStorage");
        } catch (storageError) {
          console.warn("⚠️ [DEBUG] Session storage blocked, using in-memory fallback:", storageError);
        }
      }
      return { success: true, message: result.data.message };
    }
    console.error("❌ [DEBUG] PIN verification failed:", result.data.message);
    return { success: false, message: result.data.message || "Authentication failed" };
  } catch (error) {
    console.error("❌ [DEBUG] Error calling setAdminClaim function:", error);
    console.error("❌ [DEBUG] Error code:", error.code);
    console.error("❌ [DEBUG] Error message:", error.message);
    console.error("❌ [DEBUG] Error details:", error.details);
    console.error("❌ [DEBUG] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errorMessage = error.message || "An error occurred during authentication";
    showModal(`Error: ${errorMessage}`, "alert");
    return { success: false, message: errorMessage };
  }
}

/**
 * Toggles the admin mode UI on or off.
 */
function toggleAdminMode(enable) {
    console.log(`🔄 [DEBUG] toggleAdminMode called with enable=${enable}`);
    console.log(`🔄 [DEBUG] Current body classes:`, document.body.className);
    
    document.body.classList.toggle("admin-mode", enable);
    
    console.log(`🔄 [DEBUG] Updated body classes:`, document.body.className);
    console.log(`🔄 [DEBUG] Admin mode is now:`, document.body.classList.contains("admin-mode") ? "ENABLED" : "DISABLED");
    
    const adminModeBtn = document.getElementById("admin-mode-btn");
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? "Exit Admin" : "Admin";
        console.log(`🔄 [DEBUG] Admin button text updated to: "${adminModeBtn.textContent}"`);
    } else {
        console.warn("⚠️ [DEBUG] Admin mode button not found in DOM");
    }
}

/**
 * Handles the logic when the main admin button is clicked.
 */
function handleAdminClick(e) {
    console.log("🖱️ [DEBUG] Admin button clicked");
    e.preventDefault();
    
    const isAdmin = document.body.classList.contains("admin-mode");
    console.log(`🖱️ [DEBUG] Current admin state: ${isAdmin ? "ADMIN" : "NOT ADMIN"}`);

    if (isAdmin) {
        console.log("🚪 [DEBUG] Exiting admin mode...");
        // Exit admin mode
        inMemoryAdminState = false;
        console.log("🚪 [DEBUG] In-memory admin state cleared");
        
        try {
            sessionStorage.removeItem("gjc_isAdmin");
            sessionStorage.removeItem("gjc_adminExpiresAt");
            console.log("🚪 [DEBUG] Session storage cleared");
        } catch (storageError) {
            console.warn("⚠️ [DEBUG] Session storage blocked during exit:", storageError);
        }
        toggleAdminMode(false);
        console.log("✅ [DEBUG] Admin mode exit complete");
    } else {
        console.log("🔑 [DEBUG] Entering admin mode - showing PIN prompt...");
        // Enter admin mode
        showModal("Enter admin PIN:", "prompt", async (pin) => {
            console.log("🔑 [DEBUG] PIN prompt callback triggered");
            console.log("🔑 [DEBUG] PIN provided:", pin ? "YES (length: " + pin.length + ")" : "NO");
            
            if (!pin) {
                console.log("⚠️ [DEBUG] No PIN provided, aborting");
                return;
            }
            
            console.log("⏳ [DEBUG] Showing verification modal...");
            showModal("Verifying...", "loading");
            
            console.log("⏳ [DEBUG] Calling verifyPin...");
            const result = await verifyPin(pin);
            console.log("⏳ [DEBUG] verifyPin returned:", result);
            
            if (result.success) {
                console.log("✅ [DEBUG] PIN verification successful - activating admin mode");
                
                // CRITICAL: Toggle admin mode BEFORE attempting session storage
                // This ensures UI updates even if storage is blocked
                console.log("✅ [DEBUG] Step 1: Toggling admin mode UI");
                toggleAdminMode(true);
                
                console.log("✅ [DEBUG] Step 2: Setting in-memory state");
                inMemoryAdminState = true;
                console.log("✅ [DEBUG] In-memory admin state:", inMemoryAdminState);
                
                // Attempt to store in session storage (may fail due to tracking prevention)
                console.log("✅ [DEBUG] Step 3: Attempting session storage");
                try {
                    sessionStorage.setItem("gjc_isAdmin", "true");
                    console.log("✅ [DEBUG] Session storage set successfully");
                } catch (storageError) {
                    console.warn("⚠️ [DEBUG] Session storage blocked, using in-memory fallback:", storageError);
                }
                
                // Always show success modal and refresh
                console.log("✅ [DEBUG] Step 4: Showing success modal");
                showModal("PIN verified! You are now in admin mode.", "alert");
                
                // Always refresh data to show admin controls
                console.log("✅ [DEBUG] Step 5: Calling refresh callback");
                console.log("✅ [DEBUG] Refresh callback available:", !!storedRefreshCallback);
                if (storedRefreshCallback) {
                    console.log("✅ [DEBUG] Executing refresh callback...");
                    storedRefreshCallback();
                    console.log("✅ [DEBUG] Refresh callback executed");
                } else {
                    console.error("❌ [DEBUG] No refresh callback available!");
                }
                
                console.log("✅ [DEBUG] Admin mode activation complete");
            } else {
                console.error("❌ [DEBUG] PIN verification failed");
                showModal(result.message || "Incorrect PIN.", "alert");
            }
        });
    }
}

/**
 * Initializes all admin mode event listeners.
 */
export function initializeAdminMode(db, auth, functions, refreshCallback) {
    console.log("🚀 [DEBUG] ========================================");
    console.log("🚀 [DEBUG] initializeAdminMode called");
    console.log("🚀 [DEBUG] ========================================");
    console.log("🚀 [DEBUG] Parameters received:");
    console.log("🚀 [DEBUG] - db:", !!db);
    console.log("🚀 [DEBUG] - auth:", !!auth);
    console.log("🚀 [DEBUG] - functions:", !!functions);
    console.log("🚀 [DEBUG] - refreshCallback:", !!refreshCallback);
    
    // Store parameters for use in inner functions
    storedFunctions = functions;
    storedRefreshCallback = refreshCallback;
    console.log("🚀 [DEBUG] Parameters stored globally");
    
    const adminModeBtn = document.getElementById("admin-mode-btn");
    console.log("🚀 [DEBUG] Admin mode button found:", !!adminModeBtn);
    
    if (adminModeBtn) {
        adminModeBtn.addEventListener("click", handleAdminClick);
        console.log("🚀 [DEBUG] Click listener attached to admin button");
    } else {
        console.error("❌ [DEBUG] Admin mode button NOT FOUND in DOM!");
    }

    // Handle exit admin buttons
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("exit-admin-btn")) {
            console.log("🚪 [DEBUG] Exit admin button clicked");
            inMemoryAdminState = false;
            try {
                sessionStorage.removeItem("gjc_isAdmin");
                console.log("🚪 [DEBUG] Session storage cleared");
            } catch (storageError) {
                console.warn("⚠️ [DEBUG] Session storage blocked during exit:", storageError);
            }
            toggleAdminMode(false);
        }
    });
    console.log("🚀 [DEBUG] Exit admin button listener attached to body");

    // Check initial state on page load
    console.log("🚀 [DEBUG] Checking initial admin state...");
    console.log("🚀 [DEBUG] In-memory state:", inMemoryAdminState);
    
    let isAdminStored = inMemoryAdminState;
    try {
        const sessionValue = sessionStorage.getItem("gjc_isAdmin");
        console.log("🚀 [DEBUG] Session storage value:", sessionValue);
        isAdminStored = sessionValue === "true" || inMemoryAdminState;
        console.log("🚀 [DEBUG] Combined admin state:", isAdminStored);
    } catch (storageError) {
        console.warn("⚠️ [DEBUG] Session storage blocked during initialization, using in-memory fallback:", storageError);
    }
    
    if (isAdminStored) {
        console.log("🚀 [DEBUG] Restoring admin mode from previous session");
        toggleAdminMode(true);
    } else {
        console.log("🚀 [DEBUG] No previous admin session found");
    }

    console.log("✅ [DEBUG] Admin mode initialized.");
    console.log("🚀 [DEBUG] ========================================");
}








