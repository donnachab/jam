import { db, app } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { showModal } from '../ui/modal.js';
import { getIsAdminMode } from './admin-mode.js';

const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

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

    if (!getIsAdminMode()) {
      showModal("You must be in admin mode to perform this action.", "alert");
      return;
    }

    // Check if a file has been uploaded
    if (newFile) {
      // This function will be called after getting a PIN, if needed.
      const uploadFile = async (pin) => {
          try {
              // Check for admin mode right before the sensitive operation.
              if (!getIsAdminMode()) {
                showModal("You must be in admin mode to perform this action.", "alert");
                return;
              }

              showModal("Preparing upload...", "loading");
  
              const generateSignedUrlCallable = httpsCallable(functions, 'generateSignedUploadUrl');
              const fileExtension = newFile.name.split('.').pop();
              const fileName = `hero-cover-${Date.now()}.${fileExtension}`;
  
              const result = await generateSignedUrlCallable({
                pin: pin, // The PIN is now required by the function
                fileName: fileName,
                contentType: newFile.type
              });
  
              if (!result.data.success) {
                throw new Error(result.data.message || 'Could not get upload URL. Check PIN.');
              }
  
              const signedUrl = result.data.url;
  
              showModal("Uploading image...", "loading");
              const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': newFile.type },
                body: newFile
              });
  
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error("Upload failed with status:", uploadResponse.status, errorText);
                throw new Error('File upload to storage failed.');
              }
  
              const bucketName = storage.app.options.storageBucket;
              const publicUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
  
              await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: publicUrl }, { merge: true });
              
              showModal("Cover photo updated successfully!", "alert", refreshData);
              editCoverPhotoForm.style.display = "none";
              editCoverPhotoForm.reset();
  
            } catch (error) {
              console.error("Error during file upload process:", error);
              showModal(error.message || "An unexpected error occurred. Please try again.", "alert");
            }
      };

      // The user is already in admin mode, so we need a PIN for the function call.
      // Prompt for the PIN to authorize the secure action.
      showModal("For security, please re-enter your PIN to upload the file.", "prompt", async (pin) => {
        if (pin) uploadFile(pin);
      });
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
