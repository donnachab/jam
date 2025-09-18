/**
 * Admin Mode Management V2
 * Handles admin authentication using Firebase Auth custom claims.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getAuth, signInAnonymously, onIdTokenChanged, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from '../firebase-config.js';
import { showModal, hideModal } from '../ui/modal.js';

let isAdmin = false;
let currentUser = null;

// Initialize Firebase Services
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

// Connect to emulators in local development
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    console.log('🔌 Connecting to Functions emulator on localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔌 Connecting to Auth emulator on localhost:9099');
    connectAuthEmulator(auth, 'http://localhost:9099');
}

/**
 * Ensures the user is signed in anonymously to provide a UID for custom claims.
 */
async function ensureAnonymousAuth() {
    if (auth.currentUser) {
        console.log('👤 User already signed in.', auth.currentUser.uid);
        currentUser = auth.currentUser;
        return;
    }
    try {
        console.log('👤 No user found, signing in anonymously...');
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        console.log('✅ Anonymous sign-in successful.', currentUser.uid);
    } catch (error) {
        console.error('❌ Anonymous sign-in failed:', error);
        showModal('Could not authenticate. Please refresh the page.', 'alert');
    }
}

/**
 * Calls the backend function to set an admin claim on the user's token.
 * @param {string} pin The admin PIN.
 */
async function setAdminClaim(pin) {
    console.log('Attempting to set admin claim...');
    try {
        const setAdminClaimCallable = httpsCallable(functions, 'setAdminClaim');
        const result = await setAdminClaimCallable({ pin });
        console.log('✅ Admin claim function result:', result.data);
        return result.data;
    } catch (error) {
        console.error('❌ Firebase setAdminClaim failed:', error);
        return { success: false, message: `Verification failed: ${error.message}` };
    }
}

/**
 * Toggles the UI to reflect the user's admin status.
 * @param {boolean} enable Whether to enable or disable admin mode UI.
 */
function setAdminModeUI(enable) {
    isAdmin = enable;
    document.body.classList.toggle('admin-mode', enable);

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? 'Exit Admin' : 'Admin Mode';
        adminModeBtn.classList.toggle('active', enable);
    }
    console.log(enable ? '🔑 Admin mode UI activated' : '👤 Admin mode UI deactivated');
}

/**
 * Logs the user out of admin mode by calling the revokeAdminClaim function.
 */
async function exitAdminMode() {
    if (!currentUser) return;
    console.log('Calling revokeAdminClaim function...');
    try {
        const revokeAdminClaimCallable = httpsCallable(functions, 'revokeAdminClaim');
        await revokeAdminClaimCallable();
        console.log('✅ Admin claim revoked, forcing token refresh...');
        // Force a refresh of the ID token to remove the custom claim.
        await currentUser.getIdToken(true);
        showModal('Admin mode deactivated.', 'alert');
    } catch (error) {
        console.error('❌ Firebase revokeAdminClaim failed:', error);
        showModal(`Could not exit admin mode: ${error.message}`, 'alert');
    }
}


/**
 * Prompts the user for the admin PIN and attempts to elevate their privileges.
 */
async function promptForAdminPin() {
    console.log('Prompting for admin PIN...');
    showModal('Enter admin PIN:', 'prompt', async (pin) => {
        if (pin) {
            console.log('PIN entered, verifying...');
            showModal('Verifying PIN...', 'loading');
            const result = await setAdminClaim(pin);
            hideModal();

            if (result.success) {
                console.log('Admin claim successful, forcing token refresh...');
                // Force a refresh of the ID token to get the new custom claim.
                await currentUser.getIdToken(true);
                showModal('🔑 Welcome to Admin Mode!', 'alert');
            } else {
                console.warn('Admin access denied:', result.message);
                showModal(`❌ ${result.message}`, 'alert');
            }
        }
    });
}

/**
 * Main initialization function for admin mode.
 */
async function initializeAdminMode() {
    console.log('🔧 Initializing Admin Mode V2...');

    let isInitialLoad = true;

    await ensureAnonymousAuth();

    onIdTokenChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const idTokenResult = await user.getIdTokenResult();
            const newIsAdmin = idTokenResult.claims.admin === true;

            if (isInitialLoad) {
                console.log('✨ Initial page load. Ensuring user is not in admin mode.');
                if (newIsAdmin) {
                    // If the user has an admin claim on load, revoke it to ensure they start fresh.
                    await exitAdminMode(); 
                }
                setAdminModeUI(false); // Always start with admin mode off.
                isInitialLoad = false;
            } else if (isAdmin !== newIsAdmin) {
                console.log(`Admin status changed to: ${newIsAdmin}`);
                setAdminModeUI(newIsAdmin);
            }
        } else {
            currentUser = null;
            if (isAdmin) {
                console.log('User logged out, deactivating admin mode.');
                setAdminModeUI(false);
            }
        }
    });

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdmin) {
                exitAdminMode();
            } else {
                promptForAdminPin();
            }
        });
        console.log('✅ Admin button found and configured');
    } else {
        console.warn('⚠️ Admin button not found');
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('exit-admin-btn')) {
            e.preventDefault();
            if (isAdmin) {
                exitAdminMode();
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            if (!isAdmin) {
                promptForAdminPin();
            }
        }
    });
}

function getIsAdminMode() {
    return isAdmin;
}

export { initializeAdminMode, getIsAdminMode };
