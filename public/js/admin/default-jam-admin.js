import { db } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

export function initializeDefaultJamAdmin(config, refreshData) {
    const form = document.getElementById('default-jam-form');
    if (!form) return;

    // Populate the form with existing config values
    document.getElementById('default-jam-day').value = config.defaultJamDay || '6'; // Default to Saturday if not set
    document.getElementById('default-jam-venue').value = config.defaultJamVenue || '';
    document.getElementById('default-jam-time').value = config.defaultJamTime || '';
    document.getElementById('default-jam-map-link').value = config.defaultJamMapLink || '';

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showModal('Saving default jam settings...', 'loading');

        const newDefaults = {
            defaultJamDay: document.getElementById('default-jam-day').value,
            defaultJamVenue: document.getElementById('default-jam-venue').value.trim(),
            defaultJamTime: document.getElementById('default-jam-time').value.trim(),
            defaultJamMapLink: document.getElementById('default-jam-map-link').value.trim(),
        };

        try {
            await setDoc(doc(db, "site_config", "main"), newDefaults, { merge: true });
            showModal('Default jam settings have been saved successfully!', 'alert', refreshData);
        } catch (error) {
            console.error("Error saving default jam settings:", error);
            showModal(`Error saving settings: ${error.message}`, 'alert');
        }
    });

    console.log('✅ Default Jam Admin module initialized.');
}
