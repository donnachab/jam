/**
 * Admin Mode Management
 * Handles admin authentication and UI toggles using Firebase Functions
 */

import { showModal } from '../ui/modal.js';

let isAdminMode = false;

/**
 * Verifies the admin PIN using Firebase Functions
 */
async function verifyAdminPin(pin) {
    try {
        // Use your Firebase emulator endpoint (change to production URL when deployed)
        const response = await fetch('http://127.0.0.1:5001/galway-jam-circle-live/us-central1/verifyAdminPin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: { pin: pin }
            })
        });

        const result = await response.json();
        
        if (response.ok && result.result && result.result.success) {
            return { success: true, message: result.result.message };
        } else {
            return { success: false, message: result.error || 'Invalid PIN' };
        }
        
    } catch (error) {
        console.error('Firebase admin verification failed:', error);
        return { success: false, message: 'Connection failed. Please try again.' };
    }
}

/**
 * Toggles the admin mode UI on or off.
 */
function toggleAdminMode(enable) {
    isAdminMode = enable;
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
            // Show loading
            showModal("Verifying PIN...", "alert");
            
            const result = await verifyAdminPin(pin);
            
            if (result.success) {
                showModal("🔑 " + result.message + " Welcome to Admin Mode!", "alert");
                toggleAdminMode(true);
            } else {
                showModal("❌ " + result.message, "alert");
                console.warn("Admin access denied");
            }
        }
    });
}

/**
 * Initialize admin mode functionality
 */
function initializeAdminMode() {
    console.log("🔧 Initializing Admin Mode with Firebase...");
    
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
export { initializeAdminMode, toggleAdminMode, verifyAdminPin };
