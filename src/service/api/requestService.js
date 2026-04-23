import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, doc, setDoc, updateDoc, 
  serverTimestamp, query, where, orderBy, 
  onSnapshot, getDoc, runTransaction, limit 
} from 'firebase/firestore';

import { logger } from './loggerService';

/**
 * Request Service v4.0 (Enterprise Hardening)
 * Features Audit Logs, Idempotency, and Billing Control.
 */
export const requestService = {

  /**
   * Загрузка изображения для заявки (с лимитом размера)
   */
  uploadRequestImage: async (buildingId, file) => {
    if (!file) return null;
    
    // Enterprise Safety: Limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Файл слишком большой (макс 10МБ)");
    }

    const fileName = `${crypto.randomUUID()}_${file.name}`;
    const storageRef = ref(storage, `buildings/${buildingId}/requests/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },
  
  /**
   * Создание новой заявки (Idempotent)
   */
  createRequest: async (buildingId, residentData, requestData) => {
    // 1. Идемпотентный ID генерируется на клиенте до вызова или здесь через UUID
    const reqId = requestData.id || crypto.randomUUID();
    
    logger.info("request_create_start", { reqId, buildingId }, residentData.uid);

    const request = {
      id: reqId,
      buildingId,
      residentPhone: residentData.phone,
      residentUid: residentData.uid,
      residentName: residentData.name,
      apartment: residentData.apartment,
      title: requestData.title?.substring(0, 100), // Тримминг для защиты БД
      description: requestData.description?.substring(0, 2000),
      category: requestData.category,
      status: 'pending',
      priority: requestData.priority || 'medium',
      assignedTo: null,
      version: 1,
      imageUrl: requestData.imageUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date().toISOString(),
          updatedBy: residentData.uid,
          note: 'Заявка создана'
        }
      ]
    };

    try {
      await setDoc(doc(db, 'requests', reqId), request);
      logger.audit("request_created", { reqId }, residentData.uid);
      return request;
    } catch (e) {
      logger.error("request_create_fail", { reqId, error: e.message }, residentData.uid);
      throw e;
    }
  },

  /**
   * Атомарное обновление статуса с защитой от конфликтов
   */
  updateStatus: async (reqId, newStatus, agentId, note = '') => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'requests', reqId);
        const reqDoc = await transaction.get(reqRef);
        
        if (!reqDoc.exists()) throw new Error("Заявка не найдена");
        
        const data = reqDoc.data();
        const historyEntry = {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: agentId,
          note
        };

        transaction.update(reqRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
          version: (data.version || 1) + 1,
          statusHistory: [...(data.statusHistory || []), historyEntry]
        });
      });
    } catch (e) {
      console.error("Workflow error:", e);
      throw e;
    }
  },

  /**
   * Назначение исполнителя
   */
  assignTo: async (reqId, agentId, agentName) => {
    const reqRef = doc(db, 'requests', reqId);
    await updateDoc(reqRef, {
      assignedTo: { uid: agentId, name: agentName },
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Real-time подписка с фильтрацией (SaaS Optimized)
   */
  listenRequests: (filters, callback, errorCallback) => {
    let q = collection(db, 'requests');
    const constraints = [orderBy('createdAt', 'desc'), limit(50)];

    if (filters.buildingId) {
      constraints.push(where('buildingId', '==', filters.buildingId));
    }
    if (filters.residentUid) {
      constraints.push(where('residentUid', '==', filters.residentUid));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    const finalQuery = query(q, ...constraints);
    return onSnapshot(finalQuery, (snap) => {
      callback(snap.docs.map(d => d.data()));
    }, errorCallback);
  }
};
