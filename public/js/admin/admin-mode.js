/**
 * Admin Mode Management
 * Handles admin authentication, state persistence, and UI toggles.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { app } from '../firebase-config.js';
import { showModal, hideModal } from '../ui/modal.js';

const ADMIN_MODE_KEY = 'isAdminMode';
let isAdmin = false;

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Connect to emulators in local development
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    console.log('🔌 Connecting to Functions emulator on localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

async function verifyAdminPin(pin) {
    console.log(`Verifying PIN: ${pin}`);
    try {
        const verifyPinCallable = httpsCallable(functions, 'verifyAdminPin');
        const result = await verifyPinCallable({ pin });
        console.log('✅ PIN verification result:', result.data);
        return result.data;
    } catch (error) {
        console.error('❌ Firebase admin verification failed:', error);
        return { success: false, message: `Verification failed: ${error.message}` };
    }
}

function setAdminMode(enable) {
    console.log(`Setting admin mode to: ${enable}`);
    isAdmin = enable;
    sessionStorage.setItem(ADMIN_MODE_KEY, enable);
    document.body.classList.toggle('admin-mode', enable);

    const adminModeBtn = document.getElementById('admin-mode-btn');
    if (adminModeBtn) {
        adminModeBtn.textContent = enable ? 'Exit Admin' : 'Admin Mode';
        adminModeBtn.classList.toggle('active', enable);
    }
    
    console.log(enable ? '🔑 Admin mode activated' : '👤 Admin mode deactivated');
}

function getIsAdminMode() {
    return isAdmin;
}

async function promptForAdminPin() {
    console.log('Prompting for admin PIN...');
    showModal('Enter admin PIN:', 'prompt', async (pin) => {
        if (pin) {
            console.log('PIN entered, verifying...');
            showModal('Verifying PIN...', 'loading');
            const result = await verifyAdminPin(pin);
            hideModal();

            setTimeout(() => {
                if (result.success) {
                    console.log('PIN verification successful.');
                    showModal(`🔑 ${result.message} Welcome to Admin Mode!`, 'alert');
                    setAdminMode(true);
                } else {
                    console.warn('Admin access denied:', result.message);
                    showModal(`❌ ${result.message}`, 'alert');
                }
            }, 150);
        }
    });
}

function initializeAdminMode() {
    console.log('🔧 Initializing Admin Mode...');

    const isAdminFromStorage = sessionStorage.getItem(ADMIN_MODE_KEY) === 'true';
    console.log(`Initial admin state from session storage: ${isAdminFromStorage}`);
    setAdminMode(isAdminFromStorage);

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

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('exit-admin-btn')) {
            e.preventDefault();
            if (getIsAdminMode()) {
                setAdminMode(false);
                showModal('Admin mode deactivated.', 'alert');
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            if (!getIsAdminMode()) {
                promptForAdminPin();
            }
        }
    });
}

export { initializeAdminMode, getIsAdminMode };
