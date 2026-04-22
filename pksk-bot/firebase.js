const admin = require("firebase-admin");

let db;

try {
  // Файл serviceAccountKey.json создается в Firebase Console
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  console.log("🔥 Firebase Admin подключен успешно!");
} catch (error) {
  console.error("❌ Ошибка подключения Firebase. Проверь наличие файла serviceAccountKey.json!");
  console.error(error.message);
}

module.exports = { admin, db };
