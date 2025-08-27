import { db } from './firebase-config.js';
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { showModal } from './ui/modal.js';
import { initCommunityCarousel } from './ui/carousels.js';

let communitySwiper = null;

function renderCommunitySlider(items) {
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
                    <div class="relative community-image-container">
                        <img src="${item.imageUrl}" alt="${item.description.substring(0, 50)}">
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

export function initializeCommunity(initialItems, refreshData) {
    renderCommunitySlider(initialItems);

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
            document.getElementById("community-image-url").value = item.imageUrl;
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
        document.getElementById("charity-fields-wrapper").classList.toggle("hidden", !isCharity);
        document.getElementById("community-headline-wrapper").classList.toggle("hidden", isCharity);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-community-id").value || String(Date.now());
        const itemData = {
            id,
            imageUrl: document.getElementById("community-image-url").value.trim(),
            description: document.getElementById("community-description").value.trim(),
            type: typeInput.value,
            headline: document.getElementById("community-headline").value.trim(),
            amountRaised: document.getElementById("community-amount").value.trim(),
            charityName: document.getElementById("community-charity-name").value.trim(),
        };
        // Add validation logic here
        if (!itemData.imageUrl || !itemData.description) {
            return showModal("Image URL and Description are required.", "alert");
        }
        if (itemData.type === "community" && !itemData.headline) {
            return showModal("Headline is required for community events.", "alert");
        }
        if (itemData.type === "charity" && (!itemData.amountRaised || !itemData.charityName)) {
            return showModal("Amount Raised and Charity Name are required for charity fundraisers.", "alert");
        }
        await setDoc(doc(db, "community", id), itemData);
        form.style.display = "none";
        await refreshData();
    });

    wrapper.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const itemId = btn.dataset.id;
        const item = initialItems.find(i => i.id === itemId);

        if (btn.classList.contains("edit-community-btn")) {
            showForm("edit", item);
        } else if (btn.classList.contains("delete-community-btn")) {
            showModal("Delete this item?", "confirm", async () => {
                await deleteDoc(doc(db, "community", itemId));
                await refreshData();
            });
        }
    });

    console.log("✅ Community module initialized.");
}
