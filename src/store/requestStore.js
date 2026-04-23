import { create } from 'zustand';
import { requestService } from '../service/api/requestService';
import { securityService } from '../service/api/securityService';
import { logger } from '../service/api/loggerService';
import { safeUnsub, createSubToken } from '../utils/subUtils';

/**
 * Request Store v4.0.2 (Enterprise-Grade)
 * Атомарное управление заявками.
 */
export const useRequestStore = create((set, get) => ({
  // --- Public State ---
  requests: [],
  isLoading: false,

  // --- Private-like Subscription State ---
  _sub: {
    token: null,
    unsub: null
  },

  /**
   * Подписка на поток заявок (с токенизацией)
   */
  subscribe: (filters) => {
    // 1. Cleanup current active sub
    const current = get()._sub;
    safeUnsub(current.unsub, 'requests_list');

    const newToken = createSubToken();
    set(state => ({
      isLoading: true,
      _sub: { token: newToken, unsub: null }
    }));

    try {
      const unsub = requestService.listenRequests(filters, (data) => {
        // RACE CONDITION CHECK
        if (get()._sub.token !== newToken) {
          // logger.debug("request_stale_data_ignored", { newToken });
          return;
        }

        set({ requests: data, isLoading: false });
      }, (error) => {
        logger.error("requests_sub_error", { error: error.message });
        set({ isLoading: false });
      });

      // 2. Store internal unsubscriber
      set(state => ({
        _sub: { ...state._sub, unsub }
      }));
    } catch (e) {
      logger.error("requests_sub_setup_fail", { error: e.message });
      set({ isLoading: false });
    }
  },

  /**
   * Обновление статуса (Workflow Engine)
   */
  updateStatus: async (reqId, newStatus, agentId, note) => {
    const prevRequests = get().requests;
    
    // Optimistic Update
    set({
      requests: prevRequests.map(r => r.id === reqId ? { ...r, status: newStatus } : r)
    });

    try {
      await requestService.updateStatus(reqId, newStatus, agentId, note);
    } catch (e) {
      logger.error("request_status_update_fail", { reqId, newStatus, error: e.message });
      set({ requests: prevRequests }); // Rollback
      throw e;
    }
  },

  /**
   * Подача новой заявки (Idempotent)
   */
  submitRequest: async (buildingId, user, requestData) => {
    if (!securityService.canPerformAction('request_create', user.uid)) {
      throw new Error("Лимит заявок исчерпан. Подождите пару минут.");
    }

    set({ isLoading: true });
    try {
      await requestService.createRequest(buildingId, user, requestData);
      logger.info("request_create_success", { buildingId }, user.uid);
    } catch (e) {
      logger.error("request_create_fail", { error: e.message }, user.uid);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Тотальная чистка
   */
  clear: () => {
    const current = get()._sub;
    safeUnsub(current.unsub, 'logout_requests');

    set({
      requests: [],
      isLoading: false,
      _sub: { token: null, unsub: null }
    });
  }
}));
