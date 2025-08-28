import { db } from './firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { showModal } from './ui/modal.js';
import { initFestivalCarousel } from './ui/carousels.js';

const festivalLogos = [
  { src: "../images/cleggan-fringe-festival.jpg", alt: "Cleggan Fringe Festival Logo" },
  { src: "../images/doolin-folkfest-2025.png", alt: "Doolin FolkFest Logo" },
  { src: "../images/galway-folk-festival.png", alt: "Galway Folk Festival Logo" },
  { src: "../images/westport-folk-and-bluegrass-festival.jpg", alt: "Westport Folk and Bluegrass Festival Logo" },
  { src: "../images/cahersiveen-mountain-roots.jpg", alt: "Cahersiveen Mountain Roots Music Weekend Logo" },
  // Add new festival logos here
];

/**
 * Renders the festival logo carousel.
 */
function renderFestivalLogos() {
  const wrapper = document.getElementById("festival-carousel-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = '';
  
  // Duplicating the slides to meet the loop requirement.
  const allLogos = festivalLogos.concat(festivalLogos);

  allLogos.forEach(logo => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `<img src="${logo.src}" alt="${logo.alt}"/>`;
    wrapper.appendChild(slide);
  });
  
  initFestivalCarousel(allLogos.length);
}

function renderEvents(events) {
    const eventList = document.getElementById("event-list");
    if (!eventList) return;
    eventList.innerHTML = "";
    
    const today = new Date().toISOString().split('T')[0];

    const upcomingEvents = events
        .filter(event => event.endDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (upcomingEvents.length === 0) {
        eventList.innerHTML = `<p class="text-center text-gray-500">No special events scheduled at this time.</p>`;
        return;
    }

    upcomingEvents.forEach(event => {
        const div = document.createElement("div");
        div.className = "bg-white p-6 rounded-lg shadow-md relative border border-gray-200";
        
        const startDate = new Date(event.startDate + 'T00:00:00');
        const endDate = new Date(event.endDate + 'T00:00:00');
        const formatOpts = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
        let dateDisplay = startDate.toLocaleDateString('en-US', formatOpts);
        if (event.startDate !== event.endDate) {
            dateDisplay += ` - ${endDate.toLocaleDateString('en-US', formatOpts)}`;
        }

        div.innerHTML = `
            <div class="admin-controls-inline absolute top-2 right-2 space-x-2">
                <button data-id="${event.id}" class="edit-event-btn text-blue-500 hover:text-blue-700">Edit</button>
                <button data-id="${event.id}" class="delete-event-btn text-red-500 hover:text-red-700">Delete</button>
            </div>
            <h3 class="text-2xl font-bold text-primary">${event.title}</h3>
            <div class="flex items-center space-x-4 mt-1">
                <p class="text-lg font-semibold text-gray-700">${dateDisplay}</p>
                ${event.time ? `<span class="text-gray-600 font-semibold">${event.time}</span>` : ''}
                ${event.mapLink ? `<a href="${event.mapLink}" target="_blank" class="text-blue-500 hover:underline whitespace-nowrap">(Map)</a>` : ''}
            </div>
            <p class="mt-4 text-gray-600">${event.description}</p>
        `;
        eventList.appendChild(div);
    });
}

export function initializeEvents(initialEvents, refreshData) {
    const addEventBtn = document.getElementById("add-event-btn");
    const addEventForm = document.getElementById("add-event-form");
    const cancelEventBtn = document.getElementById("cancel-event-btn");
    const eventList = document.getElementById("event-list");
    
    renderFestivalLogos();
    renderEvents(initialEvents);

    flatpickr("#event-start-date", { dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y" });
    flatpickr("#event-end-date", { dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y" });

    const showEventForm = (mode = "add", event = null) => {
        addEventForm.style.display = "block";
        if (mode === 'edit') {
            document.getElementById("event-form-title").textContent = "Edit Event";
            document.getElementById("edit-event-id").value = event.id;
            document.getElementById("event-title").value = event.title;
            flatpickr("#event-start-date").setDate(event.startDate);
            flatpickr("#event-end-date").setDate(event.endDate);
            document.getElementById("event-time").value = event.time || '';
            document.getElementById("event-map-link").value = event.mapLink || '';
            document.getElementById("event-description").value = event.description;
        } else {
            document.getElementById("event-form-title").textContent = "Add New Event";
            addEventForm.reset();
            document.getElementById("edit-event-id").value = "";
        }
    };

    addEventBtn.addEventListener("click", () => showEventForm("add"));
    cancelEventBtn.addEventListener("click", () => addEventForm.style.display = "none");

    addEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-event-id").value || String(Date.now());
        const eventData = {
            id,
            title: document.getElementById("event-title").value.trim(),
            startDate: document.getElementById("event-start-date").value,
            endDate: document.getElementById("event-end-date").value,
            time: document.getElementById("event-time").value.trim(),
            mapLink: document.getElementById("event-map-link").value.trim(),
            description: document.getElementById("event-description").value.trim(),
        };

        if (!eventData.title || !eventData.startDate || !eventData.endDate || !eventData.description) {
            return showModal("Title, Start/End Dates, and Description are required.", "alert");
        }

        await setDoc(doc(db, "events", id), eventData);
        addEventForm.style.display = "none";
        await refreshData();
    });

    eventList.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;
        const eventId = button.dataset.id;
        const event = initialEvents.find(ev => ev.id === eventId);

        if (button.classList.contains("edit-event-btn")) {
            showEventForm("edit", event);
        } else if (button.classList.contains("delete-event-btn")) {
            showModal("Delete this event?", "confirm", async () => {
                await deleteDoc(doc(db, "events", eventId));
                await refreshData();
            });
        }
    });

    console.log("✅ Events module initialized.");
}
