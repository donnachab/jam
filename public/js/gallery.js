import { db, app } from './firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showModal } from './ui/modal.js';

const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

function getYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    const match = regex.exec(url);
    return match ? match[1] : null;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function renderGallery(photos, config) {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;

    if (!photos || !config) {
        if(grid) grid.innerHTML = '<p class="text-center text-red-500">Could not load gallery data due to a configuration error.</p>';
        return;
    }
        grid.innerHTML = "";
        if (photos.length === 0) {
            grid.innerHTML = `<p class=\"text-center text-gray-500 col-span-full\">No photos in the gallery yet.</p>`;
        } else {
            photos.forEach(photo => {
                const div = document.createElement("div");
                div.className = "group gallery-item overflow-hidden rounded-lg shadow-lg relative";
                div.innerHTML = `
                    <img src="${photo.url}" alt="${photo.caption}" class="w-full h-full object-cover transform transition duration-500 group-hover:scale-110" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';">
                    <button data-id="${photo.id}" class="delete-photo-btn admin-controls-inline hidden group-hover:flex bg-red-500 text-white rounded-full p-1 hover:bg-red-600 absolute top-2 right-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </button>
                `;
                grid.appendChild(div);
            });
        }

    const videoPlayer = document.getElementById("featured-video-player");
    if (videoPlayer && config.featuredVideoUrl) {
        const videoId = getYouTubeID(config.featuredVideoUrl);
        if (videoId) {
            videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
        }
    }
}

export function initializeGallery(refreshData) {
    const addPhotoBtn = document.getElementById("add-photo-btn");
    const addPhotoForm = document.getElementById("add-photo-form");
    const cancelPhotoBtn = document.getElementById("cancel-photo-btn");
    const grid = document.getElementById("gallery-grid");

    const editVideoBtn = document.getElementById("edit-featured-video-btn");
    const editVideoForm = document.getElementById("edit-featured-video-form");
    const cancelVideoBtn = document.getElementById("cancel-featured-video-btn");

    if (addPhotoBtn) addPhotoBtn.addEventListener("click", () => addPhotoForm.style.display = "block");
    if (cancelPhotoBtn) cancelPhotoBtn.addEventListener("click", () => addPhotoForm.style.display = "none");
    
    if (editVideoBtn) editVideoBtn.addEventListener("click", () => editVideoForm.style.display = "block");
    if (cancelVideoBtn) cancelVideoBtn.addEventListener("click", () => editVideoForm.style.display = "none");

    if (addPhotoForm) {
        addPhotoForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById("photo-url");
            const fileInput = document.getElementById("photo-file");
            const captionInput = document.getElementById("photo-caption");

            const caption = captionInput.value.trim();
            const newUrl = urlInput.value.trim();
            const newFile = fileInput.files[0];

            if (!caption) {
                return showModal("Please enter a caption for the photo.", "alert");
            }

            if (newFile) {
                const uploadFile = async () => {
                    try {
                        console.log("DEBUG: Starting photo upload process...");
                        showModal("Preparing upload...", "loading");
                        
                        console.log("DEBUG: Checking auth state...");
                        if (!auth.currentUser) {
                            throw new Error("No user is signed in.");
                        }
                        console.log("DEBUG: User found:", auth.currentUser.uid);

                        console.log("DEBUG: Forcing token refresh...");
                        await auth.currentUser.getIdToken(true);
                        console.log("DEBUG: Token refreshed. Calling generateSignedUploadUrl function...");

                        const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
                        const fileExtension = newFile.name.split('.').pop();
                        const fileName = `gallery-${Date.now()}.${fileExtension}`;

                        const result = await generateSignedUploadUrl({
                            fileName: fileName,
                            contentType: newFile.type
                        });
                        
                        console.log("DEBUG: Cloud function result:", result);

                        if (!result.data.success) {
                            throw new Error(result.data.message || 'Cloud function returned failure.');
                        }

                        const signedUrl = result.data.url;
                        console.log("DEBUG: Got signed URL. Starting upload to storage...");
                        showModal("Uploading image...", "loading");
                        const uploadResponse = await fetch(signedUrl, {
                            method: 'PUT',
                            headers: { 'Content-Type': newFile.type },
                            body: newFile
                        });

                        console.log("DEBUG: Upload response:", uploadResponse);
                        if (!uploadResponse.ok) {
                            throw new Error(`File upload to storage failed with status: ${uploadResponse.status}`);
                        }

                        const bucketName = storage.app.options.storageBucket;
                        const publicUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
                        console.log("DEBUG: Upload successful. Public URL:", publicUrl);
                        
                        const id = String(Date.now());
                        console.log("DEBUG: Saving photo metadata to Firestore...");
                        await setDoc(doc(db, "photos", id), { id, url: publicUrl, caption });
                        
                        addPhotoForm.style.display = "none";
                        addPhotoForm.reset();
                        await refreshData();
                        showModal("Photo added successfully!", "alert");

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

            const id = String(Date.now());
            await setDoc(doc(db, "photos", id), { id, url: newUrl, caption });
            addPhotoForm.style.display = "none";
            addPhotoForm.reset();
            await refreshData();
        });
    }

    if (editVideoForm) {
        editVideoForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const url = document.getElementById("featured-video-url").value.trim();
            if (!url || !getYouTubeID(url)) return showModal("Please enter a valid YouTube URL.", "alert");
            await setDoc(doc(db, "site_config", "main"), { featuredVideoUrl: url }, { merge: true });
            editVideoForm.style.display = "none";
            await refreshData();
        });
    }

    if (grid) {
        grid.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-photo-btn");
            if (!btn) return;
            const photoId = btn.dataset.id;
            showModal("Are you sure you want to delete this photo?", "confirm", async () => {
                await deleteDoc(doc(db, "photos", photoId));
                await refreshData();
            });
        });
    }

    console.log("✅ Gallery module initialized.");
}