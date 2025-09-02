import { db } from '../firebase-config.js';
import { collection, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { showModal } from '../ui/modal.js';
import { getIsAdminMode } from './admin-mode.js';

/**
 * Renders the list of venues in the admin panel.
 * @param {Array} venues - The array of venue objects.
 */
function renderVenueList(venues) {
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

/**
 * Initializes the venue management functionality.
 * @param {Array} initialVenues - The initial array of venues.
 * @param {function} refreshData - A callback function to reload all site data.
 */
export function initializeVenueManagement(initialVenues, refreshData) {
  const manageVenuesBtn = document.getElementById("manage-venues-btn");
  const venueManagementSection = document.getElementById("venue-management-section");
  const addVenueForm = document.getElementById("add-venue-form");
  const venueListAdmin = document.getElementById("venue-list-admin");

  if (!manageVenuesBtn || !venueManagementSection || !addVenueForm || !venueListAdmin) {
    console.warn("Venue management elements not found, skipping initialization.");
    return;
  }

  renderVenueList(initialVenues);

  manageVenuesBtn.addEventListener("click", () => {
    venueManagementSection.style.display = "block";
  });

  addVenueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("new-venue-name");
    const mapLinkInput = document.getElementById("new-venue-map-link");
    const name = nameInput.value.trim();
    const mapLink = mapLinkInput.value.trim();

    if (!getIsAdminMode()) {
      showModal("You must be in admin mode to add a venue.", "alert");
      return;
    }

    if (!name) return;
    const id = String(Date.now());
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

      if (!getIsAdminMode()) {
        showModal("You must be in admin mode to delete a venue.", "alert");
        return;
      }

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
