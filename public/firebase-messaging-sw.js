// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// (Use the same config as in your main firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyCTExOSpaiOFoo-y9ic-ISex2XgszFKI3Q",
  authDomain: "pksk-service.firebaseapp.com",
  projectId: "pksk-service",
  storageBucket: "pksk-service.firebasestorage.app",
  messagingSenderId: "120569750239",
  appId: "1:120569750239:web:f4547b9659a78b49bd3f6a"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
