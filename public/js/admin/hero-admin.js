import { db } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { showModal } from '../ui/modal.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Get a reference to Firebase Storage and Auth
const storage = getStorage();
const auth = getAuth();

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

    // Check for authentication before attempting upload
    const user = auth.currentUser;
    if (!user) {
        showModal("You must be logged in as an admin to upload files.", "alert");
        return;
    }

    // Check if a file has been uploaded
    if (newFile) {
      // Handle file upload to Firebase Storage
      try {
        showModal("Uploading image...", "loading");
        const fileExtension = newFile.name.split('.').pop();
        const fileName = `hero-cover-${Date.now()}.${fileExtension}`;
        const fileRef = ref(storage, `images/${fileName}`);
        
        // Upload the file to Firebase Storage
        await uploadBytes(fileRef, newFile);

        // Get the public download URL
        const downloadURL = await getDownloadURL(fileRef);

        // Update the cover photo URL in Firestore
        await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: downloadURL }, { merge: true });
        
        showModal("Cover photo updated successfully!", "alert", refreshData);
        editCoverPhotoForm.style.display = "none";
      } catch (error) {
        console.error("Error uploading cover photo:", error);
        showModal("Failed to upload cover photo. Please try again.", "alert");
      }
      return;
    }

    // Fallback to URL input if no file is provided
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
