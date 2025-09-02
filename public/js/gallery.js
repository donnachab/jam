import { db } from './firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { showModal } from './ui/modal.js';

/**
 * Extracts a YouTube video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The video ID or null if not found.
 */
function getYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    const match = regex.exec(url);
    return match ? match[1] : null;
}

/**
 * Renders the photo gallery grid.
 * @param {Array} photos - An array of photo objects from Firestore.
 */
function renderGallery(photos) {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (photos.length === 0) {
        grid.innerHTML = `<p class="text-center text-gray-500 col-span-full">No photos in the gallery yet.</p>`;
        return;
    }
    photos.forEach(photo => {
        const div = document.createElement("div");
        div.className = "gallery-item overflow-hidden rounded-lg shadow-lg";
        div.innerHTML = `
            <img src="${photo.url}" alt="${photo.caption}" class="w-full h-full object-cover transform hover:scale-110 transition duration-500" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';">
            <button data-id="${photo.id}" class="delete-photo-btn admin-controls-inline bg-red-500 text-white rounded-full p-1 hover:bg-red-600 absolute top-2 right-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
        `;
        grid.appendChild(div);
    });
}

/**
 * Initializes all functionality for the gallery section.
 * @param {Array} initialPhotos - The initial array of photo objects.
 * @param {object} config - The site configuration object from Firestore.
 * @param {function} refreshData - A callback to reload all site data.
 */
export function initializeGallery(initialPhotos, config, refreshData) {
    renderGallery(initialPhotos);

    const videoPlayer = document.getElementById("featured-video-player");
    if (videoPlayer && config.featuredVideoUrl) {
        const videoId = getYouTubeID(config.featuredVideoUrl);
        if (videoId) {
            videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
        }
    }

    const addPhotoBtn = document.getElementById("add-photo-btn");
    const addPhotoForm = document.getElementById("add-photo-form");
    const cancelPhotoBtn = document.getElementById("cancel-photo-btn");
    const grid = document.getElementById("gallery-grid");

    const editVideoBtn = document.getElementById("edit-featured-video-btn");
    const editVideoForm = document.getElementById("edit-featured-video-form");
    const cancelVideoBtn = document.getElementById("cancel-featured-video-btn");

    addPhotoBtn.addEventListener("click", () => addPhotoForm.style.display = "block");
    cancelPhotoBtn.addEventListener("click", () => addPhotoForm.style.display = "none");
    
    editVideoBtn.addEventListener("click", () => editVideoForm.style.display = "block");
    cancelVideoBtn.addEventListener("click", () => editVideoForm.style.display = "none");

    addPhotoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const url = document.getElementById("photo-url").value.trim();
        const caption = document.getElementById("photo-caption").value.trim();
        if (!url || !caption) return;
        const id = String(Date.now());
        await setDoc(doc(db, "photos", id), { id, url, caption });
        addPhotoForm.style.display = "none";
        await refreshData();
    });

    editVideoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const url = document.getElementById("featured-video-url").value.trim();
        if (!url || !getYouTubeID(url)) return showModal("Please enter a valid YouTube URL.", "alert");
        await setDoc(doc(db, "site_config", "main"), { featuredVideoUrl: url }, { merge: true });
        editVideoForm.style.display = "none";
        await refreshData();
    });

    grid.addEventListener("click", async (e) => {
        const btn = e.target.closest(".delete-photo-btn");
        if (!btn) return;
        const photoId = btn.dataset.id;
        showModal("Are you sure you want to delete this photo?", "confirm", async () => {
            await deleteDoc(doc(db, "photos", photoId));
            await refreshData();
        });
    });

    console.log("✅ Gallery module initialized.");
}
