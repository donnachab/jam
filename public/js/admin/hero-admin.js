import { db } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

/**
 * Checks if a string is a valid URL.
 * @param {string} url - The URL to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Initializes the hero section admin controls.
 * @param {function} refreshData - A callback function to reload all site data.
 */
export function initializeHeroAdmin(refreshData) {
  const editCoverPhotoBtn = document.getElementById("edit-cover-photo-btn");
  const editCoverPhotoForm = document.getElementById("edit-cover-photo-form");
  const cancelCoverPhotoBtn = document.getElementById("cancel-cover-photo-btn");
  const coverPhotoUrlInput = document.getElementById("cover-photo-url");
  const coverPhotoFileInput = document.getElementById("cover-photo-file");

  if (!editCoverPhotoBtn || !editCoverPhotoForm || !cancelCoverPhotoBtn || !coverPhotoUrlInput || !coverPhotoFileInput) {
    console.warn("Hero admin elements not found, skipping initialization.");
    return;
  }

  editCoverPhotoBtn.addEventListener("click", () => {
    editCoverPhotoForm.style.display = "block";
  });

  cancelCoverPhotoBtn.addEventListener("click", () => {
    editCoverPhotoForm.style.display = "none";
  });

  editCoverPhotoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newUrl = coverPhotoUrlInput.value.trim();
    const newFile = coverPhotoFileInput.files[0];

    if (newFile) {
        // Handle file upload to Firebase Storage here
        // For now, we'll just log it.
        showModal("File upload functionality is not yet implemented.", "alert");
        return;
    }

    if (!newUrl) {
      showModal("Please enter a valid URL or upload a file.", "alert");
      return;
    }
    
    // Add validation check here
    if (!isValidUrl(newUrl)) {
      showModal("Please enter a valid URL.", "alert");
      return;
    }

    try {
      await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: newUrl }, { merge: true });
      showModal("Cover photo updated successfully!", "alert", refreshData);
      editCoverPhotoForm.style.display = "none";
    } catch (error) {
      console.error("Error updating cover photo:", error);
      showModal("Failed to update cover photo.", "alert");
    }
  });

  console.log("✅ Hero admin controls initialized.");
}
