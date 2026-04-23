import { logger } from '../service/api/loggerService';

/**
 * subUtils v1.0 (Enterprise Safety)
 * Утилиты для управления жизненным циклом подписок.
 */

/**
 * Безопасный вызов функции отписки
 * @param {Function|null} unsub - функция отписки от Firestore
 * @param {string} label - метка для логов
 * @returns {null}
 */
export const safeUnsub = (unsub, label = 'unknown') => {
  if (!unsub) return null;

  if (typeof unsub === 'function') {
    try {
      unsub();
      // logger.debug(`sub_cleanup_success: ${label}`); // Для экстремального дебага
    } catch (e) {
      logger.error('sub_cleanup_error', { label, error: e.message });
    }
  } else {
    logger.error('sub_invalid_type', { 
      label, 
      type: typeof unsub, 
      msg: 'Expected function for unsubscribe' 
    });
  }
  return null;
};

/**
 * Создание уникального токена для предотвращения Race Conditions
 * @returns {string}
 */
export const createSubToken = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
