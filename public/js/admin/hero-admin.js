import { db } from '../firebase-config.js';
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { showModal } from '../ui/modal.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Get a reference to Firebase Storage and Auth
const storage = getStorage();
const auth = getAuth();

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
    showModal("Updating...", "loading");

    const user = auth.currentUser;
    if (!user) {
        showModal("Authentication error. Please log out and log in again.", "alert");
        return;
    }

    const newFile = coverPhotoFileInput.files[0];
    let finalUrl = coverPhotoUrlInput.value.trim();

    if (newFile) {
        // Validate file before uploading
        if (newFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            showModal(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, "alert");
            return;
        }
        if (!ALLOWED_TYPES.includes(newFile.type)) {
            showModal("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF.", "alert");
            return;
        }

        try {
            showModal("Uploading image...", "loading");
            const fileExtension = newFile.name.split('.').pop();
            const fileName = `hero-cover-${Date.now()}.${fileExtension}`;
            const fileRef = ref(storage, `images/${fileName}`);
            
            await uploadBytes(fileRef, newFile);
            finalUrl = await getDownloadURL(fileRef);
        } catch (error) {
            console.error("Error uploading cover photo:", error);
            showModal("Failed to upload cover photo. Please try again.", "alert");
            return;
        }
    }

    // After potentially getting a URL from the upload, validate it.
    if (!finalUrl || !isValidUrl(finalUrl)) {
      showModal("Please provide a valid URL or upload a file.", "alert");
      return;
    }

    try {
      // Use updateDoc for clarity, as we are only changing one field.
      await updateDoc(doc(db, "site_config", "main"), { coverPhotoUrl: finalUrl });
      showModal("Cover photo updated successfully!", "alert", refreshData);
      editCoverPhotoForm.style.display = "none";
      editCoverPhotoForm.reset();
    } catch (error) {
      console.error("Error updating cover photo:", error);
      showModal("Failed to update cover photo.", "alert");
    }
  });

  console.log("✅ Hero admin controls initialized.");
}
