import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    const siteLogoUrl = document.getElementById('site-logo-url');

    if (editSiteLogoBtn) {
        editSiteLogoBtn.addEventListener('click', () => {
            editSiteLogoForm.style.display = 'block';
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
            let logoUrl = siteLogoUrl.value;

            if (siteLogoFile.files.length > 0) {
                const file = siteLogoFile.files[0];
                const storage = getStorage();
                const storageRef = ref(storage, `site_config/logo/${file.name}`);
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
                    const configRef = doc(db, "site_config", "main");
                    await updateDoc(configRef, {
                        logoUrl: logoUrl
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