import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAolrucWRhI9K2o1zHJWzspj_0WF79-VZQ",
  authDomain: "gen-lang-client-0553050332.firebaseapp.com",
  projectId: "gen-lang-client-0553050332",
  storageBucket: "gen-lang-client-0553050332.firebasestorage.app",
  messagingSenderId: "1028090261418",
  appId: "1:1028090261418:web:54191f03e0e9f98edb05d3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-frankburger-5c10f739-ebe8-442b-a9ad-7062987a6938");
export const storage = getStorage(app);
