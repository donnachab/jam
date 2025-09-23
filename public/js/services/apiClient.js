/**
 * A resilient API client for handling all server communication.
 * - Uses async/await for clean, readable code.
 * - Implements AbortController for cancellable requests to prevent race conditions.
 * - Centralizes error handling and JSON parsing.
 */
const apiClient = {
    baseURL: '/api', // Configure your API base URL here

    /**
     * Performs a generic fetch request with standardized error handling and cancellation.
     * @param {string} endpoint - The API endpoint to request (e.g., '/users').
     * @param {object} options - The options object for the fetch call.
     * @returns {Promise<any>} - A promise that resolves with the JSON response data.
     * @throws {Error} - Throws an error if the request fails or is aborted.
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
           ...options,
            headers: {
                'Content-Type': 'application/json',
               ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Attempt to parse error details from the server response
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            // Handle responses with no content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch request was aborted.');
            } else {
                console.error('API Client Error:', error);
            }
            // Re-throw the error so the calling function can handle it
            throw error;
        }
    },

    /**
     * Performs a GET request.
     * @param {string} endpoint - The API endpoint.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the request.
     * @returns {Promise<any>}
     */
    get(endpoint, signal) {
        return this.request(endpoint, { method: 'GET', signal });
    },

    /**
     * Performs a POST request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} body - The request payload.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the request.
     * @returns {Promise<any>}
     */
    post(endpoint, body, signal) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            signal,
        });
    },

    /**
     * Performs a PUT request.
     * @param {string} endpoint - The API endpoint.
     * @param {object} body - The request payload.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the request.
     * @returns {Promise<any>}
     */
    put(endpoint, body, signal) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            signal,
        });
    },

    /**
     * Performs a DELETE request.
     * @param {string} endpoint - The API endpoint.
     * @param {AbortSignal} [signal] - An optional AbortSignal to cancel the request.
     * @returns {Promise<any>}
     */
    delete(endpoint, signal) {
        return this.request(endpoint, { method: 'DELETE', signal });
    },
};