import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDjpGWi4FvaoLg0GKuaRTYVqACd7CEesGg",
  authDomain: "unlearned-sensor.firebaseapp.com",
  projectId: "unlearned-sensor",
  storageBucket: "unlearned-sensor.firebasestorage.app",
  messagingSenderId: "468425508344",
  appId: "1:468425508344:web:ab7924ffc6df9698bac20d",
  measurementId: "G-V0GDXCQ9GN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);