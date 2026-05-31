import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDcnC8qlA1iJ3xX6GFqOepwys52kLi-q2I",
    authDomain: "sltpublicschool.firebaseapp.com",
    projectId: "sltpublicschool",
    storageBucket: "sltpublicschool.firebasestorage.app",
    messagingSenderId: "433820069810",
    appId: "1:433820069810:web:226312a3d24456ea21beab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
    try {
        console.log("Testing read...");
        const snapshot = await getDocs(collection(db, "applications"));
        console.log("Read success. Found " + snapshot.docs.length + " docs.");
        
        console.log("Testing write...");
        const docRef = await addDoc(collection(db, "applications"), { test: true });
        console.log("Write success. Doc ID: " + docRef.id);
        
        process.exit(0);
    } catch (e) {
        console.error("FIREBASE ERROR:", e);
        process.exit(1);
    }
}

testFirebase();
