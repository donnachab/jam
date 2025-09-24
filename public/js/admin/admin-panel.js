import { collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

export function initializeAdminPanel(db, auth, refreshData) {
    console.log('🔧 Initializing Admin Panel...');

    const saveConfigBtn = document.getElementById('save-site-config-btn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            const siteTitle = document.getElementById('site-title-input').value;
            const metaDescription = document.getElementById('meta-description-input').value;

            try {
                await setDoc(doc(db, "site_config", "main"), {
                    siteTitle,
                    metaDescription
                }, { merge: true });
                showModal("Site configuration saved successfully!", "alert");
                await refreshData();
            } catch (error) {
                console.error("Error saving site config:", error);
                showModal("Failed to save site configuration.", "alert");
            }
        });
    }

    // Add more admin panel functionality here as needed...

    console.log('✅ Admin Panel initialized.');
}
