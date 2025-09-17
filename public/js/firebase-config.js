// Import the necessary functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- Your Firebase Configuration ---
// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4SnqaOMQWmEFulkN8zZALZsqJLK7hOh0",
  authDomain: "galway-jam-circle-live.firebaseapp.com",
  projectId: "galway-jam-circle-live",
  storageBucket: "galway-jam-circle-live.firebasestorage.app",
  messagingSenderId: "140452021164",
  appId: "1:140452021164:web:049a190be3ba0b6c9a3009"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Get the auth instance

console.log("✅ Firebase initialized successfully.");

// Export the app, database, and auth instances to be used in other modules
export { app, db, auth, signInAnonymously, signInWithCustomToken };