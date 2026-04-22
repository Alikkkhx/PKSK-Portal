require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { db } = require('./firebase');

const bot = new Telegraf(process.env.BOT_TOKEN);

if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'ТВОЙ_ТОКЕН_ОТ_BOT_FATHER') {
  console.error("❌ ОШИБКА: Замени BOT_TOKEN в файле .env на настоящий токен!");
  process.exit(1);
}

// 1. Стартовое окно
bot.start((ctx) => {
  ctx.reply(
    '👋 Добро пожаловать в Smart PKSK!\n\nДля доступа к системе, пожалуйста, подтвердите свой номер телефона.',
    Markup.keyboard([
      Markup.button.contactRequest('📱 Отправить мой номер телефона')
    ])
    .resize()
    .oneTime()
  );
});

// 2. Обработка номера телефона
bot.on('contact', async (ctx) => {
  if (!db) {
      return ctx.reply('⚠️ Ошибка базы данных (Firebase Admin не подключен).');
  }

  const phoneNumber = ctx.message.contact.phone_number;
  const telegramId = ctx.message.from.id;
  
  // Форматы Телеграма (+7) и местного ввода (8)
  const formattedPhone1 = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
  const formattedPhone2 = formattedPhone1.replace('+7', '8');
  
  ctx.reply(`⏳ Ищу пользователя ${formattedPhone1} или ${formattedPhone2} в базе данных...`, Markup.removeKeyboard());

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('phone', 'in', [formattedPhone1, formattedPhone2]).get();

    if (snapshot.empty) {
      return ctx.reply('❌ Ошибка: В базе данных не найден пользователь с таким номером. Пожалуйста, сначала зарегистрируйтесь на сайте портала.');
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Сохраняем telegramId в карточку юзера, чтобы делать Push-уведомления
    await usersRef.doc(userDoc.id).update({
      telegramId: telegramId
    });

    // Показываем меню в зависимости от роли
    if (userData.role === 'admin') {
      showAdminMenu(ctx, userData);
    } else {
      showResidentMenu(ctx, userData);
    }

  } catch (error) {
    console.error('Ошибка входа:', error);
    ctx.reply('⚠️ Произошла ошибка базы данных. Попробуйте позже.');
  }
});

// Меню Админа
function showAdminMenu(ctx, userData) {
  ctx.reply(
    `✅ Успешный вход!\n\nВы авторизованы как Администратор: ${userData.name}.\nТеперь вы будете получать уведомления в Telegram о новых заявках!`,
    Markup.keyboard([
      ['📋 Мониторинг заявок'],
      ['💬 Чат с жильцами']
    ]).resize()
  );
}

// Меню Жильца
function showResidentMenu(ctx, userData) {
  ctx.reply(
    `✅ Успешный вход!\n\nДобро пожаловать, ${userData.name} (Кв. ${userData.apartment}).\nЧто вы хотите сделать?`,
    Markup.keyboard([
      ['🛠 Создать новую заявку', '⏳ Мои заявки'],
      ['💬 Чат с КСК']
    ]).resize()
  );
}

// ========== Базовые кнопки ==========

bot.hears('🛠 Создать новую заявку', (ctx) => {
  ctx.reply('Введите текст вашей проблемы или прикрепите фото. Я передам это напрямую диспетчеру!');
});

bot.hears('⏳ Мои заявки', (ctx) => {
  ctx.reply('🛠 В разработке: здесь будет выгрузка статусов...');
});

bot.hears('💬 Чат с КСК', (ctx) => {
  ctx.reply('🛠 В разработке: отправка сообщений диспетчеру...');
});

bot.launch().then(() => {
  console.log('🤖 Telegram Бот запущен и ждет сообщения...');
}).catch(err => {
  console.error('❌ Ошибка запуска бота:', err);
});

// Плавная остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
