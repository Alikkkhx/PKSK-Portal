const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onMessageCreate = onDocumentCreated("messages/{messageId}", async (event) => {
  const message = event.data.data();
  const { text, senderName, buildingId, mode, recipientId } = message;

  console.log(`New message from ${senderName} in building ${buildingId}`);

  try {
    let tokens = [];

    if (mode === 'resident' && recipientId) {
      // Private message to a specific resident
      const userDoc = await admin.firestore().collection("users").doc(recipientId).get();
      if (userDoc.exists && userDoc.data().fcmTokens) {
        tokens = userDoc.data().fcmTokens;
      }
    } else {
      // General message to building
      // To scale 1000+, we would use Topics, but for now we query building members
      const usersSnap = await admin.firestore().collection("users")
        .where("buildingId", "==", buildingId)
        .get();
      
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.fcmTokens) {
          tokens = tokens.concat(data.fcmTokens);
        }
      });
    }

    // Filter out duplicates and empty values
    const uniqueTokens = [...new Set(tokens)].filter(t => !!t);

    if (uniqueTokens.length === 0) {
      console.log("No FCM tokens found for target recipients.");
      return;
    }

    const payload = {
      notification: {
        title: `Новое сообщение: ${senderName}`,
        body: text.length > 100 ? text.substring(0, 97) + "..." : text,
        icon: "/pwa-192x192.png",
      },
      tokens: uniqueTokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`Successfully sent ${response.successCount} notifications.`);

    // Optional: Cleanup invalid tokens
    if (response.failureCount > 0) {
      console.log(`${response.failureCount} tokens failed.`);
    }

  } catch (error) {
    console.error("Error sending notification:", error);
  }
});
