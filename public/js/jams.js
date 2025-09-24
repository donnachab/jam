import { doc, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from './ui/modal.js';

function getVenueName(venueId, venues) {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.name : 'Unknown Venue';
}

export function renderJams(jams, venues, config) {
    const list = document.getElementById("jams-list");
    if (!list) return;
    list.innerHTML = "";

    if (!jams || !venues || !config) {
        list.innerHTML = `<p class="text-center text-red-500">Could not load jam data due to a configuration error.</p>`;
        return;
    }

    if (jams.length === 0) {
        list.innerHTML = `<p class="text-center text-gray-500">No jams scheduled at the moment. Check back soon!</p>`;
    } else {
        jams.forEach(jam => {
            const jamElement = document.createElement("div");
            jamElement.className = "jam-item bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between";
            jamElement.innerHTML = `
                <div>
                    <h3 class="text-2xl font-bold text-primary mb-2">${jam.day}</h3>
                    <p class="text-lg text-gray-700">${jam.time}</p>
                    <p class="text-md text-gray-600 mb-4">${getVenueName(jam.venueId, venues)}</p>
                    <p class="text-gray-500">${jam.details}</p>
                </div>
                <div class="admin-controls-inline mt-4 space-x-2">
                    <button data-id="${jam.id}" class="edit-jam-btn bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button data-id="${jam.id}" class="delete-jam-btn bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                    </button>
                </div>`;
            list.appendChild(jamElement);
        });
    }

    const formatInfo = document.getElementById("format-info");
    if (formatInfo && config.jamFormat) {
        formatInfo.innerHTML = `<p>${config.jamFormat}</p>`;
    }

    const editFormatBtn = document.getElementById('edit-format-btn');
    const editFormatForm = document.getElementById('edit-format-form');
    if (editFormatBtn) {
        editFormatBtn.addEventListener('click', () => {
            editFormatForm.style.display = 'block';
            document.getElementById('jam-format-input').value = config.jamFormat || '';
        });
    }

    const cancelFormatBtn = document.getElementById('cancel-format-btn');
    if(cancelFormatBtn) {
        cancelFormatBtn.addEventListener('click', () => {
            editFormatForm.style.display = 'none';
        });
    }

    if(editFormatForm) {
        editFormatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newFormat = document.getElementById('jam-format-input').value;
            try {
                await setDoc(doc(db, "site_config", "main"), { jamFormat: newFormat }, { merge: true });
                editFormatForm.style.display = 'none';
                // No need to call refreshData here, as the main module will handle it.
            } catch (error) {
                console.error("Error updating jam format:", error);
                showModal('Failed to update format.', 'alert');
            }
        });
    }
}

export function initializeJams(db, venues, refreshData) {
    console.log('🔧 Initializing Jams module...');
    const addJamBtn = document.getElementById("add-jam-btn");
    const addJamForm = document.getElementById("add-jam-form");
    const cancelJamBtn = document.getElementById("cancel-jam-btn");
    const jamsList = document.getElementById("jams-list");

    if (addJamBtn) {
        addJamBtn.addEventListener("click", () => {
            document.getElementById("edit-jam-id").value = "";
            addJamForm.reset();
            addJamForm.style.display = "block";
        });
    }

    if(cancelJamBtn) {
        cancelJamBtn.addEventListener("click", () => {
            addJamForm.style.display = "none";
        });
    }
    
    // This is the critical check to prevent the error
    if (addJamForm) { 
        const venueInput = document.getElementById("jam-venue");
        if (venueInput) {
            venueInput.innerHTML = venues.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
        }

        addJamForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-jam-id").value || String(Date.now());
            const jamData = {
                id,
                day: document.getElementById("jam-day").value,
                time: document.getElementById("jam-time").value,
                venueId: document.getElementById("jam-venue").value,
                details: document.getElementById("jam-details").value
            };
            try {
                await setDoc(doc(db, "jams", id), jamData);
                addJamForm.style.display = "none";
                await refreshData();
                showModal("Jam saved successfully!", "alert");
            } catch (error) {
                console.error("Error saving jam:", error);
                showModal("Failed to save jam. Please try again.", "alert");
            }
        });
    }

    if (jamsList) {
        jamsList.addEventListener("click", async (e) => {
            const target = e.target.closest("button");
            if (!target) return;
            const jamId = target.dataset.id;
            
            if (target.classList.contains("edit-jam-btn")) {
                const docRef = doc(db, "jams", jamId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const jam = docSnap.data();
                    document.getElementById("edit-jam-id").value = jam.id;
                    document.getElementById("jam-day").value = jam.day;
                    document.getElementById("jam-time").value = jam.time;
                    document.getElementById("jam-venue").value = jam.venueId;
                    document.getElementById("jam-details").value = jam.details;
                    addJamForm.style.display = "block";
                }
            } else if (target.classList.contains("delete-jam-btn")) {
                showModal("Are you sure you want to delete this jam?", "confirm", async () => {
                    await deleteDoc(doc(db, "jams", jamId));
                    await refreshData();
                    showModal("Jam deleted.", "alert");
                });
            }
        });
    }
    console.log('✅ Jams module initialized.');
}
