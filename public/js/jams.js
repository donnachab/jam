import { db } from './firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from './ui/modal.js';

// --- Helper Functions ---
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseDate(dateString) {
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        // new Date(year, monthIndex, day)
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

// --- Core Logic ---
let jamsToDisplay = [];
let jamDatepicker = null;

function manageJamSchedule(confirmedJams, testDate = null) {
    console.log('Processing Confirmed Jams:', JSON.stringify(confirmedJams, null, 2));
    const today = testDate ? new Date(testDate) : new Date();
    today.setHours(0, 0, 0, 0);

    let upcomingConfirmed = confirmedJams
        .map(jam => ({...jam, dateObj: parseDate(jam.date)}))
        .filter(jam => jam.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    console.log('Upcoming Confirmed Jams:', upcomingConfirmed);

    jamsToDisplay = [...upcomingConfirmed];

    let lastDate = jamsToDisplay.length > 0 ? new Date(jamsToDisplay[jamsToDisplay.length - 1].dateObj) : new Date(today);

    while (jamsToDisplay.length < 5) {
        lastDate.setDate(lastDate.getDate() + 1);
        if (lastDate.getDay() === 6) { // It's a Saturday
            const dateString = lastDate.toISOString().split('T')[0];
            jamsToDisplay.push({
                id: `proposal-${dateString}`,
                date: dateString,
                day: "Saturday",
                venue: "To be decided...",
                time: "2:00 PM",
                isProposal: true,
            });
        }
    }
    jamsToDisplay = jamsToDisplay.slice(0, 5);
    console.log('Jams to Display:', jamsToDisplay);
}

// --- Render Function ---
function renderJams() {
    const jamList = document.getElementById("jam-list");
    if (!jamList) return;
    jamList.innerHTML = "";

    jamsToDisplay.forEach(jam => {
        console.log(`Rendering Jam:`, jam);
        const li = document.createElement("li");
        const isSaturday = jam.day === "Saturday";
        const dateObj = parseDate(jam.date);
        const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;

        li.className = `p-4 rounded-lg shadow-sm border-l-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-white ${jam.cancelled ? 'jam-cancelled' : ''} ${!isSaturday && !jam.isProposal ? 'jam-special' : 'border-gray-200'}`;


        let adminButtons = '';
        if (!jam.isProposal) {
            adminButtons = `
                <button data-id="${jam.id}" class="edit-jam-btn text-blue-500 hover:text-blue-700">Edit</button>
                ${jam.cancelled
                    ? `<button data-id="${jam.id}" class="reinstate-jam-btn text-green-600 hover:text-green-800 ml-2">Reinstate</button>`
                    : `<button data-id="${jam.id}" class="cancel-jam-btn text-yellow-600 hover:text-yellow-800 ml-2">Cancel</button>`
                }
                <button data-id="${jam.id}" class="delete-jam-btn text-red-500 hover:text-red-700 ml-2">Delete</button>
            `;
        } else {
             adminButtons = `<button data-id="${jam.date}" class="edit-jam-btn text-blue-500 hover:text-blue-700">Confirm</button>`;
        }

        const mapLink = jam.mapLink ? ` <a href="${jam.mapLink}" target="_blank" class="text-blue-500 hover:underline whitespace-nowrap">(Map)</a>` : "";
        
        li.innerHTML = `
            <div class="flex-grow jam-info">
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
                    <span class="font-bold text-lg ${isSaturday ? "text-gray-500" : "text-violet-600"}">${jam.day}</span>
                    <span class="text-lg font-bold text-primary">${formattedDate}:</span>
                    <span class="text-lg font-bold text-gray-600">${formatTime(jam.time)}</span>
                </div>
                <span class="text-gray-700 text-lg">${jam.venue}${mapLink}</span>
                ${jam.cancelled ? '<span class="font-bold text-red-600 mt-1 sm:ml-4">(CANCELLED)</span>' : ""}
            </div>
            <div class="admin-controls-inline space-x-2 mt-2 sm:mt-0">${adminButtons}</div>
        `;
        jamList.appendChild(li);
    });
}

// --- Initialization ---
export function initializeJams(initialJams, initialVenues, refreshData) {
    const addJamBtn = document.getElementById("add-jam-btn");
    const addJamForm = document.getElementById("add-jam-form");
    const cancelJamBtn = document.getElementById("cancel-jam-btn");
    const jamList = document.getElementById("jam-list");
    const manageVenuesBtn = document.getElementById("manage-venues-btn");
    const venueManagementSection = document.getElementById("venue-management-section");
    
    manageJamSchedule(initialJams);
    renderJams();

    // Initialize date pickers
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
    flatpickr("#test-date-input", { dateFormat: "Y-m-d" });

    // Form logic
    const showJamForm = (mode = "add", jam = null) => {
        addJamForm.style.display = "block";
        const formTitle = document.getElementById("form-title");
        const venueInput = document.getElementById("jam-venue");
        
        venueInput.innerHTML = initialVenues.map(v => `<option value="${v.name}">${v.name}</option>`).join('');

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
            if (jam && jam.isProposal) { // Pre-fill for confirming a proposal
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

        const jamData = {
            id,
            date,
            day: dayNames[parseDate(date).getDay()],
            time: document.getElementById("jam-time").value.trim(),
            venue,
            mapLink: document.getElementById("jam-map-link").value.trim(),
            cancelled: false,
        };

        await setDoc(doc(db, "jams", id), jamData);
        addJamForm.style.display = "none";
        await refreshData();
    });

    // Event delegation for jam list buttons
    jamList.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        console.log('Button clicked:', button);
        if (!button) return;

        const jamId = button.dataset.id;
        const jam = jamsToDisplay.find(j => j.id === jamId || j.date === jamId);
        console.log('Jam:', jam);

        if (button.classList.contains("edit-jam-btn")) {
            console.log('Edit button clicked');
            showJamForm("edit", jam);
        } else if (button.classList.contains("delete-jam-btn")) {
            console.log('Delete button clicked for jamId:', jamId);
            console.log('Jam object:', jam);
            showModal("Delete this jam permanently?", "confirm", async () => {
                console.log('Deleting jam with id:', jamId);
                await deleteDoc(doc(db, "jams", jamId));
                console.log('Jam deleted from Firestore.');
                await refreshData();
            });
        } else if (button.classList.contains("cancel-jam-btn")) {
            console.log('Cancel button clicked');
            await setDoc(doc(db, "jams", jamId), { cancelled: true }, { merge: true });
            await refreshData();
        } else if (button.classList.contains("reinstate-jam-btn")) {
            console.log('Reinstate button clicked');
            await setDoc(doc(db, "jams", jamId), { cancelled: false }, { merge: true });
            await refreshData();
        }
    });

    // Date testing logic
    document.getElementById("test-date-btn").addEventListener("click", () => {
        const testDate = document.getElementById("test-date-input").value;
        if (testDate) {
            manageJamSchedule(initialJams, testDate);
            renderJams();
        }
    });
    document.getElementById("reset-date-btn").addEventListener("click", () => {
        document.getElementById("test-date-input").value = "";
        manageJamSchedule(initialJams);
        renderJams();
    });
    
    console.log("✅ Jams module initialized.");
}