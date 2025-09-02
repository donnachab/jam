/**
 * Admin Mode Management
 * Handles admin authentication and UI toggles using Firebase Functions
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { app } from '../firebase-config.js';
import { showModal, hideModal } from '../ui/modal.js';

let isAdminMode = false;
const ADMIN_SESSION_KEY = 'jam_admin_mode';

// Initialize Firebase Functions and point to the correct region
const functions = getFunctions(app, 'us-central1');

// Connect to emulators if the app is running locally
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    console.log('Connecting to Functions emulator on localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

/**
 * Returns the current admin mode status.
 * @returns {boolean} True if admin mode is active.
 */
export function getIsAdminMode() {
    return isAdminMode;
}

/**
 * Verifies the admin PIN using Firebase Functions
 */
async function verifyAdminPin(pin) {
    try {
        // Use the Firebase SDK to call the function. It handles the URL automatically.
        const verifyPinCallable = httpsCallable(functions, 'verifyAdminPin');
        const result = await verifyPinCallable({ pin: pin });

        // The 'data' property of the result contains the object returned by the function.
        if (result.data.success) {
            return { success: true, message: result.data.message };
        } else {
            return { success: false, message: result.data.message || 'Invalid PIN' };
        }
    } catch (error) {
        console.error('Firebase admin verification failed:', error.message);
        return { success: false, message: `Verification failed: ${error.message}` };
    }
}

/**
 * Toggles the admin mode UI on or off.
 */
function toggleAdminMode(enable) {
    isAdminMode = enable;
    if (enable) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    document.body.classList.toggle("admin-mode", enable);
    
    const adminModeBtn = document.getElementById("admin-mode-btn");
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? "Exit Admin" : "Admin Mode";
        adminModeBtn.classList.toggle("active", enable);
    }
    
    // Show/hide admin controls
    const adminControls = document.querySelectorAll('.admin-control, .admin-only');
    adminControls.forEach(control => {
        control.style.display = enable ? 'block' : 'none';
    });
    
    console.log(enable ? "🔑 Admin mode activated" : "👤 Admin mode deactivated");
}

/**
 * Prompts for admin PIN and verifies using Firebase
 */
async function promptForAdminPin() {
    showModal("Enter admin PIN:", "prompt", async (pin) => {
        if (pin) {
            // Show a proper loading modal, fixing the UX flaw from spec.md
            showModal("Verifying PIN...", "loading");

            const result = await verifyAdminPin(pin);

            // Hide the loading modal before showing the result.
            hideModal();

            // A short delay prevents the result modal from appearing too abruptly.
            setTimeout(() => {
                if (result.success) {
                    showModal("🔑 " + result.message + " Welcome to Admin Mode!", "alert");
                    toggleAdminMode(true);
                } else {
                    showModal("❌ " + result.message, "alert");
                    console.warn("Admin access denied");
                }
            }, 150);
        }
    });
}

/**
 * Initialize admin mode functionality
 */
function initializeAdminMode() {
    console.log("🔧 Initializing Admin Mode with Firebase...");
    
    // Check for an active admin session on page load
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
        toggleAdminMode(true);
    }
    
    // Find admin button (could be in footer or navigation)
    const adminModeBtn = document.getElementById("admin-mode-btn");
    
    if (adminModeBtn) {
        adminModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isAdminMode) {
                // Exit admin mode
                toggleAdminMode(false);
                showModal("Admin mode deactivated.", "alert");
            } else {
                // Enter admin mode
                promptForAdminPin();
            }
        });
        
        console.log("✅ Admin button found and configured");
    } else {
        console.warn("⚠️ Admin button not found");
    }
    
    // Keyboard shortcut for admin (Ctrl+Alt+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            if (!isAdminMode) {
                promptForAdminPin();
            }
        }
    });
}

// Export functions
export { initializeAdminMode, toggleAdminMode, getIsAdminMode };
