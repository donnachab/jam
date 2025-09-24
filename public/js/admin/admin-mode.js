/**
 * Admin Mode Management V2
 * Handles admin authentication using Firebase Auth custom claims.
 */

import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { onIdTokenChanged, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showModal, hideModal } from '../ui/modal.js';

let isAdmin = false;
let currentUser = null;

// --- Top-level Functions for Firebase Interaction ---

async function setAdminClaim(pin, functions) {
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

async function exitAdminMode(functions) {
    if (!currentUser) return;
    console.log('Calling revokeAdminClaim function...');
    try {
        const revokeAdminClaimCallable = httpsCallable(functions, 'revokeAdminClaim');
        await revokeAdminClaimCallable();
        console.log('✅ Admin claim revoked, forcing token refresh...');
        await currentUser.getIdToken(true);
        showModal('Admin mode deactivated.', 'alert');
    } catch (error) {
        console.error('❌ Firebase revokeAdminClaim failed:', error);
        showModal(`Could not exit admin mode: ${error.message}`, 'alert');
    }
}

// --- UI and Event Handling ---

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

function promptForAdminPin(functions) {
    console.log('Prompting for admin PIN...');
    showModal('Enter admin PIN:', 'prompt', async (pin) => {
        if (pin) {
            console.log('PIN entered, verifying...');
            showModal('Verifying PIN...', 'loading');
            const result = await setAdminClaim(pin, functions);
            hideModal();

            if (result.success) {
                console.log('Admin claim successful, forcing token refresh...');
                await currentUser.getIdToken(true);
                showModal('🔑 Welcome to Admin Mode!', 'alert');
            } else {
                console.warn('Admin access denied:', result.message);
                showModal(`❌ ${result.message}`, 'alert');
            }
        }
    });
}

// --- Main Initialization Function ---

export function initializeAdminMode(db, auth, functions, refreshData) {
    console.log('🔧 Initializing Admin Mode V2...');

    onIdTokenChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            const idTokenResult = await user.getIdTokenResult();
            const newIsAdmin = idTokenResult.claims.admin === true;
            if (isAdmin !== newIsAdmin) {
                setAdminModeUI(newIsAdmin);
            }
        } else if (isAdmin) {
            setAdminModeUI(false);
        }
    });

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdmin) {
                exitAdminMode(functions);
            } else {
                promptForAdminPin(functions);
            }
        });
        console.log('✅ Admin button found and configured');
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('exit-admin-btn')) {
            e.preventDefault();
            if (isAdmin) {
                exitAdminMode(functions);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            if (!isAdmin) {
                promptForAdminPin(functions);
            }
        }
    });
}

export function getIsAdminMode() {
    return isAdmin;
}
