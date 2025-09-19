import { db, app } from './firebase-config.js';
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showModal } from './ui/modal.js';
import { initCommunityCarousel } from './ui/carousels.js';

const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

let communitySwiper = null;

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function renderCommunity(items) {
    const wrapper = document.getElementById("community-swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";

    if (items.length === 0) {
        wrapper.innerHTML = `<div class="swiper-slide flex items-center justify-center bg-gray-100 text-gray-500 p-4 rounded-lg">No community events to show.</div>`;
    } else {
        items.forEach(item => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            let headlineHTML = '';
            if (item.type === "charity") {
                headlineHTML = `<h3 class="font-bold text-primary text-xl mb-2">Amount Raised: ${item.amountRaised} for ${item.charityName}</h3>`;
            } else {
                headlineHTML = `<h3 class="font-bold text-primary text-xl mb-2">${item.headline}</h3>`;
            }
            slide.innerHTML = `
                <div class="bg-white overflow-hidden border border-gray-200">
                    <div class="relative community-image-container h-48 bg-gray-200 flex items-center justify-center">
                        <img src="${item.imageUrl}" alt="${item.description.substring(0, 50)}" class="max-h-full max-w-full">
                        <div class="slide-admin-controls admin-controls-inline space-x-2">
                            <button data-id="${item.id}" class="edit-community-btn bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                            <button data-id="${item.id}" class="delete-community-btn bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg></button>
                        </div>
                    </div>
                    <div class="p-6">
                        ${headlineHTML}
                        <p class="text-gray-600">${item.description}</p>
                    </div>
                </div>`;
            wrapper.appendChild(slide);
        });
    }

    if (communitySwiper) communitySwiper.destroy(true, true);
    communitySwiper = initCommunityCarousel(items);
}

export function initializeCommunity(refreshData) {
    const addBtn = document.getElementById("add-community-item-btn");
    const form = document.getElementById("add-community-form");
    const cancelBtn = document.getElementById("cancel-community-btn");
    const typeInput = document.getElementById("community-item-type");
    const wrapper = document.getElementById("community-swiper-wrapper");

    const showForm = (mode = "add", item = null) => {
        form.style.display = "block";
        if (mode === 'edit') {
            document.getElementById("community-form-title").textContent = "Edit Item";
            document.getElementById("edit-community-id").value = item.id;
            document.getElementById("community-image-url").value = item.imageUrl || '';
            typeInput.value = item.type;
            document.getElementById("community-description").value = item.description;
            document.getElementById("community-headline").value = item.headline || "";
            document.getElementById("community-amount").value = item.amountRaised || "";
            document.getElementById("community-charity-name").value = item.charityName || "";
        } else {
            document.getElementById("community-form-title").textContent = "Add New Item";
            form.reset();
            document.getElementById("edit-community-id").value = "";
        }
        typeInput.dispatchEvent(new Event("change"));
    };

    addBtn.addEventListener("click", () => showForm("add"));
    cancelBtn.addEventListener("click", () => form.style.display = "none");
    
    typeInput.addEventListener("change", (e) => {
        const isCharity = e.target.value === "charity";
        const headlineWrapper = document.getElementById("community-headline-wrapper");
        const charityWrapper = document.getElementById("charity-fields-wrapper");
        const headlineInput = document.getElementById("community-headline");
        const amountInput = document.getElementById("community-amount");
        const charityNameInput = document.getElementById("community-charity-name");

        headlineWrapper.classList.toggle("hidden", isCharity);
        charityWrapper.classList.toggle("hidden", !isCharity);

        headlineInput.required = !isCharity;
        amountInput.required = isCharity;
        charityNameInput.required = isCharity;
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById("edit-community-id").value || String(Date.now());
        const type = typeInput.value;
        const imageUrlInput = document.getElementById("community-image-url");
        const imageFileInput = document.getElementById("community-image-file");

        let imageUrl = imageUrlInput.value.trim();
        const newFile = imageFileInput.files[0];

        if (newFile) {
            try {
                showModal("Uploading image...", "loading");
                await auth.currentUser.getIdToken(true);
                const generateSignedUploadUrl = httpsCallable(functions, 'generateSignedUploadUrl');
                const fileExtension = newFile.name.split('.').pop();
                const fileName = `community-${Date.now()}.${fileExtension}`;

                const result = await generateSignedUploadUrl({ fileName, contentType: newFile.type });

                if (!result.data.success) throw new Error(result.data.message || 'Could not get upload URL.');

                const signedUrl = result.data.url;
                const uploadResponse = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': newFile.type }, body: newFile });

                if (!uploadResponse.ok) throw new Error('File upload to storage failed.');

                const bucketName = storage.app.options.storageBucket;
                imageUrl = `https://storage.googleapis.com/${bucketName}/images/${fileName}`;
            } catch (error) {
                console.error("❌ Error during file upload process:", error);
                return showModal(error.message || "An unexpected error occurred.", "alert");
            }
        }

        if (!imageUrl) {
            return showModal("Please upload an image or provide a URL.", "alert");
        }

        const dataToSave = {
            id,
            type,
            imageUrl,
            description: document.getElementById("community-description").value.trim(),
        };

        if (type === "community") {
            dataToSave.headline = document.getElementById("community-headline").value.trim();
        } else if (type === "charity") {
            dataToSave.amountRaised = document.getElementById("community-amount").value.trim();
            dataToSave.charityName = document.getElementById("community-charity-name").value.trim();
        }

        try {
            await setDoc(doc(db, "community", id), dataToSave);
            form.style.display = "none";
            form.reset();
            await refreshData();
            showModal("Community item saved successfully!", "alert");
        } catch (error) {
            console.error("Error saving community item:", error);
            showModal("Failed to save item. Please try again.", "alert");
        }
    });

    wrapper.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const itemId = btn.dataset.id;
        
        if (btn.classList.contains("edit-community-btn")) {
            const docRef = doc(db, "community", itemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                showForm("edit", docSnap.data());
            } else {
                showModal("Could not find the item to edit.", "alert");
            }
        } else if (btn.classList.contains("delete-community-btn")) {
            showModal("Delete this item?", "confirm", async () => {
                await deleteDoc(doc(db, "community", itemId));
                await refreshData();
            });
        }
    });

    console.log("✅ Community module initialized.");
}