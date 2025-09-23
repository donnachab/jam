/**
 * A simple, centralized state store using the observer pattern.
 * - Enforces a single source of truth for application state.
 * - Provides a structured way to update state via mutations.
 * - Notifies subscribers (like the UI) when state changes.
 */
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.mutations = {};
        this.subscribers = [];
    }

    /**
     * Returns a deep copy of the current state to prevent direct mutation.
     * @returns {object} The current application state.
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Registers mutation functions that can alter the state.
     * @param {object} mutations - An object where keys are mutation names and values are functions.
     *                           Each function receives `state` and an optional `payload`.
     */
    registerMutations(mutations) {
        this.mutations = {...this.mutations,...mutations };
    }

    /**
     * Commits a mutation to update the state. This is the only way to change the state.
     * @param {string} mutationName - The name of the mutation to commit.
     * @param {*} [payload] - The data to pass to the mutation function.
     */
    commit(mutationName, payload) {
        const mutation = this.mutations[mutationName];
        if (!mutation) {
            console.error(`Mutation "${mutationName}" not found.`);
            return;
        }

        // Create a new state object by applying the mutation
        const newState = {...this.state };
        mutation(newState, payload);
        this.state = newState;

        // Notify all subscribers of the state change
        this.notify();
    }

    /**
     * Adds a callback function to the list of subscribers.
     * The callback will be executed whenever the state changes.
     * @param {function} callback - The function to subscribe.
     * @returns {function} An unsubscribe function.
     */
    subscribe(callback) {
        if (typeof callback!== 'function') {
            console.error('Subscriber must be a function.');
            return () => {};
        }
        
        this.subscribers.push(callback);
        
        // Return an unsubscribe function for cleanup
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub!== callback);
        };
    }

    /**
     * Notifies all subscribers by calling their callback functions.
     */
    notify() {
        this.subscribers.forEach(callback => {
            try {
                callback(this.getState());
            } catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });
    }
}