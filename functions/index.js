const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * 📲 Push-уведомление при новом сообщении
 * Срабатывает на создание документа в подколлекции messages любого чата
 */
exports.notifyOnNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const newMessage = snap.data();
    const { chatId } = context.params;

    // 1. Получаем метаданные чата (участников)
    const chatSnap = await db.doc(`chats/${chatId}`).get();
    const chatData = chatSnap.data();

    // 2. Рассылаем Push всем участникам, кроме отправителя
    const payload = {
      notification: {
        title: 'Новое сообщение',
        body: newMessage.text.length > 50 ? newMessage.text.substring(0, 50) + '...' : newMessage.text,
        clickAction: `https://pksk-service.web.app/chat/${chatId}`
      },
      data: {
        chatId: chatId,
        senderId: newMessage.senderId
      }
    };

    const tokens = [];
    for (const uid of chatData.participants) {
      if (uid !== newMessage.senderId) {
        const userSnap = await db.doc(`users/${uid}`).get();
        const pushToken = userSnap.data()?.pushToken;
        if (pushToken) tokens.push(pushToken);
      }
    }

    if (tokens.length > 0) {
      return admin.messaging().sendToDevice(tokens, payload);
    }
    return null;
  });

/**
 * 📊 Агрегация статистики заявок по ЖК
 * Обновляет сводный отчет здания при каждом изменении заявки
 */
exports.aggregateBuildingStats = functions.firestore
  .document('requests/{requestId}')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : change.before.data();
    const { buildingId } = data;

    if (!buildingId) return null;

    // Считаем текущие показатели в коллекции 'requests' для этого ЖК
    const allReqs = await db.collection('requests').where('buildingId', '==', buildingId).get();
    
    const stats = {
      total: allReqs.size,
      pending: allReqs.docs.filter(d => d.data().status === 'pending').length,
      inProgress: allReqs.docs.filter(d => d.data().status === 'progress').length,
      completed: allReqs.docs.filter(d => d.data().status === 'completed').length,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    };

    // Сохраняем в метаданные здания или отдельную коллекцию
    return db.doc(`building_stats/${buildingId}`).set(stats, { merge: true });
  });
