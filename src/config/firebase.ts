// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDc3q-h-jF2jUMilsBtwaDAX5cpTKckEaI",
  authDomain: "oolalala-373ff.firebaseapp.com",
  projectId: "oolalala-373ff",
  storageBucket: "oolalala-373ff.firebasestorage.app",
  messagingSenderId: "139043764528",
  appId: "1:139043764528:web:1174f24f738f64291b70f5",
  measurementId: "G-WTJT4XGT1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// 🔥 REPLACE THIS WITH YOUR ACTUAL VAPID KEY FROM FIREBASE CONSOLE
const VAPID_KEY = "BOot1hyzrmD-nKFwlStBnmFOiBaYohCLFx9rzaD9jITUThoA8-mxQLnQZthyViPrvwlm44VJSPJ5uf0Ax4osTCc";

// Initialize Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('Firebase Messaging initialized successfully');
    } else {
      console.warn('Firebase Messaging not supported in this browser');
    }
  }).catch(error => {
    console.error('Error checking messaging support:', error);
  });
}

export { app, analytics, messaging, VAPID_KEY };