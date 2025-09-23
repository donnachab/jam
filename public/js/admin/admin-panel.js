import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app, db } from '../firebase-config.js';
import { Store } from '../state/store.js';
import { showModal } from '../ui/modal.js';

export function initializeAdminPanel(loadAllData) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    // --- Initialize Firebase Functions ---
    const functions = getFunctions(app);
    const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');

    // --- DOM Elements ---
    const tabButtons = adminPanel.querySelectorAll('.admin-tab-btn');
    const tabContents = adminPanel.querySelectorAll('.admin-tab-content');
    const editSiteLogoBtn = document.getElementById('edit-site-logo-btn');
    const editSiteLogoForm = document.getElementById('edit-site-logo-form');
    const cancelSiteLogoBtn = document.getElementById('cancel-site-logo-btn');
    const siteLogoFile = document.getElementById('site-logo-file');
    const siteLogoUrlInput = document.getElementById('site-logo-url');
    const siteLogoThemeSelect = document.getElementById('site-logo-theme-select');
    const siteConfigRef = doc(db, "site_config", "main");

    // --- State Management Setup ---
    const initialState = {
        isLogoFormVisible: false,
        isLoading: false,
        error: null,
        logoUrlsByTheme: {},
        selectedTheme: 'default',
    };

    const store = new Store(initialState);

    store.registerMutations({
        SET_LOADING(state, isLoading) {
            state.isLoading = isLoading;
        },
        SET_ERROR(state, error) {
            state.error = error;
            if (error) {
                showModal(error, 'error');
            }
        },
        SET_LOGO_FORM_VISIBLE(state, isVisible) {
            state.isLogoFormVisible = isVisible;
        },
        SET_LOGO_DATA(state, logoData) {
            state.logoUrlsByTheme = logoData.logoUrls || {};
        },
        SET_SELECTED_THEME(state, theme) {
            state.selectedTheme = theme;
        }
    });

    // --- Render Function ---
    function render() {
        const state = store.getState();

        // Render loading state (e.g., disable buttons)
        const allButtons = adminPanel.querySelectorAll('button, input');
        allButtons.forEach(btn => btn.disabled = state.isLoading);

        // Render form visibility
        editSiteLogoForm.style.display = state.isLogoFormVisible ? 'block' : 'none';

        // Render logo URL input
        siteLogoUrlInput.value = state.logoUrlsByTheme[state.selectedTheme] || '';
        
        // Ensure the theme dropdown reflects the state
        siteLogoThemeSelect.value = state.selectedTheme;
    }

    // --- Subscribe Render to Store ---
    store.subscribe(render);

    // --- Asynchronous Actions ---
    async function loadInitialLogoData() {
        store.commit('SET_LOADING', true);
        try {
            const configSnap = await getDoc(siteConfigRef);
            if (configSnap.exists()) {
                store.commit('SET_LOGO_DATA', configSnap.data());
            }
        } catch (error) {
            console.error("Error loading site config:", error);
            store.commit('SET_ERROR', 'Could not load site configuration.');
        } finally {
            store.commit('SET_LOADING', false);
        }
    }

    async function uploadAndSaveLogo(file) {
        if (!file) {
            showModal('Please select a file to upload.', 'warning');
            return;
        }
        
        store.commit('SET_LOADING', true);
        store.commit('SET_ERROR', null);
        const selectedTheme = store.getState().selectedTheme;

        try {
            // 1. Get signed URL from backend
            const result = await generateSignedUploadUrl({ 
                fileName: `logo-${selectedTheme}-${file.name}`, 
                contentType: file.type 
            });

            if (!result.data.success) {
                throw new Error(result.data.message || 'Failed to get upload URL.');
            }
            const uploadUrl = result.data.url;

            // 2. Upload the file to the signed URL
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('File upload failed.');
            }
            
            // The public URL is the URL without the query string
            const logoUrl = uploadUrl.split('?')[0];

            // 3. Save the new URL to Firestore
            await updateDoc(siteConfigRef, {
                [`logoUrls.${selectedTheme}`]: logoUrl
            });

            showModal('Logo updated successfully!', 'alert');
            store.commit('SET_LOGO_FORM_VISIBLE', false);
            editSiteLogoForm.reset();
            await loadInitialLogoData(); // Refresh data
            loadAllData(); // Call the global refresh function

        } catch (error) {
            console.error("Error uploading logo:", error);
            store.commit('SET_ERROR', `Upload failed: ${error.message}`);
        } finally {
            store.commit('SET_LOADING', false);
        }
    }
    
    // --- Event Listeners ---
    // Tab switching logic remains unchanged for now
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active-tab'));
            tabContents.forEach(content => content.classList.add('hidden'));
            button.classList.add('active-tab');
            const tabId = button.dataset.tab;
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });

    // Logo management listeners
    editSiteLogoBtn.addEventListener('click', () => {
        store.commit('SET_LOGO_FORM_VISIBLE', true);
    });

    cancelSiteLogoBtn.addEventListener('click', () => {
        store.commit('SET_LOGO_FORM_VISIBLE', false);
        editSiteLogoForm.reset();
    });

    siteLogoThemeSelect.addEventListener('change', (e) => {
        store.commit('SET_SELECTED_THEME', e.target.value);
    });

    editSiteLogoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileToUpload = siteLogoFile.files[0];
        const urlToSave = siteLogoUrlInput.value;

        if (fileToUpload) {
            await uploadAndSaveLogo(fileToUpload);
        } else if (urlToSave) {
            // If only a URL is provided, save it directly
            store.commit('SET_LOADING', true);
            const selectedTheme = store.getState().selectedTheme;
            try {
                await updateDoc(siteConfigRef, {
                    [`logoUrls.${selectedTheme}`]: urlToSave
                });
                showModal('Logo URL updated successfully!', 'alert');
                store.commit('SET_LOGO_FORM_VISIBLE', false);
                editSiteLogoForm.reset();
                loadAllData();
            } catch (error) {
                store.commit('SET_ERROR', 'Failed to save logo URL.');
            } finally {
                store.commit('SET_LOADING', false);
            }
        } else {
            showModal('Please provide a logo file or a URL.', 'warning');
        }
    });

    // --- Initial Data Load ---
    loadInitialLogoData();
    console.log('✅ Admin Panel initialized with new state management for Logo.');
}