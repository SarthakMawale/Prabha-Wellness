import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyASK7lbjWDA50G3IJdzU2sEKubkdR0dwgY",
  authDomain: "prabha-wellness.firebaseapp.com",
  projectId: "prabha-wellness",
  storageBucket: "prabha-wellness.firebasestorage.app",
  messagingSenderId: "555332322398",
  appId: "1:555332322398:web:57e29182b8693c35ef60cf",
  measurementId: "G-EQ36VYT215"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
