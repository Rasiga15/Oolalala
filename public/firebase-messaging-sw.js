// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDc3q-h-jF2jUMilsBtwaDAX5cpTKckEaI",
  authDomain: "oolalala-373ff.firebaseapp.com",
  projectId: "oolalala-373ff",
  storageBucket: "oolalala-373ff.firebasestorage.app",
  messagingSenderId: "139043764528",
  appId: "1:139043764528:web:1174f24f738f64291b70f5",
  measurementId: "G-WTJT4XGT1D"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});