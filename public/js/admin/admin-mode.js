/**
 * Admin Mode Management
 * Handles admin authentication, state persistence, and UI toggles.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { app } from '../firebase-config.js';
import { showModal, hideModal } from '../ui/modal.js';

const ADMIN_MODE_KEY = 'isAdminMode';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Connect to emulators in local development
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    console.log('Connecting to Functions emulator on localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

/**
 * Verifies the admin PIN using a Firebase Cloud Function.
 * @param {string} pin - The PIN to verify.
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function verifyAdminPin(pin) {
    try {
        const verifyPinCallable = httpsCallable(functions, 'verifyAdminPin');
        const result = await verifyPinCallable({ pin });
        return result.data;
    } catch (error) {
        console.error('Firebase admin verification failed:', error.message);
        return { success: false, message: `Verification failed: ${error.message}` };
    }
}

/**
 * Enables or disables admin mode.
 * This is the single source of truth for admin state.
 * @param {boolean} enable - Whether to enable or disable admin mode.
 */
function setAdminMode(enable) {
    sessionStorage.setItem(ADMIN_MODE_KEY, enable);
    document.body.classList.toggle('admin-mode', enable);

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? 'Exit Admin' : 'Admin Mode';
        adminModeBtn.classList.toggle('active', enable);
    }
    
    console.log(enable ? '🔑 Admin mode activated' : '👤 Admin mode deactivated');
}

/**
 * Checks if admin mode is currently active.
 * @returns {boolean}
 */
function getIsAdminMode() {
    return sessionStorage.getItem(ADMIN_MODE_KEY) === 'true';
}

/**
 * Prompts for the admin PIN and verifies it.
 */
async function promptForAdminPin() {
    showModal('Enter admin PIN:', 'prompt', async (pin) => {
        if (pin) {
            showModal('Verifying PIN...', 'loading');
            const result = await verifyAdminPin(pin);
            hideModal();

            setTimeout(() => {
                if (result.success) {
                    showModal(`🔑 ${result.message} Welcome to Admin Mode!`, 'alert');
                    setAdminMode(true);
                } else {
                    showModal(`❌ ${result.message}`, 'alert');
                    console.warn('Admin access denied');
                }
            }, 150);
        }
    });
}

/**
 * Initializes all admin mode functionality, including event listeners
 * and checking for persisted admin state.
 */
function initializeAdminMode() {
    console.log('🔧 Initializing Admin Mode...');

    // Check for persisted admin state on page load
    if (getIsAdminMode()) {
        setAdminMode(true);
    }

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (getIsAdminMode()) {
                setAdminMode(false);
                showModal('Admin mode deactivated.', 'alert');
            } else {
                promptForAdminPin();
            }
        });
        console.log('✅ Admin button found and configured');
    } else {
        console.warn('⚠️ Admin button not found');
    }

    // Keyboard shortcut for admin (Ctrl+Alt+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            if (!getIsAdminMode()) {
                promptForAdminPin();
            }
        }
    });
}

// Export the necessary functions
export { initializeAdminMode, getIsAdminMode };