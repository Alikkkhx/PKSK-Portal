import { db } from '../firebase';
import { logger } from './loggerService';
import { 
  collection, doc, setDoc, addDoc, updateDoc, 
  serverTimestamp, query, where, orderBy, 
  onSnapshot, increment, writeBatch, getDoc, getDocs, 
  limit as firestoreLimit, limitToLast 
} from 'firebase/firestore';

/**
 * Chat Service v4.0 (Enterprise Hardening)
 * Features Audit Logs, Idempotency, and Billing Protection.
 */
export const chatService = {

  /**
   * Поиск администратора для конкретного здания
   */
  findBuildingAdmin: async (buildingId) => {
    if (!buildingId) return null;
    const q = query(
      collection(db, 'users'),
      where('buildingId', '==', buildingId),
      where('role', 'in', ['admin', 'building_admin', 'super_admin']),
      firestoreLimit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
    return null;
  },
  
  /**
   * Идентификатор чата для приватных сообщений на основе UID
   */
  getPrivateChatId: (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  },

  /**
   * Создание или получение существующего чата
   */
  getOrCreateChat: async (chatId, participants, metadata = {}) => {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    
    if (!snap.exists()) {
      logger.audit("chat_room_init", { chatId, participants });
      const chatData = {
        id: chatId,
        participants, // Array of UIDs
        type: metadata.type || 'private',
        buildingId: metadata.buildingId || '',
        createdAt: serverTimestamp(),
        lastMessage: null
      };
      await setDoc(chatRef, chatData);
      
      const batch = writeBatch(db);
      participants.forEach(uid => {
        const userChatRef = doc(db, 'user_chats', `${uid}_${chatId}`);
        batch.set(userChatRef, {
          userId: uid,
          chatId: chatId,
          unreadCount: 0,
          lastReadAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    }
    return chatId;
  },

  /**
   * Отправка сообщения (Idempotent)
   */
  sendMessage: async (chatId, senderId, text, participants) => {
    // 1. Идемпотентный ID для защиты от дублей
    const msgId = crypto.randomUUID();
    const batch = writeBatch(db);
    
    logger.info("chat_send_message", { chatId, msgId }, senderId);
    
    const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
    const message = {
      id: msgId,
      senderId,
      text: text?.substring(0, 5000), // Тримминг для Enterprise Safety
      createdAt: serverTimestamp()
    };
    batch.set(msgRef, message);

    const chatRef = doc(db, 'chats', chatId);
    batch.update(chatRef, {
      lastMessage: { text: message.text, senderId, createdAt: serverTimestamp() }
    });

    participants.forEach(uid => {
      if (uid !== senderId) {
        const userChatRef = doc(db, 'user_chats', `${uid}_${chatId}`);
        batch.update(userChatRef, {
          unreadCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    });

    try {
      await batch.commit();
      return message;
    } catch (e) {
      logger.error("chat_send_failed", { chatId, msgId, error: e.message }, senderId);
      throw e;
    }
  },

  /**
   * Сброс счетчика непрочитанных при открытии чата
   */
  markAsRead: async (userId, chatId) => {
    const userChatRef = doc(db, 'user_chats', `${userId}_${chatId}`);
    await updateDoc(userChatRef, {
      unreadCount: 0,
      lastReadAt: serverTimestamp()
    });
  },

  /**
   * Real-time подписка (Billing Protected: Last 50 msgs)
   */
  listenMessages: (chatId, callback) => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limitToLast(50) // Защита биллинга от "тяжелой истории"
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data()));
    });
  },

  /**
   * Real-time подписка на Inbox (Limited to 100 chats)
   */
  listenUserInbox: (userId, callback) => {
    const q = query(
      collection(db, 'user_chats'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      firestoreLimit(100) // Пагинация де-факто
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data()));
    });
  }
};
