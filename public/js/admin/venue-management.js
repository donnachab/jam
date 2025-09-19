import { db, app } from '../firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showModal } from '../ui/modal.js';
import { getIsAdminMode } from './admin-mode.js';

const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function renderVenueList(venues) {
  const venueListAdmin = document.getElementById("venue-list-admin");
  if (!venueListAdmin) return;

  venueListAdmin.innerHTML = "";
  venues.forEach(venue => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white p-2 rounded shadow-sm";
    li.innerHTML = `
      <span>${venue.name}</span>
      <div>
        <button data-id="${venue.id}" class="edit-venue-btn text-blue-500 hover:text-blue-700 mr-2">Edit</button>
        <button data-id="${venue.id}" class="delete-venue-btn text-red-500 hover:text-red-700">Delete</button>
      </div>
    `;
    venueListAdmin.appendChild(li);
  });
}

export function initializeVenueManagement(venues, refreshData) {
  const manageVenuesBtn = document.getElementById("manage-venues-btn");
  const venueManagementSection = document.getElementById("venue-management-section");
  const addVenueForm = document.getElementById("add-venue-form");
  const venueListAdmin = document.getElementById("venue-list-admin");
  const cancelVenueEditBtn = document.getElementById("cancel-venue-edit-btn");

  if (!manageVenuesBtn || !venueManagementSection || !addVenueForm || !venueListAdmin) {
    return;
  }

  const showVenueForm = (mode = "add", venue = null) => {
    addVenueForm.style.display = "block";
    const formTitle = document.getElementById("venue-form-title");
    if (mode === 'edit') {
        formTitle.textContent = "Edit Venue";
        document.getElementById("edit-venue-id").value = venue.id;
        document.getElementById("new-venue-name").value = venue.name;
        document.getElementById("new-venue-map-link").value = venue.mapLink || '';
        document.getElementById("venue-photo-url").value = venue.imageUrl || '';
    } else {
        formTitle.textContent = "Add New Venue";
        addVenueForm.reset();
        document.getElementById("edit-venue-id").value = "";
    }
  };

  manageVenuesBtn.addEventListener("click", () => {
    if (getIsAdminMode()) {
        venueManagementSection.style.display = 'block';
        showVenueForm("add");
    }
  });

  cancelVenueEditBtn.addEventListener("click", () => {
    addVenueForm.style.display = "none";
  });

  addVenueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("new-venue-name");
    const mapLinkInput = document.getElementById("new-venue-map-link");
    const photoUrlInput = document.getElementById("venue-photo-url");
    const photoFileInput = document.getElementById("venue-photo-file");
    
    const name = nameInput.value.trim();
    const mapLink = mapLinkInput.value.trim();
    const newUrl = photoUrlInput.value.trim();
    const newFile = photoFileInput.files[0];

    if (!name) return;

    let imageUrl = newUrl;

    if (newFile) {
        try {
            showModal("Uploading image...", "loading");
            console.log("Current user for upload:", auth.currentUser);
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken(true);
                console.log("Successfully refreshed ID Token.");
            } else {
                throw new Error("No user is signed in to refresh token.");
            }
            const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
            const fileExtension = newFile.name.split('.').pop();
            const fileName = `venue-${Date.now()}.${fileExtension}`;

            const result = await generateSignedUploadUrl({ fileName, contentType: newFile.type });

            if (!result.data.success) throw new Error(result.data.message || 'Could not get upload URL.');

            const signedUrl = result.data.url;
            const uploadResponse = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': newFile.type }, body: newFile });

            if (!uploadResponse.ok) throw new Error('File upload to storage failed.');

            const bucketName = storage.app.options.storageBucket;
            imageUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
        } catch (error) {
            console.error("❌ Error during file upload process:", error);
            return showModal(error.message || "An unexpected error occurred.", "alert");
        }
    }

    const id = document.getElementById("edit-venue-id").value || name.toLowerCase().replace(/\s+/g, '-');
    
    try {
      await setDoc(doc(db, "venues", id), { id, name, mapLink, imageUrl: imageUrl || null });
      addVenueForm.style.display = "none";
      addVenueForm.reset();
      await refreshData();
      showModal("Venue saved successfully!", "alert");
    } catch (error) {
      console.error("Error saving venue:", error);
      showModal("Failed to save venue.", "alert");
    }
  });

  venueListAdmin.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const venueId = button.dataset.id;
    const venue = venues.find(v => v.id === venueId);

    if (button.classList.contains("edit-venue-btn")) {
        showVenueForm("edit", venue);
    } else if (button.classList.contains("delete-venue-btn")) {
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