// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1pOHVw_IbZJBUhvx79pjE600Xofe40t8",
  authDomain: "beer-olympics-615cb.firebaseapp.com",
  projectId: "beer-olympics-615cb",
  storageBucket: "beer-olympics-615cb.appspot.com",
  messagingSenderId: "92597609287",
  appId: "1:92597609287:web:d1201c0c768d15f99a2262"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the database to use in other files
export { db };