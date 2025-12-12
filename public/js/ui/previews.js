/**
 * Image Preview Utilities
 * Handles image preview functionality for admin uploads
 */

/**
 * Create image preview from file
 * @param {File} file - Image file to preview
 * @param {HTMLElement} container - Container element for preview
 */
export function createImagePreview(file, container) {
    if (!file || !container) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Preview';
        img.className = 'max-w-full h-auto rounded-lg shadow-md';
        
        // Clear previous preview
        container.innerHTML = '';
        container.appendChild(img);
    };
    
    reader.onerror = () => {
        console.error('Error reading file');
        container.innerHTML = '<p class="text-red-600">Error loading preview</p>';
    };
    
    reader.readAsDataURL(file);
}

/**
 * Clear image preview
 * @param {HTMLElement} container - Container element to clear
 */
export function clearImagePreview(container) {
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes (default 10MB)
 * @return {object} - Validation result {valid: boolean, error: string}
 */
export function validateImageFile(file, maxSize = 10 * 1024 * 1024) {
    if (!file) {
        return {valid: false, error: 'No file selected'};
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        return {valid: false, error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG'};
    }
    
    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return {valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB`};
    }
    
    return {valid: true, error: null};
}
