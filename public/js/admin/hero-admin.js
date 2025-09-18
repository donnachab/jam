import { db, app } from '../firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showModal } from '../ui/modal.js';
import { getIsAdminMode } from './admin-mode.js';

const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

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
  console.log('Opening cover photo modal...');
  const form = document.getElementById('edit-cover-photo-form');
  if (!form) {
    console.error("Could not find the cover photo form.");
    return;
  }

  // Clone the form to avoid issues with repeated modal openings
  const formClone = form.cloneNode(true);
  formClone.style.display = 'block';

  showModal(formClone.outerHTML, 'confirm', async () => {
    const modal = document.getElementById('custom-modal');
    const coverPhotoUrlInput = modal.querySelector('#cover-photo-url');
    const coverPhotoFileInput = modal.querySelector('#cover-photo-file');

    console.log('Confirm button clicked in cover photo modal.');
    console.log('File input files:', coverPhotoFileInput.files);
    const newUrl = coverPhotoUrlInput.value.trim();
    const newFile = coverPhotoFileInput.files[0];
    console.log(`New URL: ${newUrl}, New File: ${newFile ? newFile.name : 'none'}`);



    if (newFile) {
      console.log('New file selected, starting upload process...');
      const uploadFile = async () => {
        console.log('uploadFile function called.');
        try {
          showModal("Preparing upload...", "loading");
          await auth.currentUser.getIdToken(true);
          console.log('Calling generateSignedUploadUrl cloud function...');
          const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
          const fileExtension = newFile.name.split('.').pop();
          const fileName = `hero-cover-${Date.now()}.${fileExtension}`;

          const result = await generateSignedUploadUrl({
            fileName: fileName,
            contentType: newFile.type
          });
          console.log('generateSignedUploadUrl result:', result.data);

          if (!result.data.success) {
            throw new Error(result.data.message || 'Could not get upload URL.');
          }

          const signedUrl = result.data.url;
          console.log(`Got signed URL: ${signedUrl}`);

          showModal("Uploading image...", "loading");
          console.log('Uploading file to signed URL...');
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
          console.log('✅ File uploaded successfully.');

          const bucketName = storage.app.options.storageBucket;
          const publicUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
          console.log(`New public URL: ${publicUrl}`);

          console.log('Updating site_config with new cover photo URL...');
          await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: publicUrl }, { merge: true });
          console.log('✅ site_config updated.');

          showModal("Cover photo updated successfully!", "alert", refreshData);
        } catch (error) {
          console.error("❌ Error during file upload process:", error);
          showModal(error.message || "An unexpected error occurred. Please try again.", "alert");
        }
      };

      uploadFile();
      return;
    }

    if (!newUrl) {
      console.warn('No new URL or file provided.');
      showModal("Please upload a file or use a valid URL.", "alert");
      return;
    }

    if (!isValidUrl(newUrl)) {
      console.warn(`Invalid URL provided: ${newUrl}`);
      showModal("Please enter a valid URL.", "alert");
      return;
    }

    try {
      console.log(`Updating site_config with new cover photo URL: ${newUrl}`);
      await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: newUrl }, { merge: true });
      console.log('✅ site_config updated.');
      showModal("Cover photo updated successfully!", "alert", refreshData);
    } catch (error) {
      console.error("❌ Error updating cover photo:", error);
      showModal("Failed to update cover photo.", "alert");
    }
  }, () => {
    console.log('Cancel button clicked in cover photo modal.');
    // onCancel
  });
}


/**
 * Initializes the hero section admin controls.
 * @param {function} refreshData - A callback function to reload all site data.
 */
export function initializeHeroAdmin(refreshData) {
  console.log('🔧 Initializing Hero Admin controls...');
  const editCoverPhotoBtn = document.getElementById("edit-cover-photo-btn");

  if (!editCoverPhotoBtn) {
    console.warn("Hero admin elements not found, skipping initialization.");
    return;
  }

  editCoverPhotoBtn.addEventListener("click", () => {
    console.log('Edit cover photo button clicked.');
    showCoverPhotoModal(refreshData);
  });

  console.log("✅ Hero admin controls initialized.");
}
