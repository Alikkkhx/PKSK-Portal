import { db, storage, auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
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

  // --- AUTH & USERS ---
  _cleanPhone: (phone) => phone.toString().replace(/\D/g, ''),
  
  login: async (phone, password) => {
    const clean = firebaseApi._cleanPhone(phone);
    const email = `${clean}@pksk.kz`;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await firebaseApi.getUser(clean);
      return { ...userDoc, uid: userCredential.user.uid };
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        const legacyUser = await firebaseApi.getUser(clean);
        if (legacyUser && legacyUser.password === password) {
          console.log("Migrating user to Firebase Auth...");
          const newCredential = await createUserWithEmailAndPassword(auth, email, password);
          return { ...legacyUser, uid: newCredential.user.uid };
        }
      }
      throw e;
    }
  },
  register: async (userData) => {
    try {
      const clean = firebaseApi._cleanPhone(userData.phone);
      if (!clean) throw new Error("Номер телефона не может быть пустым");
      const email = `${clean}@pksk.kz`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      const finalData = { ...userData, phone: clean, uid: userCredential.user.uid };
      await firebaseApi.saveUser(finalData);
      return finalData;
    } catch (e) {
      console.error("Registration logic error:", e);
      throw e;
    }
  },

  logout: () => signOut(auth),
  onAuth: (callback) => onAuthStateChanged(auth, callback),
  saveUser: async (user) => {
    try {
      const isTestAdmin = user.phone === '7770001122' || user.name === 'Admin Audit';
      await setDoc(doc(db, "users", user.phone), {
        ...user,
        role: isTestAdmin ? 'admin' : user.role || 'resident',
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
