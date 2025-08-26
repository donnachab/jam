import { db } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { showModal } from '../ui/modal.js';

/**
 * Initializes the hero section admin controls.
 * @param {function} refreshData - A callback function to reload all site data.
 */
export function initializeHeroAdmin(refreshData) {
  const editCoverPhotoBtn = document.getElementById("edit-cover-photo-btn");
  const editCoverPhotoForm = document.getElementById("edit-cover-photo-form");
  const cancelCoverPhotoBtn = document.getElementById("cancel-cover-photo-btn");
  const coverPhotoUrlInput = document.getElementById("cover-photo-url");

  if (!editCoverPhotoBtn || !editCoverPhotoForm || !cancelCoverPhotoBtn || !coverPhotoUrlInput) {
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
    if (!newUrl) return;

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
