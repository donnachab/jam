High-Level Feature Specification & Analysis
This document serves as the master checklist for the website's functionality and the "source of truth" for our refactoring process.

1. General / Site-wide
1.1. Functional Requirements
[ ] Layout & Navigation:

The header element must be sticky, remaining fixed to the top of the viewport during vertical scrolling.

On screen widths below 768px (md breakpoint), the main navigation links must be hidden, and a "hamburger" menu icon must be displayed.

Clicking the hamburger icon must toggle the visibility of the mobile menu dropdown.

Clicking any navigation link (in either the main nav or mobile menu) must smoothly scroll the page to the corresponding section.

Clicking any link within the open mobile menu must also immediately close the menu.

[ ] Asset Loading:

All external CSS libraries (Flatpickr, Swiper) and fonts (Google Fonts) must be loaded in the <head>.

All external JS libraries must be loaded at the end of the <body>.

The main application logic must be initiated by a single ES6 module (js/main.js).

1.2. Critique & Suggestions
🧐 Design Flaw: The original site loads all HTML for the entire single-page application at once. This includes all hidden admin forms. For a large site, this can slow down the initial page load.

Our Action: Our component-loading approach (loadComponent function) is the correct solution. It breaks the HTML into smaller, manageable chunks. We will ensure all sections are loaded this way.

2. Admin Mode & Authentication
2.1. Functional Requirements
[ ] State Management:

Admin status must be managed using sessionStorage. An active session (gjc_isAdmin=true) persists only until the browser tab is closed.

If a user loads the page with an active admin session, the site must automatically initialize in Admin Mode.

[ ] Authentication Flow:

A button labeled "Admin" must be present in the site footer.

Clicking the "Admin" button when not logged in must trigger a modal pop-up prompting for a PIN.

The modal must contain a password input field and "Submit" / "Cancel" buttons.

Submitting the correct PIN must enable Admin Mode.

Submitting an incorrect PIN must display an error message in the modal.

[ ] UI State:

When Admin Mode is enabled, all elements with .admin-controls or .admin-controls-inline classes must become visible.

The footer button's text must change to "Exit Admin".

Clicking this button, or any other "Exit Admin Mode" button, must disable Admin Mode, clear the session storage item, and hide all admin controls.

2.2. Critique & Suggestions
🚨 Security Flaw (Critical): The original code verifies the PIN via an HTTP GET request, exposing the PIN in the URL.

Our Action: The new admin-mode.js must send the PIN in the body of an HTTP POST request to the Google Apps Script endpoint. This is a non-negotiable security fix that works within your constraints.

🧐 UX Flaw: The original code has no loading indicator while the PIN is being verified. On a slow connection, the UI just hangs.

Our Action: We will enhance our modal.js to show a "Verifying..." state after the user clicks "Submit" on the PIN form.

3. Hero Section (#home)
3.1. Functional Requirements
[ ] Public View:

The section must display a full-width cover photo.

The image src must be dynamically set from the coverPhotoUrl field in the site_config Firestore document.

A hard-coded fallback image URL must be used if the database call fails or the field is empty.

[ ] Admin View:

An admin button "Change Cover Photo" must be visible.

Clicking the button must display the cover photo form and hide all other admin forms.

The form must contain a URL input field and Save/Cancel buttons.

Submitting a valid URL must update the coverPhotoUrl field in Firestore.

After submission, the user must receive feedback (success/error modal), the form must be hidden, and the new image must be displayed.

3.2. Critique & Suggestions
🧐 Robustness Flaw: The original code doesn't validate the input. A user could enter text that isn't a URL, breaking the image display.

Our Action: We will add client-side validation to the form in hero-admin.js to ensure the input is a valid URL format before attempting to save.

4. Regular Jams Section (#jams)
4.1. Functional Requirements
[ ] Data & Display Logic:

The list must display a minimum of 5 upcoming jam sessions.

The logic must be: fetch confirmed jams, filter out past ones, then generate placeholder "To be decided..." jams for future Saturdays until the 5-item minimum is met.

The list must be sorted chronologically.

Jams marked cancelled: true must be visually distinct and labeled as such.

[ ] Admin - Jam Management:

Admin controls ("Edit", "Cancel"/"Reinstate", "Delete") must appear for each confirmed jam.

The "Add New Jam" form must use a date picker that enforces a full DD MMM YYYY format.

When a venue is selected from the dropdown, the "Google Maps Link" field should auto-populate if a link exists for that venue.

[ ] Admin - Venue Management:

The "Manage Venues" UI must list all current venues from Firestore.

Each venue in the list must have a "Delete" button.

A form must be present to add a new venue with a name and an optional map link.

4.2. Critique & Suggestions
🚨 Design Flaw (Critical): The original parseJamDate function is extremely brittle. It guesses the year based on the current date, which will fail across new year boundaries and makes the entire jam schedule unreliable.

Our Action: This is a top-priority fix. We will store the full date (including the year) in Firestore for every jam. The date picker in the admin form will be configured to output a full, unambiguous date string. The parseJamDate function will be rewritten to handle this reliable format.

🧐 UX Flaw: To confirm a placeholder jam, an admin has to manually re-enter the date.

Our Action: We will add an "Edit" button to the placeholder jams. Clicking it will open the "Add New Jam" form pre-filled with the correct proposed date, streamlining the workflow.

5. Festivals & Events Section (#special-events)
5.1. Functional Requirements
[ ] Public View:

An auto-playing, looping carousel must display festival logos.

A list of upcoming special events from Firestore must be displayed, sorted by start date.

Events whose end date has passed must not be displayed.

[ ] Admin View:

An "Add New Event" button must be visible.

Each event in the list must have "Edit" and "Delete" buttons.

5.2. Critique & Suggestions
🚨 Design Flaw (Critical): The original code uses a single free-text field (event.dates) to store date information. This makes reliable sorting and filtering impossible.

Our Action: We will change the data model. Events in Firestore will now have two distinct, required fields: startDate and endDate. The admin form will be updated with two date-picker inputs to enforce this structured data. This makes the display logic robust and reliable.

This detailed analysis would continue for the Community, Gallery, and Contact sections, following the same format.
