/**
 * @module previews
 * @description Creates a preview of an image selected by a user in a file input.
 */

/**
 * Attaches an event listener to a file input element to generate and display
 * an image preview when a file is selected.
 *
 * @param {HTMLInputElement} fileInput - The file input element to listen to.
 * @param {HTMLElement} previewContainer - The container where the image preview will be appended.
 */
export function createImagePreview(fileInput, previewContainer) {
  if (!fileInput || !previewContainer) {
    console.warn("Missing file input or preview container for image preview.");
    return;
  }

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        // Clear any existing preview
        previewContainer.innerHTML = '';

        // Create the new image preview element
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Image preview';
        img.className = 'mt-2 h-32 w-auto object-cover rounded';

        // Append the new preview to the container
        previewContainer.appendChild(img);
      };

      // Read the file as a data URL, which can be used as an image source
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user cancels), clear the preview
      previewContainer.innerHTML = '';
    }
  });
}
