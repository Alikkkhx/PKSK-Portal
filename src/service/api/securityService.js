import { logger } from './loggerService';

/**
 * Enterprise Security Service v4.0 (Hardening)
 * Features Client-side Rate Limiting (Token Bucket) and Data Sanitization.
 */
class SecurityService {
  constructor() {
    this.buckets = new Map();
    // Настройки лимитов: { действие: { maxTokens, refillPerSecond } }
    this.config = {
      'message_send': { max: 10, refill: 1 },    // 10 сообщений макс, +1 в сек
      'request_create': { max: 2, refill: 0.016 }, // 2 заявки макс, +1 в минуту
      'status_update': { max: 5, refill: 0.1 }   // 5 апдейтов макс, +1 в 10 сек
    };
  }

  /**
   * Проверка лимита (Rate Limiting)
   */
  canPerformAction(action, userId = 'anon') {
    const key = `${userId}_${action}`;
    const limit = this.config[action] || { max: 10, refill: 1 };
    
    let bucket = this.buckets.get(key);
    const now = Date.now();

    if (!bucket) {
      bucket = { tokens: limit.max, lastRefill: now };
    } else {
      // Подливаем токенов за прошедшее время
      const elapsed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(limit.max, bucket.tokens + elapsed * limit.refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      return true;
    }

    logger.warn("rate_limit_exceeded", { action, userId });
    return false;
  }

  /**
   * Валидация и очистка строк (Anti-XSS / Injection)
   */
  sanitize(text) {
    if (typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/<[^>]*>?/gm, ''); // Базовая очистка от HTML-тегов
  }
}

export const securityService = new SecurityService();
