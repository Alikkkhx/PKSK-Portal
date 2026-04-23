import { create } from 'zustand';
import { chatService } from '../service/api/chatService';
import { securityService } from '../service/api/securityService';
import { logger } from '../service/api/loggerService';
import { safeUnsub, createSubToken } from '../utils/subUtils';

/**
 * Chat Store v4.0.2 (Enterprise-Grade)
 * Система атомарных подписок с версионированием (Tokens).
 */
export const useChatStore = create((set, get) => ({
  // --- Public State ---
  inbox: [],
  activeChatMessages: [],
  unreadTotal: 0,
  isLoading: false,

  // --- Private-like Subscription State ---
  _subs: {
    inbox: { token: null, unsub: null },
    activeChat: { token: null, unsub: null }
  },

  /**
   * Подписка на Inbox (Список чатов)
   */
  subscribeToInbox: (userId) => {
    if (!userId) return;

    // 1. Cleanup & Token Rotation
    const current = get()._subs.inbox;
    safeUnsub(current.unsub, 'chat_inbox');
    
    const newToken = createSubToken();
    set(state => ({
      _subs: { ...state._subs, inbox: { token: newToken, unsub: null } }
    }));

    // 2. Start Listener
    try {
      const unsub = chatService.listenUserInbox(userId, (inbox) => {
        // RACE CONDITION CHECK: Актуален ли этот ответ?
        if (get()._subs.inbox.token !== newToken) {
          // logger.debug("chat_inbox_stale_ignored", { newToken });
          return;
        }

        const unreadTotal = inbox.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
        set({ inbox, unreadTotal });
      });

      // 3. Store Unsubscriber
      set(state => ({
        _subs: { ...state._subs, inbox: { ...state._subs.inbox, unsub } }
      }));
    } catch (e) {
      logger.error("chat_inbox_sub_fail", { error: e.message }, userId);
    }
  },

  /**
   * Подписка на сообщения конкретного чата
   */
  subscribeToChat: async (userId, chatId, participants) => {
    if (!userId || !chatId) return;

    // 1. Cleanup old chat sub
    const current = get()._subs.activeChat;
    safeUnsub(current.unsub, 'active_chat');

    const newToken = createSubToken();
    set(state => ({
      activeChatMessages: [], // Очищаем экран во время перехода
      _subs: { ...state._subs, activeChat: { token: newToken, unsub: null } }
    }));

    try {
      // Предварительное действие (Mark as read)
      await chatService.markAsRead(userId, chatId);

      const unsub = chatService.listenMessages(chatId, (messages) => {
        // RACE CONDITION CHECK
        if (get()._subs.activeChat.token !== newToken) return;
        set({ activeChatMessages: messages });
      });

      set(state => ({
        _subs: { ...state._subs, activeChat: { ...state._subs.activeChat, unsub } }
      }));
    } catch (e) {
      logger.error("chat_messages_sub_fail", { chatId, error: e.message }, userId);
    }
  },

  /**
   * Отправка сообщения
   */
  sendMessage: async (chatId, senderId, text, participants) => {
    if (!securityService.canPerformAction('message_send', senderId)) {
      throw new Error("Слишком много сообщений. Хватит флудить.");
    }

    try {
      await chatService.sendMessage(chatId, senderId, text, participants);
    } catch (e) {
      logger.error("chat_send_error", { chatId, error: e.message }, senderId);
      throw e;
    }
  },

  /**
   * Глобальная очистка (Logout / Critical Error)
   */
  clear: () => {
    const { inbox, activeChat } = get()._subs;
    
    safeUnsub(inbox.unsub, 'logout_inbox');
    safeUnsub(activeChat.unsub, 'logout_active_chat');

    set({
      inbox: [],
      activeChatMessages: [],
      unreadTotal: 0,
      isLoading: false,
      _subs: {
        inbox: { token: null, unsub: null },
        activeChat: { token: null, unsub: null }
      }
    });
  }
}));
