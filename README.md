# Galway Jam Circle Website - Modular Refactor

Welcome to the repository for the official Galway Jam Circle website. This project is a modularized refactor of the original monolithic `index.html` file, designed for easier maintenance, scalability, and content management.

For a detailed breakdown of all features and requirements, please see the `SPEC.md` file in this repository.

---
##  Tour of the Site Structure

The project is organized into a `public` directory, which contains all the files that are deployed to the live server.


/public/
|-- components/   # Small, reusable pieces of HTML
|   |-- admin/    # Admin-only forms and controls
|   |-- ui/       # Reusable UI elements like the modal
|-- css/          # Custom stylesheets
|-- images/       # Site images (logos, etc.)
|-- js/           # All JavaScript modules
|   |-- admin/    # JS for admin-only functionality
|   |-- ui/       # JS for general UI elements (menu, modal)
|-- index.html    # The main HTML shell for the application


---
### Key Files & How They Work

#### 1. `public/index.html`
This is the **main shell** of the application. It's a very simple file that contains the `<head>` section and empty container `<div>` elements (e.g., `<div id="header-container"></div>`). It does not contain any visible content itself.

#### 2. `public/js/main.js`
This is the **orchestrator** or "conductor" for the entire site. When the page loads, this script is responsible for:
* Loading all the small HTML files from the `/components/` folder and injecting them into the correct containers in `index.html`.
* Importing all other JavaScript modules.
* Fetching the initial data from Firebase.
* Calling the initialization functions from the other modules to make the page interactive.

#### 3. `public/js/firebase-config.js`
This file contains the connection details for your Firebase project. It initializes the connection to the Firestore database and exports the database instance for all other modules to use.

---
### How to Manage Content (Admin Mode)

All dynamic content on the site (jam schedules, events, photos, etc.) is managed through a password-protected admin panel.

1.  **Accessing Admin Mode:** Go to the live website and click the "Admin" link in the footer. Enter the PIN to reveal the admin controls.
2.  **Editing Content:** Once in Admin Mode, you will see "Edit," "Delete," and "Add New" buttons in each section. All changes made through these forms are saved directly to the live Firestore database.

---
### Deployment

This site is set up for **Continuous Deployment**.
* **Trigger:** A new deployment is automatically started every time a change is committed to the `main` branch.
* **Process:** The deployment is handled by a GitHub Actions workflow defined in `.github/workflows/deploy.yml`. This action takes the contents of the `/public` folder and deploys them to Firebase Hosting.
* **Status:** You can watch the progress of any deployment in the **Actions** tab of the GitHub repository.
