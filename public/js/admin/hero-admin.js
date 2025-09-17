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
 * Shows a modal for editing the cover photo.
 * @param {function} refreshData - A callback function to reload all site data.
 */
function showCoverPhotoModal(refreshData) {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <form id="edit-cover-photo-form">
      <div class="mb-4">
        <label for="cover-photo-url" class="block text-sm font-medium text-gray-700">Image URL</label>
        <input type="text" id="cover-photo-url" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
      </div>
      <div class="mb-4">
        <label for="cover-photo-file" class="block text-sm font-medium text-gray-700">Or upload a file</label>
        <input type="file" id="cover-photo-file" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100">
      </div>
    </form>
  `;

  const coverPhotoUrlInput = modalContent.querySelector('#cover-photo-url');
  const coverPhotoFileInput = modalContent.querySelector('#cover-photo-file');

  showModal(modalContent.innerHTML, 'confirm', async () => {
    const newUrl = coverPhotoUrlInput.value.trim();
    const newFile = coverPhotoFileInput.files[0];

    if (!getIsAdminMode()) {
      showModal("You must be in admin mode to perform this action.", "alert");
      return;
    }

    if (newFile) {
      const uploadFile = async (pin) => {
        try {
          showModal("Preparing upload...", "loading");

          const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
          const fileExtension = newFile.name.split('.').pop();
          const fileName = `hero-cover-${Date.now()}.${fileExtension}`;

          const result = await generateSignedUploadUrl({
            pin: pin,
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
        } catch (error) {
          console.error("Error during file upload process:", error);
          showModal(error.message || "An unexpected error occurred. Please try again.", "alert");
        }
      };

      showModal("For security, please re-enter your PIN to upload the file.", "prompt", async (pin) => {
        if (pin) uploadFile(pin);
      });
      return;
    }

    if (!newUrl) {
      showModal("Please enter a valid URL or upload a file.", "alert");
      return;
    }

    if (!isValidUrl(newUrl)) {
      showModal("Please enter a valid URL.", "alert");
      return;
    }

    try {
      await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: newUrl }, { merge: true });
      showModal("Cover photo updated successfully!", "alert", refreshData);
    } catch (error) {
      console.error("Error updating cover photo:", error);
      showModal("Failed to update cover photo.", "alert");
    }
  }, () => {
    // onCancel
  });
}


/**
 * Initializes the hero section admin controls.
 * @param {function} refreshData - A callback function to reload all site data.
 */
export function initializeHeroAdmin(refreshData) {
  const editCoverPhotoBtn = document.getElementById("edit-cover-photo-btn");

  if (!editCoverPhotoBtn) {
    console.warn("Hero admin elements not found, skipping initialization.");
    return;
  }

  editCoverPhotoBtn.addEventListener("click", () => {
    showCoverPhotoModal(refreshData);
  });

  console.log("✅ Hero admin controls initialized.");
}