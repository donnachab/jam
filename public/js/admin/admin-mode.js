/**
 * Admin Mode Management
 * Handles admin authentication via a PIN, custom auth tokens, and UI toggles.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { getAuth, signInWithCustomToken, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { app } from '../firebase-config.js';
import { showModal, hideModal } from '../ui/modal.js';

// Firebase Services
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

// This UID must match the one defined in the `verifyAdminPin` cloud function.
const ADMIN_UID = "gjc-admin-user";

// Connect to emulators if the app is running locally
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    console.log('Connecting to Functions emulator on localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connecting to Auth emulator on localhost:9099');
    connectAuthEmulator(auth, 'http://localhost:9099');
}

/**
 * Calls the cloud function to verify PIN and get a custom auth token.
 * @param {string} pin The admin PIN entered by the user.
 * @returns {Promise<object>} The result from the cloud function.
 */
async function getAdminToken(pin) {
    try {
        const verifyPinCallable = httpsCallable(functions, 'verifyAdminPin');
        const result = await verifyPinCallable({ pin: pin });
        return result.data;
    } catch (error) {
        console.error('Error calling verifyAdminPin function:', error.message);
        return { success: false, message: `Verification failed: ${error.code}` };
    }
}

/**
 * Toggles the admin mode UI elements on or off.
 * @param {boolean} isAdmin - Whether to enable or disable the admin UI.
 */
function setAdminUi(isAdmin) {
    document.body.classList.toggle("admin-mode", isAdmin);

    const adminModeBtn = document.getElementById("admin-mode-btn");
    if (adminModeBtn) {
        adminModeBtn.textContent = isAdmin ? "Exit Admin" : "Admin Mode";
        adminModeBtn.classList.toggle("active", isAdmin);
    }

    // Show/hide admin controls
    const adminControls = document.querySelectorAll('.admin-control, .admin-only');
    adminControls.forEach(control => {
        control.style.display = isAdmin ? 'block' : 'none';
    });

    console.log(isAdmin ? "🔑 Admin mode activated" : "👤 Admin mode deactivated");
}

/**
 * Handles the PIN submission, token exchange, and sign-in process.
 * @param {string} pin The PIN from the modal prompt.
 */
async function handlePinSubmit(pin) {
    if (!pin) return;

    // Show a proper loading modal, fixing the UX flaw from spec.md
    showModal("Verifying PIN...", "loading");
    const result = await getAdminToken(pin);
    hideModal();

    // A short delay prevents the result modal from appearing too abruptly.
    setTimeout(async () => {
        if (result.success && result.token) {
            try {
                await signInWithCustomToken(auth, result.token);
                // Set a session flag to re-enable admin mode on page reload.
                sessionStorage.setItem('gjc_admin_requested', 'true');
                showModal("✅ Welcome to Admin Mode!", "alert");
                // onAuthStateChanged will now handle enabling the UI.
            } catch (error) {
                console.error("Admin sign-in failed:", error);
                showModal("❌ Admin sign-in failed. Check console for details.", "alert");
            }
        } else {
            showModal("❌ " + (result.message || "Incorrect PIN."), "alert");
            console.warn("Admin access denied");
        }
    }, 150);
}

/**
 * Prompts for admin PIN.
 */
function enterAdminMode() {
    showModal("Enter admin PIN:", "prompt", handlePinSubmit);
}

/**
 * Initialize admin mode functionality
 */
function initializeAdminMode() {
    console.log("🔧 Initializing Admin Mode with Firebase...");

    // onAuthStateChanged is the single source of truth for the user's auth state.
    onAuthStateChanged(auth, (user) => {
        const isAdminSessionRequested = sessionStorage.getItem('gjc_admin_requested') === 'true';

        if (user && user.uid === ADMIN_UID && isAdminSessionRequested) {
            // User is the admin and has actively tried to log in this session.
            setAdminUi(true);
        } else {
            // User is not the admin, or hasn't tried to log in this session.
            setAdminUi(false);
            // If there's a lingering user session that isn't our admin, clear it.
            if (user) {
                signOut(auth);
            }
        }
    });

    const adminModeBtn = document.getElementById("admin-mode-btn");

    if (adminModeBtn) {
        adminModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentUser = auth.currentUser;

            if (currentUser && currentUser.uid === ADMIN_UID) {
                // If admin is logged in, sign them out.
                sessionStorage.removeItem('gjc_admin_requested');
                signOut(auth).then(() => {
                    showModal("Admin mode deactivated.", "alert");
                });
            } else {
                // Otherwise, prompt for the PIN to sign in.
                enterAdminMode();
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
            const currentUser = auth.currentUser;
            if (!currentUser || currentUser.uid !== ADMIN_UID) {
                enterAdminMode();
            }
        }
    });
}

export { initializeAdminMode };
