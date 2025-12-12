/**
 * Input Sanitization and Validation Utilities
 * Provides client-side input validation and sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify when available, falls back to basic sanitization
 * @param {string} dirty - Unsanitized HTML string
 * @return {string} - Sanitized HTML string
 */
export function sanitizeHTML(dirty) {
    if (typeof dirty !== 'string') return '';
    
    // If DOMPurify is available (loaded from CDN), use it
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
        });
    }
    
    // Fallback: basic HTML escaping
    const div = document.createElement('div');
    div.textContent = dirty;
    return div.innerHTML;
}

/**
 * Sanitize text input (removes HTML tags)
 * @param {string} input - Input string
 * @return {string} - Sanitized string
 */
export function sanitizeText(input) {
    if (typeof input !== 'string') return '';
    
    // Remove HTML tags
    const div = document.createElement('div');
    div.textContent = input;
    return div.textContent.trim();
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {Array<string>} allowedProtocols - Allowed protocols (default: http, https)
 * @return {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeURL(url, allowedProtocols = ['http:', 'https:']) {
    if (typeof url !== 'string' || url.length === 0) return null;
    
    try {
        const parsed = new URL(url);
        
        // Check if protocol is allowed
        if (!allowedProtocols.includes(parsed.protocol)) {
            console.warn(`Invalid protocol: ${parsed.protocol}`);
            return null;
        }
        
        // Return sanitized URL
        return parsed.href;
    } catch (error) {
        console.warn('Invalid URL:', url);
        return null;
    }
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @return {boolean} - True if valid
 */
export function validateEmail(email) {
    if (typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate and sanitize file name
 * @param {string} fileName - File name to validate
 * @return {string|null} - Sanitized file name or null if invalid
 */
export function sanitizeFileName(fileName) {
    if (typeof fileName !== 'string' || fileName.length === 0) return null;
    
    // Remove path traversal attempts
    let sanitized = fileName.replace(/\.\./g, '').replace(/[\/\\]/g, '');
    
    // Remove special characters except dots, dashes, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }
    
    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = allowedExtensions.some(ext => 
        sanitized.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
        console.warn('Invalid file extension:', fileName);
        return null;
    }
    
    return sanitized;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @return {boolean} - True if valid
 */
export function validateLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') return false;
    return str.length >= min && str.length <= max;
}

/**
 * Sanitize object for Firestore (removes undefined values, validates types)
 * @param {object} obj - Object to sanitize
 * @return {object} - Sanitized object
 */
export function sanitizeFirestoreData(obj) {
    if (typeof obj !== 'object' || obj === null) return {};
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        // Skip undefined values
        if (value === undefined) continue;
        
        // Sanitize key (alphanumeric and underscore only)
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[sanitizedKey] = sanitizeFirestoreData(value);
        } 
        // Sanitize strings
        else if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeText(value);
        }
        // Keep other primitive types as-is
        else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
            sanitized[sanitizedKey] = value;
        }
        // Handle arrays
        else if (Array.isArray(value)) {
            sanitized[sanitizedKey] = value.map(item => 
                typeof item === 'string' ? sanitizeText(item) : item
            );
        }
    }
    
    return sanitized;
}

/**
 * Rate limit function calls (client-side)
 * @param {Function} func - Function to rate limit
 * @param {number} delay - Delay in milliseconds
 * @return {Function} - Rate limited function
 */
export function rateLimit(func, delay = 1000) {
    let timeout;
    let lastCall = 0;
    
    return function(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        
        clearTimeout(timeout);
        
        if (timeSinceLastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        } else {
            return new Promise((resolve) => {
                timeout = setTimeout(() => {
                    lastCall = Date.now();
                    resolve(func.apply(this, args));
                }, delay - timeSinceLastCall);
            });
        }
    };
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @return {Function} - Debounced function
 */
export function debounce(func, delay = 300) {
    let timeout;
    
    return function(...args) {
        clearTimeout(timeout);
        return new Promise((resolve) => {
            timeout = setTimeout(() => {
                resolve(func.apply(this, args));
            }, delay);
        });
    };
}
