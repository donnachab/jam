# Galway Jam Circle Website - Modular

Welcome to the repository for the official Galway Jam Circle website. This document explains how the site is structured and why it was built this way, making it easy for anyone to maintain and update the project.

---
## Table of Contents

1.  [High-Level Specification](#high-level-specification)
2.  [The Logic of the Site Structure](#the-logic-of-the-site-structure)
3.  [How the Site Works: Key Files Explained](#how-the-site-works-key-files-explained)
4.  [How Each Feature Works](#how-each-feature-works)
5.  [How Images are Handled](#how-images-are-handled)
6.  [How to Manage Content](#how-to-manage-content)
7.  [How the Site is Deployed](#how-the-site-is-deployed)

---
### High-Level Specification

For a detailed checklist of all features and requirements, please see the **[SPEC.md file](./public/spec.md)**.

---
## The Logic of the Site Structure

The project is organized into a [`/public/`](./public/) directory. This is a standard practice for web hosting, **so that** the web server knows exactly which files are safe to show to the public.

Inside `public`, the files are broken down into small, logical pieces **so that** the project is easy to navigate and a change to one feature doesn't accidentally break another.

* [**`/components/`**](./public/components/) - This folder holds all the small HTML pieces of the website. We break the site down into components **so that** we don't have to edit one single, massive HTML file.
* [**`/css/`**](./public/css/) - This holds the custom styles for the site.
* [**`/images/`**](./public/images/) - This holds the core visual assets for the site.
* [**`/js/`**](./public/js/) - This holds all the JavaScript code. The code is split into modules based on features **so that** all the logic for a specific section is contained in one place.

---
## How the Site Works: Key Files Explained

### 1. The Shell: [`public/index.html`](./public/index.html)

In plain English, this file is just an empty shell. It contains the `<head>` section and a basic `<body>` with empty containers.

We use an empty shell **so that** the website can behave like a modern web application, loading content with JavaScript instead of loading entirely new pages. This makes the experience much faster for the user.

### 2. The Conductor: [`public/js/main.js`](./public/js/main.js)

This file is the brain of the operation. It runs when the page loads and is responsible for loading all components, connecting to the database, and initializing all other JavaScript modules.

We centralize this logic in one file **so that** we have a single, clear entry point for the application, which makes it much easier to debug problems.

### 3. The Phone Number: [`public/js/firebase-config.js`](./public/js/firebase-config.js)

This file has one simple job: it holds the connection details for your Firebase project.

We keep this in a separate file **so that** the connection details are isolated from the application logic.

---
## How Each Feature Works

*(This section provides a brief overview. For full details, see the SPEC.md file.)*

* **Header & Navigation:** Uses JavaScript to manage the mobile menu **so that** the site is easy to navigate on any device.
* **Regular Jams Section:** Automatically generates placeholder jams **so that** the public always sees a full schedule.
* **Festivals & Events Section:** Filters out past events **so that** the list is always current.
* **Community & Charity Section:** Uses a smart admin form that changes its fields based on the content type, **so that** the admin panel is intuitive.
* **Gallery Section:** Uses a robust function to handle any YouTube URL **so that** an admin can simply paste a link from their browser.

---
## How Images are Handled

The site uses two types of images: **Local Images** and **Linked Images**.

### 1. Local Images (Stored in the Project)

These are core visual assets that are part of the site's permanent design. They are stored in the [**`/public/images/`**](./public/images/) folder.

* `logo.svg`
* `lets_jam_logo.png`
* Festival logos (e.g., `cleggan-fringe-festival.jpg`)

We store these directly in the repository **so that** the site's core branding and layout do not depend on any external services.

### 2. Linked Images (Loaded from URLs)

These are dynamic content images that are frequently updated by administrators. The actual images are **not** stored in the repository. Instead, a URL pointing to the image is saved in the Firestore database. This applies to:

* The main **Cover Photo**
* All photos in the **Gallery**
* All images in the **Community & Charity** slider

We use links for this content **so that** an admin can add or change photos without needing to touch the code or perform a new deployment. It makes content management much faster and more flexible.

### How to Get a Permanent Image Link with Imgur

For any content you add through the admin panel, you will need a permanent, direct link to an image. **Imgur** is a free and reliable service for this.

1.  **Go to [imgur.com](https://imgur.com/)** and click the **"New post"** button.
2.  **Upload your image.** You can drag and drop the file from your computer.
3.  Once the upload is complete, **right-click** on the image.
4.  From the menu that appears, select **"Copy Image Address"** or **"Copy Image Link"**. This will give you a direct link that ends in `.jpg` or `.png`.
5.  **Paste this link** into the URL field in the website's admin panel.

---
## How to Manage Content

All dynamic content is managed through a password-protected admin panel. This is done **so that** non-technical users can update the site without touching the code.

1.  **Accessing Admin Mode:** Go to the live website and click the "Admin" link in the footer. Enter the PIN to reveal the admin controls.
2.  **Editing Content:** Once in Admin Mode, you will see "Edit," "Delete," and "Add New" buttons in each section.

---
## How the Site is Deployed

This site is set up for **Continuous Deployment**. A new deployment starts automatically every time a change is committed to the `main` branch. This is handled by a GitHub Actions workflow defined in [**`.github/workflows/deploy.yml`**](./.github/workflows/deploy.yml).

We use this automated process **so that** you never have to manually upload files, which saves time and reduces the risk of human error.
