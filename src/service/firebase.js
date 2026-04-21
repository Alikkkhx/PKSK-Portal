import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- КОНФИГУРАЦИЯ FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCTExOSpaiOFoo-y9ic-ISex2XgszFKI3Q",
  authDomain: "pksk-service.firebaseapp.com",
  projectId: "pksk-service",
  storageBucket: "pksk-service.firebasestorage.app",
  messagingSenderId: "120569750239",
  appId: "1:120569750239:web:f4547b9659a78b49bd3f6a",
  measurementId: "G-1HFFYNKJKK"
};

// Инициализация
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
