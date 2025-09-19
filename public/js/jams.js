import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from './ui/modal.js';

// --- Helper Functions ---
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let jamDatepicker = null;
let jamsToDisplay = [];

function parseDate(dateString) {
    if (!dateString) return null;
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const currentYear = new Date().getFullYear();
    const dateWithoutColon = dateString.replace(':', '');
    return new Date(`${dateWithoutColon} ${currentYear}`);
}

function formatTime(timeStr) {
    if (!timeStr || !timeStr.includes(":")) return timeStr;
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    const formattedHours = ((h + 11) % 12) + 1;
    return `${formattedHours}:${minutes} ${suffix}`;
}

function manageJamSchedule(confirmedJams, config) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let defaultDay = parseInt(config.defaultJamDay, 10);
    if (isNaN(defaultDay)) {
        const dayIndex = dayNames.indexOf(config.defaultJamDay);
        defaultDay = dayIndex !== -1 ? dayIndex : 6;
    }

    let upcomingConfirmed = confirmedJams
        .map(jam => ({...jam, dateObj: parseDate(jam.date)}))
        .filter(jam => jam.dateObj && jam.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    jamsToDisplay = [...upcomingConfirmed];

    const lastJamOnList = jamsToDisplay.length > 0 ? jamsToDisplay[jamsToDisplay.length - 1] : null;
    let lastDate;
    if (lastJamOnList) {
        lastDate = new Date(lastJamOnList.dateObj);
    } else {
        lastDate = new Date(today);
        lastDate.setDate(lastDate.getDate() - 1);
    }

    while (jamsToDisplay.length < 5) {
        const currentDay = lastDate.getDay();
        const daysUntilNext = (defaultDay - currentDay + 7) % 7;
        const daysToAdd = daysUntilNext === 0 ? 7 : daysUntilNext;
        lastDate.setDate(lastDate.getDate() + daysToAdd);

        const dateString = lastDate.toISOString().split('T')[0];

        if (!jamsToDisplay.some(jam => jam.date === dateString)) {
            jamsToDisplay.push({
                id: `proposal-${dateString}`,
                date: dateString,
                day: dayNames[defaultDay],
                venue: config.defaultJamVenue || "To be decided...",
                time: config.defaultJamTime || "2:00 PM",
                mapLink: config.defaultJamMapLink || null,
                isProposal: true,
            });
        }
    }

    jamsToDisplay.sort((a, b) => (a.dateObj || parseDate(a.date)) - (b.dateObj || parseDate(b.date)));
    jamsToDisplay = jamsToDisplay.slice(0, 5);
}

export function renderJams(jams, venues, config) {
    manageJamSchedule(jams, config);
    
    const jamList = document.getElementById("jam-list");
    if (!jamList) return;
    jamList.innerHTML = "";

    jamsToDisplay.forEach(jam => {
        const li = document.createElement("li");
        const dateObj = parseDate(jam.date);
        if (!dateObj) return;

        const venue = venues.find(v => v.name === jam.venue);
        const imageUrl = venue ? venue.imageUrl : null;

        const isSaturday = dateObj.getDay() === 6;
        const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;

        li.className = `p-4 rounded-lg shadow-sm border-l-4 flex flex-col sm:flex-row items-center bg-white ${jam.cancelled ? 'jam-cancelled' : ''} ${!isSaturday && !jam.isProposal ? 'jam-special' : 'border-gray-200'}`;

        let adminButtons = `
            <button data-id="${jam.id}" class="edit-jam-btn text-blue-500 hover:text-blue-700">Edit</button>
            ${jam.cancelled
                ? `<button data-id="${jam.id}" class="reinstate-jam-btn text-green-600 hover:text-green-800 ml-2">Reinstate</button>`
                : `<button data-id="${jam.id}" class="cancel-jam-btn text-yellow-600 hover:text-yellow-800 ml-2">Cancel</button>`
            }
            <button data-id="${jam.id}" class="delete-jam-btn text-red-500 hover:text-red-700 ml-2">Delete</button>
        `;

        const mapLink = jam.mapLink ? ` <a href="${jam.mapLink}" target="_blank" class="text-blue-500 hover:underline whitespace-nowrap">(Map)</a>` : "";
        
        const imageHtml = imageUrl ? `
            <div style="width: 96px; height: 96px; margin-right: 1rem; flex-shrink: 0; background-color: #e5e7eb; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center;">
                <img src="${imageUrl}" alt="${jam.venue}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>` : '';

        li.innerHTML = `
            ${imageHtml}
            <div class="flex-grow jam-info min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
                    <span class="font-bold text-lg ${isSaturday ? "text-gray-500" : "text-violet-600"}">${jam.day}</span>
                    <span class="text-lg font-bold text-primary">${formattedDate}:</span>
                    <span class="text-lg font-bold text-gray-600">${formatTime(jam.time)}</span>
                </div>
                <span class="text-gray-700 text-lg truncate">${jam.venue}${mapLink}</span>
                ${jam.cancelled ? '<span class="font-bold text-red-600 mt-1 sm:ml-4">(CANCELLED)</span>' : ""}
            </div>
            <div class="admin-controls-inline space-x-2 mt-2 sm:mt-0">${adminButtons}</div>
        `;
        jamList.appendChild(li);
    });
}

export function initializeJams(venues, refreshData) {
    const addJamBtn = document.getElementById("add-jam-btn");
    const addJamForm = document.getElementById("add-jam-form");
    const cancelJamBtn = document.getElementById("cancel-jam-btn");
    const jamList = document.getElementById("jam-list");
    const manageVenuesBtn = document.getElementById("manage-venues-btn");
    const venueManagementSection = document.getElementById("venue-management-section");
    const venueInput = document.getElementById("jam-venue");

    // Populate venue dropdown
    venueInput.innerHTML = venues.map(v => `<option value="${v.name}">${v.name}</option>`).join('');

    venueInput.addEventListener('change', (e) => {
        const selectedVenueName = e.target.value;
        const venue = venues.find(v => v.name.toLowerCase() === selectedVenueName.toLowerCase());
        if (venue) {
            document.getElementById('jam-map-link').value = venue.mapLink || '';
        }
    });

    const jamDateInput = document.getElementById("jam-date");
    jamDatepicker = flatpickr(jamDateInput, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        onChange: (selectedDates) => {
            if (selectedDates.length > 0) {
                document.getElementById("jam-day").value = dayNames[selectedDates[0].getDay()];
            }
        }
    });
    flatpickr("#jam-time", { enableTime: true, noCalendar: true, dateFormat: "h:i K", defaultDate: "2:00 PM" });

    const showJamForm = (mode = "add", jam = null) => {
        addJamForm.style.display = "block";
        const formTitle = document.getElementById("form-title");
        
        if (mode === 'edit') {
            formTitle.textContent = "Edit Jam";
            document.getElementById("edit-jam-id").value = jam.id;
            const dateObj = parseDate(jam.date);
            const formattedDate = dateObj.toISOString().split('T')[0];
            jamDatepicker.setDate(formattedDate, true);
            document.getElementById("jam-time").value = jam.time;
            venueInput.value = jam.venue;
            document.getElementById("jam-map-link").value = jam.mapLink || '';
            addJamForm.scrollIntoView({ behavior: 'smooth' });
        } else {
            formTitle.textContent = "Add New Jam";
            addJamForm.reset();
            document.getElementById("edit-jam-id").value = '';
            if (jam && jam.isProposal) {
                 jamDatepicker.setDate(jam.date, true);
            }
        }
    };

    addJamBtn.addEventListener("click", () => showJamForm("add"));
    cancelJamBtn.addEventListener("click", () => addJamForm.style.display = "none");
    manageVenuesBtn.addEventListener("click", () => {
        venueManagementSection.style.display = "block";
    });

    addJamForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-jam-id").value || String(Date.now());
        const date = document.getElementById("jam-date").value;
        const venue = document.getElementById("jam-venue").value;
        if (!date || !venue) return showModal("Date and Venue are required.", "alert");

        const selectedDay = document.getElementById("jam-day").value;
        const correctDay = dayNames[parseDate(date).getDay()];
        if (selectedDay !== correctDay) {
            return showModal(`The selected day (${selectedDay}) does not match the date (${date}, which is a ${correctDay}). Please re-select the date.`, "alert");
        }

        const jamData = {
            id,
            date,
            day: correctDay,
            time: document.getElementById("jam-time").value.trim(),
            venue,
            mapLink: document.getElementById("jam-map-link").value.trim(),
            cancelled: false,
        };

        await setDoc(doc(db, "jams", id), jamData);
        addJamForm.style.display = "none";
        await refreshData();
    });

    jamList.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const jamId = button.dataset.id;
        
        if (button.classList.contains("edit-jam-btn")) {
            if (jamId.startsWith('proposal-')) {
                const jam = jamsToDisplay.find(j => j.id === jamId);
                showJamForm("edit", jam);
            } else {
                const docRef = doc(db, "jams", jamId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    showJamForm("edit", docSnap.data());
                } else {
                    showModal("Could not find the jam to edit.", "alert");
                }
            }
        } else if (button.classList.contains("delete-jam-btn")) {
            if (jamId.startsWith('proposal-')) {
                jamsToDisplay = jamsToDisplay.filter(j => j.id !== jamId);
                renderJams(siteData.jams, siteData.venues, siteData.config);
            } else {
                showModal("Delete this jam permanently?", "confirm", async () => {
                    try {
                        await deleteDoc(doc(db, "jams", jamId));
                        await refreshData();
                    } catch (error) {
                        console.error('Error deleting jam:', error);
                        showModal(`Failed to delete jam. Error: ${error.message}`, 'alert');
                    }
                });
            }
        } else if (button.classList.contains("cancel-jam-btn")) {
            const jam = jamsToDisplay.find(j => j.id === jamId);
            if (jam && !jam.isProposal) {
                await setDoc(doc(db, "jams", jamId), { cancelled: true }, { merge: true });
                await refreshData();
            }
        } else if (button.classList.contains("reinstate-jam-btn")) {
            const jam = jamsToDisplay.find(j => j.id === jamId);
            if (jam && !jam.isProposal) {
                await setDoc(doc(db, "jams", jamId), { cancelled: false }, { merge: true });
                await refreshData();
            }
        }
    });
    
    console.log("✅ Jams module initialized.");
}
