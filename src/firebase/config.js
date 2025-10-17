// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAetN--t3Sl_4OfRLfh5BAbjP9oYyc5yRE",
  authDomain: "flash-5e878.firebaseapp.com",
  projectId: "flash-5e878",
  storageBucket: "flash-5e878.firebasestorage.app",
  messagingSenderId: "1078433139809",
  appId: "1:1078433139809:web:7b6572303d27fba92d2e20",
  measurementId: "G-DNVBDJZM3Q"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;