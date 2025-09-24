import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { Store } from '../state/store.js';
import { showModal } from '../ui/modal.js';
import { themeManager } from '../ui/theme-switcher.js';
import { createImagePreview } from '../ui/previews.js';

export function initializeAdminPanel(db, auth, loadAllData) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

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
    const siteLogoPreviewContainer = document.getElementById('site-logo-preview-container');

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
        allButtons.forEach(btn => {
            if (btn.id !== 'site-logo-url' || !siteLogoFile.files.length) {
                btn.disabled = state.isLoading;
            }
        });

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
            const functions = getFunctions(getApp(), 'us-central1');
            const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
            const result = await generateSignedUploadUrl({ 
                fileName: `logo-${selectedTheme}-${file.name}`,
                contentType: file.type 
            });

            if (!result.data.success) {
                throw new Error(result.data.message || 'Failed to get upload URL.');
            }
            const uploadUrl = result.data.url;

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('File upload failed.');
            }
            
            const logoUrl = uploadUrl.split('?')[0];

            await updateDoc(siteConfigRef, {
                [`logoUrls.${selectedTheme}`]: logoUrl
            });

            store.commit('SET_LOGO_FORM_VISIBLE', false);
            editSiteLogoForm.reset();
            themeManager.set(selectedTheme, logoUrl);
            await loadInitialLogoData();

            showModal('Logo updated successfully!', 'alert');

        } catch (error) {
            console.error("Error uploading logo:", error);
            store.commit('SET_ERROR', `Upload failed: ${error.message}`);
        } finally {
            store.commit('SET_LOADING', false);
        }
    }
    
    // --- Event Listeners ---
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

    siteLogoFile.addEventListener('change', () => {
        if (siteLogoFile.files.length > 0) {
            siteLogoUrlInput.value = '';
            siteLogoUrlInput.disabled = true;
        } else {
            siteLogoUrlInput.disabled = false;
        }
    });

    siteLogoUrlInput.addEventListener('input', () => {
        if (siteLogoUrlInput.value) {
            siteLogoFile.value = '';
        }
    });

    editSiteLogoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileToUpload = siteLogoFile.files[0];
        const urlToSave = siteLogoUrlInput.value.trim();

        if (fileToUpload) {
            await uploadAndSaveLogo(fileToUpload);
        } else if (urlToSave) {
            store.commit('SET_LOADING', true);
            const selectedTheme = store.getState().selectedTheme;
            try {
                await updateDoc(siteConfigRef, {
                    [`logoUrls.${selectedTheme}`]: urlToSave
                });
                store.commit('SET_LOGO_FORM_VISIBLE', false);
                editSiteLogoForm.reset();
                themeManager.set(selectedTheme, urlToSave);
                await loadInitialLogoData();
                showModal('Logo URL updated successfully!', 'alert');
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

    // --- Initialize Image Previews ---
    createImagePreview(siteLogoFile, siteLogoPreviewContainer);
}
