import { db } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

export function initializeDefaultJamAdmin(config, venues, refreshData) {
    const form = document.getElementById('default-jam-form');
    if (!form) return;

    const venueSelect = document.getElementById('default-jam-venue');
    const mapLinkInput = document.getElementById('default-jam-map-link');

    // Populate venue dropdown
    venueSelect.innerHTML = '<option value="">Select a venue...</option>';
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue.name;
        option.textContent = venue.name;
        venueSelect.appendChild(option);
    });

    // Populate the form with existing config values
    document.getElementById('default-jam-day').value = config.defaultJamDay || '6';
    venueSelect.value = config.defaultJamVenue || '';
    document.getElementById('default-jam-time').value = config.defaultJamTime || '';
    mapLinkInput.value = config.defaultJamMapLink || '';

    // Handle venue change
    venueSelect.addEventListener('change', () => {
        const selectedVenueName = venueSelect.value;
        const selectedVenue = venues.find(v => v.name === selectedVenueName);
        if (selectedVenue) {
            mapLinkInput.value = selectedVenue.mapLink || '';
        } else {
            mapLinkInput.value = '';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showModal('Saving default jam settings...', 'loading');

        const newDefaults = {
            defaultJamDay: document.getElementById('default-jam-day').value,
            defaultJamVenue: venueSelect.value.trim(),
            defaultJamTime: document.getElementById('default-jam-time').value.trim(),
            defaultJamMapLink: mapLinkInput.value.trim(),
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
