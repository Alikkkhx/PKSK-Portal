import { db, storage } from './firebase';
import { 
  collection, addDoc, getDocs, onSnapshot, query, 
  orderBy, setDoc, doc, updateDoc, where, limit, 
  startAfter, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const firebaseApi = {
  // --- UPLOAD ---
  uploadFile: async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  },

  // --- USERS ---
  saveUser: async (user) => {
    try {
      await setDoc(doc(db, "users", user.phone), {
        ...user,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving user: ", e);
    }
  },
  getUser: async (phone) => {
    try {
      const snap = await getDoc(doc(db, "users", phone));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error("Error getting user: ", e);
      return null;
    }
  },
  getUsers: async () => {
    // Keeping for migration/admin purposes but marking as legacy/restricted
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error("Error getting users: ", e);
      return [];
    }
  },

  // --- MESSAGES ---
  listenMessages: (buildingId, callback, limitCount = 50) => {
    let q;
    if (buildingId === 'all') {
      q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(limitCount));
    } else {
      q = query(
        collection(db, "messages"), 
        where("buildingId", "==", buildingId), 
        orderBy("createdAt", "desc"), 
        limit(limitCount)
      );
    }
    
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), _doc: d })).reverse();
      callback(msgs);
    });
  },
  fetchPreviousMessages: async (buildingId, lastDoc, limitCount = 20) => {
    try {
      let q;
      const constraints = [orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount)];
      if (buildingId !== 'all') {
        constraints.unshift(where("buildingId", "==", buildingId));
      }
      q = query(collection(db, "messages"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), _doc: d }));
    } catch (e) {
      console.error("Error fetching history: ", e);
      return [];
    }
  },
  sendMessage: async (msg) => {
    try {
      const msgId = Date.now().toString();
      await setDoc(doc(db, "messages", msgId), {
        ...msg,
        id: msgId,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error sending message: ", e);
    }
  },

  // --- BUILDINGS (SERVERS) ---
  listenBuildings: (callback) => {
    return onSnapshot(collection(db, "buildings"), (snap) => {
      callback(snap.docs.map(d => d.data()));
    });
  },
  saveBuilding: async (building) => {
    try {
      await setDoc(doc(db, "buildings", building.id.toString()), building);
    } catch (e) {
      console.error("Error saving building: ", e);
    }
  },

  // --- REQUESTS ---
  listenRequests: (buildingId, callback, limitCount = 20) => {
    let q;
    if (buildingId === 'all') {
      q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(limitCount));
    } else {
      q = query(
        collection(db, "requests"), 
        where("buildingId", "==", buildingId), 
        orderBy("createdAt", "desc"), 
        limit(limitCount)
      );
    }
    return onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => ({ ...d.data(), _doc: d }));
      callback(reqs);
    });
  },
  fetchPreviousRequests: async (buildingId, lastDoc, limitCount = 20) => {
    try {
      let q;
      const constraints = [orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount)];
      if (buildingId !== 'all') {
        constraints.unshift(where("buildingId", "==", buildingId));
      }
      q = query(collection(db, "requests"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), _doc: d }));
    } catch (e) {
      console.error("Error fetching more requests: ", e);
      return [];
    }
  },
  saveRequest: async (req) => {
    try {
      const reqId = Date.now().toString();
      await setDoc(doc(db, "requests", reqId), {
        ...req,
        id: reqId,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving request: ", e);
    }
  },
  updateRequestStatus: async (reqId, status) => {
    try {
      await updateDoc(doc(db, "requests", reqId.toString()), { status });
    } catch (e) {
      console.error("Error updating request: ", e);
    }
  }
};
