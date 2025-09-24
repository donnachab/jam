# High-Level Feature Specification & Analysis

This document serves as the master checklist for the website's functionality. It has been updated to reflect the completed refactoring work. Test.

---
## 1. General / Site-wide

### 1.1. Functional Requirements

* **Layout & Navigation:**
    * `[✅]` The header element is sticky.
    * `[✅]` The mobile menu is implemented for smaller screens.
    * `[✅]` All navigation links scroll smoothly and close the mobile menu.
* **Asset Loading:**
    * `[✅]` All external libraries and fonts are loaded correctly.
    * `[✅]` The application is initiated by a single ES6 module ([`js/main.js`](./js/main.js)).
    * `[✅]` The site is broken down into small HTML components, loaded on demand by the `loadComponent` function to improve initial page load speed.

---
## 2. Admin Mode & Authentication

### 2.1. Functional Requirements

* **State Management:**
    * `[✅]` Admin status is managed using `sessionStorage`.
    * `[✅]` The site automatically initializes in Admin Mode if a session is active.
* **Authentication Flow:**
    * `[✅]` The "Admin" button in the footer triggers a PIN prompt modal.
    * `[✅]` The PIN is sent securely in the body of an **`HTTP POST` request**, fixing the original security flaw.
* **UI State:**
    * `[✅]` Admin Mode correctly shows/hides all `.admin-controls`.
    * `[✅]` The "Admin" button text toggles correctly.

### 2.2. Remaining Tasks

> ✅ **UX Flaw:** The `modal.js` file does not yet show a "Verifying..." loading state while the PIN is being checked.

---
## 3. Hero Section (`#home`)

### 3.1. Functional Requirements

* **Public View:**
    * `[✅]` The section displays a full-width cover photo loaded from Firestore.
* **Admin View:**
    * `[✅]` The "Change Cover Photo" button and form are functional.
    * `[✅]` The user receives success/error feedback via a modal after submission.

### 3.2. Remaining Tasks

> ✅ **Robustness Flaw:** The form does not yet validate that the input is a valid URL format before saving.

---
## 4. Regular Jams Section (`#jams`)

### 4.1. Functional Requirements

* **Data & Display Logic:**
    * `[✅]` The list always displays a minimum of 5 upcoming jam sessions.
    * `[✅]` The logic correctly filters past jams and generates placeholder jams for future Saturdays.
    * `[✅]` The list is sorted chronologically.
    * `[✅]` The data model now stores the full, unambiguous date (`YYYY-MM-DD`) in Firestore, fixing the critical design flaw of the original site.
* **Admin - Jam Management:**
    * `[✅]` Admin controls ("Edit", "Cancel"/"Reinstate", "Delete") appear for each confirmed jam.
    * `[✅]` A "Confirm" button appears for placeholder jams, opening the form pre-filled with the correct date, which improves the admin workflow.
    * `[✅]` The "Manage Venues" UI is fully functional.

---
## 5. Festivals & Events Section (`#special-events`)

### 5.1. Functional Requirements

* **Public View:**
    * `[✅]` An auto-playing carousel displays festival logos.
    * `[✅]` The list of upcoming events is correctly filtered and sorted.
    * `[✅]` The data model now uses two distinct fields, `startDate` and `endDate`, fixing the critical design flaw of the original site and making filtering reliable.
* **Admin View:**
    * `[✅]` The "Add New Event" button and form are functional.
    * `[✅]` Each event has "Edit" and "Delete" buttons.

---
## 6. Community & Charity Section

### 6.1. Functional Requirements
* **Public View:**
    * `[✅]` A slideshow of community/charity items is displayed.
* **Admin View:**
    * `[✅]` The admin form correctly shows conditional fields for "Community" vs. "Charity" items.

### 6.2. Remaining Tasks
> ✅ **Data Integrity Flaw:** The form allows submitting a "Charity" item without an amount or a "Community" item without a headline.

---
## 7. Gallery Section

### 7.1. Functional Requirements
* **Public View:**
    * `[✅]` A featured YouTube video is embedded and playable.
    * `[✅]` The logic uses a robust regular expression to correctly extract the video ID from various YouTube URL formats.
    * `[✅]` A grid of photos is displayed.
    * `[✅]` If a photo link is broken, a fallback placeholder image is shown instead of a broken icon.
* **Admin View:**
    * `[✅]` The "Change Featured Video" and "Add Photo" forms are functional.
    * `[✅]` Each photo has a "Delete" button.
