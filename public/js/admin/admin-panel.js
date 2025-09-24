<div id="admin-panel" class="admin-panel-container bg-gray-800 text-white p-6 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 border-b border-gray-600 pb-2">Admin Panel</h2>

    <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Site Configuration</h3>
        <div class="space-y-4">
            <div>
                <label for="site-title-input" class="block text-sm font-medium text-gray-300">Site Title</label>
                <input type="text" id="site-title-input" class="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>
            <div>
                <label for="meta-description-input" class="block text-sm font-medium text-gray-300">Meta Description</label>
                <textarea id="meta-description-input" rows="3" class="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
            </div>
            <div>
                <button id="save-site-config-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Save Configuration
                </button>
            </div>
        </div>
    </div>
    
    <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Site Logo Settings</h3>
        <div class="space-y-4">
            <div>
                <label for="dark-logo-url" class="block text-sm font-medium text-gray-300">Dark Theme Logo URL</label>
                <input type="url" id="dark-logo-url" placeholder="https://example.com/dark-logo.svg"
                       class="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
            </div>
            <div>
                <label for="light-logo-url" class="block text-sm font-medium text-gray-300">Light Theme Logo URL</label>
                <input type="url" id="light-logo-url" placeholder="https://example.com/light-logo.svg"
                       class="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
            </div>
             <div>
                <label for="default-logo-url" class="block text-sm font-medium text-gray-300">Default Theme Logo URL</label>
                <input type="url" id="default-logo-url" placeholder="https://example.com/default-logo.svg"
                       class="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
            </div>
            <div>
                <button id="save-logo-urls-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Save Logo URLs
                </button>
            </div>
        </div>
    </div>
</div>
