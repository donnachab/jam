import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { showModal } from '../ui/modal.js';
import { createImagePreview } from '../ui/previews.js';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function initializeHeroAdmin(db, auth, functions, refreshData) {
  console.log('🔧 Initializing Hero Admin controls...');
  const editCoverPhotoBtn = document.getElementById("edit-cover-photo-btn");
  const editCoverPhotoForm = document.getElementById("edit-cover-photo-form");
  const cancelCoverPhotoBtn = document.getElementById("cancel-cover-photo-btn");
  const coverPhotoFileInput = document.getElementById('cover-photo-file');
  const coverPhotoPreviewContainer = document.getElementById('cover-photo-preview-container');

  if (!editCoverPhotoBtn) {
    console.warn("Hero admin elements not found, skipping initialization.");
    return;
  }

  editCoverPhotoBtn.addEventListener("click", () => {
    editCoverPhotoForm.style.display = 'block';
  });

  cancelCoverPhotoBtn.addEventListener("click", () => {
    editCoverPhotoForm.style.display = 'none';
  });

  editCoverPhotoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const coverPhotoUrlInput = document.getElementById('cover-photo-url');

    const newUrl = coverPhotoUrlInput.value.trim();
    const newFile = coverPhotoFileInput.files[0];

    if (newFile) {
      const uploadFile = async () => {
        try {
          showModal("Preparing upload...", "loading");
          console.log("Current user for upload:", auth.currentUser);
          if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
            console.log("Successfully refreshed ID Token.");
          } else {
            throw new Error("No user is signed in to refresh token.");
          }
          
          const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
          const fileExtension = newFile.name.split('.').pop();
          const fileName = `hero-cover-${Date.now()}.${fileExtension}`;

          const result = await generateSignedUploadUrl({
            fileName: fileName,
            contentType: newFile.type
          });

          if (!result.data.success) {
            throw new Error(result.data.message || 'Could not get upload URL.');
          }

          const signedUrl = result.data.url;
          showModal("Uploading image...", "loading");
          const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': newFile.type },
            body: newFile
          });

          if (!uploadResponse.ok) {
            throw new Error('File upload to storage failed.');
          }

          const storage = getStorage();
          const bucketName = storage.app.options.storageBucket;
          const publicUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
          
          await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: publicUrl }, { merge: true });
          
          editCoverPhotoForm.style.display = 'none';
          editCoverPhotoForm.reset();
          await refreshData();
          showModal("Cover photo updated successfully!", "alert");

        } catch (error) {
          console.error("❌ Error during file upload process:", error);
          showModal(error.message || "An unexpected error occurred. Please try again.", "alert");
        }
      };
      uploadFile();
      return;
    }

    if (!newUrl) {
      return showModal("Please upload a file or provide a URL.", "alert");
    }
    if (!isValidUrl(newUrl)) {
      return showModal("Please enter a valid URL.", "alert");
    }

    try {
      await setDoc(doc(db, "site_config", "main"), { coverPhotoUrl: newUrl }, { merge: true });
      editCoverPhotoForm.style.display = 'none';
      editCoverPhotoForm.reset();
      await refreshData();
    } catch (error) {
      console.error("❌ Error updating cover photo:", error);
      showModal("Failed to update cover photo.", "alert");
    }
  });

  console.log("✅ Hero admin controls initialized.");

  // --- Initialize Image Previews ---
  createImagePreview(coverPhotoFileInput, coverPhotoPreviewContainer);
}
