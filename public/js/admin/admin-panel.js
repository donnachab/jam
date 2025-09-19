import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { showModal } from '../ui/modal.js';

export function initializeAdminPanel(loadAllData) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    const tabButtons = adminPanel.querySelectorAll('.admin-tab-btn');
    const tabContents = adminPanel.querySelectorAll('.admin-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active-tab'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Activate the clicked tab
            button.classList.add('active-tab');
            const tabId = button.dataset.tab;
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });

    // --- Site Logo Management ---
    const editSiteLogoBtn = document.getElementById('edit-site-logo-btn');
    const editSiteLogoForm = document.getElementById('edit-site-logo-form');
    const cancelSiteLogoBtn = document.getElementById('cancel-site-logo-btn');
    const siteLogoFile = document.getElementById('site-logo-file');
    const siteLogoUrlInput = document.getElementById('site-logo-url');
    const siteLogoThemeSelect = document.getElementById('site-logo-theme-select');

    const siteConfigRef = doc(db, "site_config", "main");

    async function loadLogoForSelectedTheme() {
        const selectedTheme = siteLogoThemeSelect.value;
        const configSnap = await getDoc(siteConfigRef);
        if (configSnap.exists()) {
            const configData = configSnap.data();
            const logoUrls = configData.logoUrls || {};
            siteLogoUrlInput.value = logoUrls[selectedTheme] || '';
        }
    }

    if (siteLogoThemeSelect) {
        siteLogoThemeSelect.addEventListener('change', loadLogoForSelectedTheme);
    }

    if (editSiteLogoBtn) {
        editSiteLogoBtn.addEventListener('click', () => {
            editSiteLogoForm.style.display = 'block';
            loadLogoForSelectedTheme(); // Load current logo for selected theme
        });
    }

    if (cancelSiteLogoBtn) {
        cancelSiteLogoBtn.addEventListener('click', () => {
            editSiteLogoForm.style.display = 'none';
            editSiteLogoForm.reset();
        });
    }

    if (editSiteLogoForm) {
        editSiteLogoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedTheme = siteLogoThemeSelect.value;
            let logoUrl = siteLogoUrlInput.value;

            if (siteLogoFile.files.length > 0) {
                const file = siteLogoFile.files[0];
                const storage = getStorage();
                const storageRef = ref(storage, `site_config/logo/${selectedTheme}/${file.name}`);
                try {
                    await uploadBytes(storageRef, file);
                    logoUrl = await getDownloadURL(storageRef);
                    showModal('Logo uploaded successfully!', 'success');
                } catch (error) {
                    console.error('Error uploading logo:', error);
                    showModal('Error uploading logo. Please try again.', 'error');
                    return;
                }
            }

            if (logoUrl) {
                try {
                    // Update nested field in Firestore
                    await updateDoc(siteConfigRef, {
                        [`logoUrls.${selectedTheme}`]: logoUrl
                    });
                    showModal('Site logo updated successfully!', 'success');
                    editSiteLogoForm.style.display = 'none';
                    editSiteLogoForm.reset();
                    loadAllData(); // Refresh site data to show new logo
                } catch (error) {
                    console.error('Error updating site config with logo URL:', error);
                    showModal('Error updating site logo. Please try again.', 'error');
                }
            } else {
                showModal('Please provide a logo file or a URL.', 'warning');
            }
        });
    }

    console.log('✅ Admin Panel initialized.');
}
