/**
 * Displays a modal with a message and custom buttons.
 * @param {string} message - The text to display in the modal.
 * @param {'alert' | 'confirm' | 'prompt' | 'loading'} type - The type of modal to show.
 * @param {function} [onConfirm=()=>{}] - Callback function when the confirm/submit/ok button is clicked.
 * @param {function} [onCancel=()=>{}] - Callback function when the cancel button is clicked.
 */
export function showModal(message, type = "alert", onConfirm = () => {}, onCancel = () => {}) {
  const modal = document.getElementById("custom-modal");
  const modalMessage = document.getElementById("modal-message");
  const modalInput = document.getElementById("modal-input");
  const modalButtons = document.getElementById("modal-buttons");

  if (!modal || !modalMessage || !modalInput || !modalButtons) {
    console.error("Modal elements not found in the DOM.");
    return;
  }

  modalMessage.textContent = message;
  modalButtons.innerHTML = "";
  modalInput.classList.add("hidden");

  const hideModal = () => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };

  if (type === "alert") {
    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.className = "px-4 py-2 bg-accent text-primary font-bold rounded-md";
    okButton.onclick = () => {
      hideModal();
      onConfirm();
    };
    modalButtons.appendChild(okButton);
  } else if (type === "confirm") {
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.className = "px-4 py-2 bg-red-500 text-white rounded-md";
    confirmButton.onclick = () => {
      hideModal();
      onConfirm();
    };

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "px-4 py-2 bg-stone-600 text-white rounded-md";
    cancelButton.onclick = () => {
      hideModal();
      onCancel();
    };

    modalButtons.appendChild(cancelButton);
    modalButtons.appendChild(confirmButton);
  } else if (type === "prompt") {
    modalInput.classList.remove("hidden");
    modalInput.value = "";
    modalInput.type = "password";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.className = "px-4 py-2 bg-accent text-primary font-bold rounded-md";
    submitButton.onclick = () => {
      hideModal();
      onConfirm(modalInput.value);
    };

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "px-4 py-2 bg-stone-600 text-white rounded-md";
    cancelButton.onclick = () => {
      hideModal();
      onCancel();
    };

    modalButtons.appendChild(cancelButton);
    modalButtons.appendChild(submitButton);
  } else if (type === "loading") {
    modalMessage.textContent = message;
    modalInput.classList.add("hidden");
    modalButtons.innerHTML = `<svg class="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>`;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (type === "prompt") modalInput.focus();
}

export function hideModal() {
  const modal = document.getElementById("custom-modal");
  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}
