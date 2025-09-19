import { db } from '../firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from '../ui/modal.js';
import { getIsAdminMode } from './admin-mode.js';

export function renderVenueList(venues) {
  const venueListAdmin = document.getElementById("venue-list-admin");
  if (!venueListAdmin) return;

  venueListAdmin.innerHTML = "";
  venues.forEach(venue => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white p-2 rounded shadow-sm";
    li.innerHTML = `
      <span>${venue.name}</span>
      <button data-id="${venue.id}" class="delete-venue-btn text-red-500 hover:text-red-700">Delete</button>
    `;
    venueListAdmin.appendChild(li);
  });
}

export function initializeVenueManagement(refreshData) {
  const manageVenuesBtn = document.getElementById("manage-venues-btn");
  const venueManagementSection = document.getElementById("venue-management-section");
  const addVenueForm = document.getElementById("add-venue-form");
  const venueListAdmin = document.getElementById("venue-list-admin");

  if (!manageVenuesBtn || !venueManagementSection || !addVenueForm || !venueListAdmin) {
    console.warn("Venue management elements not found, skipping initialization.");
    return;
  }

  manageVenuesBtn.addEventListener("click", () => {
    if (getIsAdminMode()) {
        venueManagementSection.style.display = 'block';
    }
  });

  addVenueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("new-venue-name");
    const mapLinkInput = document.getElementById("new-venue-map-link");
    const name = nameInput.value.trim();
    const mapLink = mapLinkInput.value.trim();

    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, "venues", id), { id, name, mapLink });
      addVenueForm.reset();
      await refreshData();
    } catch (error) {
      console.error("Error adding venue:", error);
      showModal("Failed to add venue.", "alert");
    }
  });

  venueListAdmin.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-venue-btn")) {
      const venueId = e.target.dataset.id;
      showModal("Are you sure you want to delete this venue?", "confirm", async () => {
        try {
          await deleteDoc(doc(db, "venues", venueId));
          await refreshData();
        } catch (error) {
          console.error("Error deleting venue:", error);
          showModal("Failed to delete venue.", "alert");
        }
      });
    }
  });
  console.log("✅ Venue management initialized.");
}
