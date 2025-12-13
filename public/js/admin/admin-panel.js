import { doc, setDoc, deleteDoc, collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

let venuesCache = [];

export function initializeAdminPanel(db, auth, refreshData) {
    console.log('🔧 Initializing Admin Panel...');
    
    // Initialize venue management
    initializeVenueManagement(db, refreshData);

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

    const saveLogoUrlsBtn = document.getElementById('save-logo-urls-btn');
    if (saveLogoUrlsBtn) {
        saveLogoUrlsBtn.addEventListener('click', async () => {
            const darkLogoUrl = document.getElementById('dark-logo-url').value;
            const lightLogoUrl = document.getElementById('light-logo-url').value;
            const defaultLogoUrl = document.getElementById('default-logo-url').value;

            try {
                await setDoc(doc(db, "site_config", "main"), {
                    logoUrls: {
                        dark: darkLogoUrl,
                        light: lightLogoUrl,
                        default: defaultLogoUrl
                    }
                }, { merge: true });
                showModal("Logo URLs saved successfully!", "alert");
                await refreshData();
            } catch (error) {
                console.error("Error saving logo URLs:", error);
                showModal("Failed to save logo URLs.", "alert");
            }
        });
    }

    console.log('✅ Admin Panel initialized.');
}

// ============================================
// VENUE MANAGEMENT FUNCTIONS
// ============================================

function initializeVenueManagement(db, refreshData) {
    console.log('🔧 Initializing Venue Management...');
    
    const addVenueBtn = document.getElementById('add-venue-btn');
    const venueForm = document.getElementById('venue-form');
    const cancelVenueBtn = document.getElementById('cancel-venue-btn');
    const venuesList = document.getElementById('venues-list');

    if (!venueForm || !venuesList) {
        console.warn('Venue management elements not found');
        return;
    }

    // Load venues on initialization
    loadVenues(db);

    // Add venue button
    if (addVenueBtn) {
        addVenueBtn.addEventListener('click', () => {
            showAddVenueForm();
        });
    }

    // Cancel button
    if (cancelVenueBtn) {
        cancelVenueBtn.addEventListener('click', () => {
            cancelVenueForm();
        });
    }

    // Form submission
    venueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveVenue(db, refreshData);
    });

    // Event delegation for edit/delete buttons
    venuesList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const venueId = target.dataset.id;

        if (target.classList.contains('edit-venue-btn')) {
            showEditVenueForm(venueId, db);
        } else if (target.classList.contains('delete-venue-btn')) {
            await deleteVenue(venueId, db, refreshData);
        }
    });

    console.log('✅ Venue Management initialized.');
}

async function loadVenues(db) {
    const venuesList = document.getElementById('venues-list');
    if (!venuesList) return;

    try {
        venuesList.innerHTML = '<p class="text-center text-gray-500">Loading venues...</p>';
        
        const venuesSnapshot = await getDocs(collection(db, 'venues'));
        venuesCache = [];
        
        venuesSnapshot.forEach(doc => {
            venuesCache.push({ id: doc.id, ...doc.data() });
        });

        if (venuesCache.length === 0) {
            venuesList.innerHTML = '<p class="text-center text-gray-500">No venues found. Add your first venue!</p>';
            return;
        }

        // Sort venues alphabetically by name
        venuesCache.sort((a, b) => a.name.localeCompare(b.name));

        // Render venues
        venuesList.innerHTML = '';
        venuesCache.forEach(venue => {
            const venueCard = document.createElement('div');
            venueCard.className = 'bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow';
            
            venueCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h5 class="text-lg font-bold text-primary mb-2">${venue.name}</h5>
                        ${venue.address ? `<p class="text-sm text-gray-600 mb-1"><strong>Address:</strong> ${venue.address}</p>` : ''}
                        ${venue.website ? `<p class="text-sm text-gray-600 mb-1"><strong>Website:</strong> <a href="${venue.website}" target="_blank" class="text-blue-500 hover:underline">${venue.website}</a></p>` : ''}
                        ${venue.mapLink ? `<p class="text-sm text-gray-600 mb-1"><strong>Map:</strong> <a href="${venue.mapLink}" target="_blank" class="text-blue-500 hover:underline">View on Google Maps</a></p>` : ''}
                        ${venue.imageUrl ? `<p class="text-sm text-gray-600"><strong>Image:</strong> <a href="${venue.imageUrl}" target="_blank" class="text-blue-500 hover:underline">View Image</a></p>` : ''}
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button data-id="${venue.id}" class="edit-venue-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                            Edit
                        </button>
                        <button data-id="${venue.id}" class="delete-venue-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            
            venuesList.appendChild(venueCard);
        });

    } catch (error) {
        console.error('Error loading venues:', error);
        venuesList.innerHTML = '<p class="text-center text-red-500">Error loading venues. Please try again.</p>';
    }
}

function showAddVenueForm() {
    const venueForm = document.getElementById('venue-form');
    const formTitle = document.getElementById('venue-form-title');
    
    if (!venueForm) return;

    // Reset form
    venueForm.reset();
    document.getElementById('edit-venue-id').value = '';
    
    // Update title
    if (formTitle) {
        formTitle.textContent = 'Add New Venue';
    }
    
    // Show form
    venueForm.style.display = 'block';
    
    // Scroll to form
    venueForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function showEditVenueForm(venueId, db) {
    const venueForm = document.getElementById('venue-form');
    const formTitle = document.getElementById('venue-form-title');
    
    if (!venueForm) return;

    try {
        // Find venue in cache
        const venue = venuesCache.find(v => v.id === venueId);
        
        if (!venue) {
            showModal('Venue not found.', 'alert');
            return;
        }

        // Populate form
        document.getElementById('edit-venue-id').value = venue.id;
        document.getElementById('venue-name').value = venue.name || '';
        document.getElementById('venue-address').value = venue.address || '';
        document.getElementById('venue-map-link').value = venue.mapLink || '';
        document.getElementById('venue-website').value = venue.website || '';
        document.getElementById('venue-image-url').value = venue.imageUrl || '';

        // Update title
        if (formTitle) {
            formTitle.textContent = 'Edit Venue';
        }

        // Show form
        venueForm.style.display = 'block';
        
        // Scroll to form
        venueForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Error loading venue for edit:', error);
        showModal('Error loading venue data.', 'alert');
    }
}

function cancelVenueForm() {
    const venueForm = document.getElementById('venue-form');
    if (venueForm) {
        venueForm.style.display = 'none';
        venueForm.reset();
        document.getElementById('edit-venue-id').value = '';
    }
}

async function saveVenue(db, refreshData) {
    const venueId = document.getElementById('edit-venue-id').value;
    const venueName = document.getElementById('venue-name').value.trim();
    const venueAddress = document.getElementById('venue-address').value.trim();
    const venueMapLink = document.getElementById('venue-map-link').value.trim();
    const venueWebsite = document.getElementById('venue-website').value.trim();
    const venueImageUrl = document.getElementById('venue-image-url').value.trim();

    // Validation
    if (!venueName) {
        showModal('Venue name is required.', 'alert');
        return;
    }

    // Validate URLs if provided
    if (venueMapLink && !isValidUrl(venueMapLink)) {
        showModal('Please enter a valid Google Maps URL.', 'alert');
        return;
    }

    if (venueWebsite && !isValidUrl(venueWebsite)) {
        showModal('Please enter a valid website URL.', 'alert');
        return;
    }

    if (venueImageUrl && !isValidUrl(venueImageUrl)) {
        showModal('Please enter a valid image URL.', 'alert');
        return;
    }

    try {
        // Show loading state
        const submitBtn = document.querySelector('#venue-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const id = venueId || String(Date.now());
        const venueData = {
            id,
            name: venueName,
            address: venueAddress,
            mapLink: venueMapLink,
            website: venueWebsite,
            imageUrl: venueImageUrl
        };

        await setDoc(doc(db, 'venues', id), venueData);

        // Hide form
        cancelVenueForm();

        // Reload venues
        await loadVenues(db);

        // Refresh main data to update dropdowns
        await refreshData();

        showModal(`Venue ${venueId ? 'updated' : 'added'} successfully!`, 'alert');

        // Restore button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

    } catch (error) {
        console.error('Error saving venue:', error);
        showModal('Failed to save venue. Please try again.', 'alert');
        
        // Restore button
        const submitBtn = document.querySelector('#venue-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Venue';
    }
}

async function deleteVenue(venueId, db, refreshData) {
    try {
        // Check if any jams reference this venue
        const jamsSnapshot = await getDocs(collection(db, 'jams'));
        const jamsUsingVenue = [];
        
        jamsSnapshot.forEach(doc => {
            const jam = doc.data();
            if (jam.venueId === venueId) {
                jamsUsingVenue.push(jam);
            }
        });

        if (jamsUsingVenue.length > 0) {
            showModal(
                `Cannot delete this venue. It is currently used by ${jamsUsingVenue.length} jam session(s). Please update or delete those jams first.`,
                'alert'
            );
            return;
        }

        // Confirm deletion
        showModal('Are you sure you want to delete this venue?', 'confirm', async () => {
            try {
                await deleteDoc(doc(db, 'venues', venueId));
                
                // Reload venues
                await loadVenues(db);
                
                // Refresh main data to update dropdowns
                await refreshData();
                
                showModal('Venue deleted successfully.', 'alert');
            } catch (error) {
                console.error('Error deleting venue:', error);
                showModal('Failed to delete venue. Please try again.', 'alert');
            }
        });

    } catch (error) {
        console.error('Error checking venue usage:', error);
        showModal('Error checking venue usage. Please try again.', 'alert');
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}
