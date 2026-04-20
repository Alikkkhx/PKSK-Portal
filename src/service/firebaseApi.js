import { db } from './firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, setDoc, doc, updateDoc } from 'firebase/firestore';

export const firebaseApi = {
  // --- USERS ---
  saveUser: async (user) => {
    try {
      await setDoc(doc(db, "users", user.phone), user);
    } catch (e) {
      console.error("Error saving user: ", e);
    }
  },
  getUsers: async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error("Error getting users: ", e);
      return [];
    }
  },

  // --- MESSAGES ---
  listenMessages: (buildingId, callback) => {
    const q = query(collection(db, "messages"));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => d.data()).sort((a, b) => a.id - b.id);
      callback(buildingId === 'all' ? msgs : msgs.filter(m => m.buildingId === buildingId));
    });
  },
  sendMessage: async (msg) => {
    try {
      await setDoc(doc(db, "messages", msg.id.toString()), msg);
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
  listenRequests: (buildingId, callback) => {
    const q = query(collection(db, "requests"));
    return onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => d.data()).sort((a, b) => b.id - a.id);
      callback(buildingId === 'all' ? reqs : reqs.filter(r => r.buildingId === buildingId));
    });
  },
  saveRequest: async (req) => {
    try {
      await setDoc(doc(db, "requests", req.id.toString()), req);
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
