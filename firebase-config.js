import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcnC8qlA1iJ3xX6GFqOepwys52kLi-q2I",
    authDomain: "sltpublicschool.firebaseapp.com",
    projectId: "sltpublicschool",
    storageBucket: "sltpublicschool.firebasestorage.app",
    messagingSenderId: "433820069810",
    appId: "1:433820069810:web:226312a3d24456ea21beab",
    measurementId: "G-HN8SZ8QWL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
