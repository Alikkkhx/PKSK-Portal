import { db } from '../firebase';
import { 
  setDoc, doc, getDoc, serverTimestamp, 
  collection, query, where, getDocs 
} from 'firebase/firestore';

/**
 * User Service v3.1 (SaaS Ready)
 * Handles RBAC, UID-based profiles, and Auth Synchronization.
 */
export const userService = {

  /**
   * Прямое сохранение/обновление данных профиля
   */
  saveProfile: async (uid, data) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },
  /**
   * Синхронизация профиля после Auth. 
   * Переход на UID как основной идентификатор.
   */
  syncProfile: async (firebaseUser) => {
    if (!firebaseUser) return null;
    
    // 1. Ищем профиль по новому UID
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    
    // 2. Если профиля по UID нет, пробуем найти "наследие" по телефону
    if (!snap.exists()) {
      const email = firebaseUser.email || '';
      const phone = email.includes('@') ? email.split('@')[0] : '';
      
      let legacyData = {};
      if (phone) {
        console.log("Checking legacy profile for phone:", phone);
        const legacyRef = doc(db, 'users', phone); // В v2.3 телефон был ID документа
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          console.log("Legacy profile found! Migrating...");
          legacyData = legacySnap.data();
        }
      }

      const admins = ['77761193121', '7770001122'];
      const isSuperAdmin = admins.includes(phone);

      const baseData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        phone: phone,
        name: legacyData.name || (isSuperAdmin ? 'Chief Admin' : 'User'),
        role: isSuperAdmin ? 'super_admin' : (legacyData.role || 'resident'),
        buildingId: legacyData.buildingId || '',
        buildingName: legacyData.buildingName || '',
        apartment: legacyData.apartment || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, baseData);
      console.log("Profile migration complete for:", phone, "as", baseData.role);
      return baseData;
    }
    
    // Если профиль есть, проверяем не нужно ли обновить роль админа
    const currentData = snap.data();
    const admins = ['77761193121', '7770001122'];
    if (admins.includes(currentData.phone) && currentData.role !== 'super_admin') {
      await setDoc(userRef, { role: 'super_admin' }, { merge: true });
      currentData.role = 'super_admin';
    }

    return currentData;
  },

  getUser: async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Получение жильцов здания (Оптимизировано для Admin)
   */
  getBuildingResidents: async (buildingId) => {
    const q = query(
      collection(db, 'users'), 
      where('buildingId', '==', buildingId),
      where('role', '==', 'resident')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  }
};
