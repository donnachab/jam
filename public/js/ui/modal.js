/**
 * Displays a modal with a message and custom buttons.
 * @param {string} message - The text to display in the modal.
 * @param {'alert' | 'confirm' | 'prompt'} type - The type of modal to show.
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
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (type === "prompt") modalInput.focus();
}
