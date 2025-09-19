export function initializeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    const tabButtons = adminPanel.querySelectorAll('.admin-tab-btn');
    const tabContents = adminPanel.querySelectorAll('.admin-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active-tab'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Activate the clicked tab
            button.classList.add('active-tab');
            const tabId = button.dataset.tab;
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });

    console.log('✅ Admin Panel initialized.');
}
