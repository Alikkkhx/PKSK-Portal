import { messaging, db } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// IMPORTANT: Replace this with your actual VAPID key from Firebase Console
const VAPID_KEY = "YOUR_PUBLIC_VAPID_KEY_HERE";

export const fcmService = {
  requestPermission: async (userPhone) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          console.log('FCM Token:', token);
          // Store token in Firestore for targeted notifications
          await updateDoc(doc(db, "users", userPhone), {
            fcmTokens: arrayUnion(token)
          });
          return token;
        }
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
    return null;
  },

  onForegroundMessage: (callback) => {
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }
};
