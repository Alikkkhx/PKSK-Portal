import { db } from '../firebase';
import { 
  collection, doc, setDoc, getDoc, getDocs, 
  deleteDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';

/**
 * Building Service v3.0 (SaaS Pro)
 * Orchestrates Infrastructure, Building Sites, and Metadata.
 */
export const buildingService = {
  
  /**
   * Получение списка всех зданий (SaaS Optimized)
   */
  getBuildings: async () => {
    const snap = await getDocs(collection(db, 'buildings'));
    return snap.docs.map(d => d.data());
  },

  /**
   * Создание нового ЖК с авто-инициализацией сайта
   */
  createBuilding: async (buildingData) => {
    const { id, name, address } = buildingData;
    
    // 1. Создаем запись о здании в реестре
    await setDoc(doc(db, 'buildings', id.toString()), {
      id, name, address,
      createdAt: serverTimestamp()
    });

    // 2. Инициализируем информационный сайт ЖК
    const siteRef = doc(db, 'building_sites', id.toString());
    await setDoc(siteRef, {
      id,
      name,
      about: `Добро пожаловать в ${name}! Мы стремимся к лучшему обслуживанию нашего дома.`,
      contacts: {
        plumber: '+7 (700) 000-00-01',
        electrician: '+7 (700) 000-00-02',
        pksk: '+7 (700) 000-00-00 (диспетчер)'
      },
      tariffs: [
        { label: 'Целевые расходы', price: '45 тг/м2' },
        { label: 'Вывоз мусора', price: '320 тг/чел' }
      ],
      news: [
        { title: 'Запуск портала', text: 'Теперь наш ЖК использует Smart PKSK для управления заявками.', date: new Date().toISOString() }
      ],
      updatedAt: serverTimestamp()
    });

    return id;
  },

  /**
   * Удаление здания (Full Cleanup)
   */
  deleteBuilding: async (id) => {
    // Удаляем из реестра и удаляем сайт
    await deleteDoc(doc(db, 'buildings', id.toString()));
    await deleteDoc(doc(db, 'building_sites', id.toString()));
  },

  /**
   * Получение данных сайта конкретного здания
   */
  getBuildingSite: async (buildingId) => {
    if (!buildingId) return null;
    const snap = await getDoc(doc(db, 'building_sites', buildingId));
    return snap.exists() ? snap.data() : null;
  },

  /**
   * Обновление контента сайта (Admin Only)
   */
  updateSiteContent: async (buildingId, data) => {
    const siteRef = doc(db, 'building_sites', buildingId);
    await updateDoc(siteRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
};
