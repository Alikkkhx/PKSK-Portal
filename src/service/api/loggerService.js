import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Enterprise Logger Service v4.0.2 (Observability & Privacy)
 * Handles structured logging and persistence with PII protection.
 */
class LoggerService {
  constructor() {
    this.levels = { INFO: 'info', WARN: 'warn', ERROR: 'error', AUDIT: 'audit' };
    this.sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'credential', 'auth'];
  }

  /**
   * Рекурсивная очистка чувствительных данных
   */
  scrub(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.scrub(item));

    const scrubbed = {};
    for (const key in obj) {
      if (this.sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        scrubbed[key] = this.scrub(obj[key]);
      } else {
        scrubbed[key] = obj[key];
      }
    }
    return scrubbed;
  }

  /**
   * Центральный метод логирования
   */
  async log(level, action, payload = {}, userId = 'system') {
    const timestamp = new Date().toISOString();
    
    // Очищаем payload перед любым выводом/записью
    const safePayload = this.scrub(payload);

    const logEntry = {
      level,
      action,
      payload: safePayload,
      userId,
      timestamp,
      environment: import.meta.env.MODE || 'production'
    };

    // 1. Консольный вывод
    const color = level === 'error' ? 'red' : level === 'warn' ? 'orange' : 'cyan';
    console.log(`%c[${level.toUpperCase()}] ${action}`, `color: ${color}; font-weight: bold;`, safePayload);

    // 2. Персистенция в Firestore (Audit Trail)
    if (level === 'error' || level === 'audit') {
      try {
        await addDoc(collection(db, 'system_logs'), {
          ...logEntry,
          serverTime: serverTimestamp()
        });
      } catch (e) {
        // Fallback если запись в базу невозможна (например, нет интернета)
        console.error("Critical logging failure:", e);
      }
    }
  }

  info(action, payload, userId) { this.log(this.levels.INFO, action, payload, userId); }
  warn(action, payload, userId) { this.log(this.levels.WARN, action, payload, userId); }
  error(action, payload, userId) { this.log(this.levels.ERROR, action, payload, userId); }
  audit(action, payload, userId) { this.log(this.levels.AUDIT, action, payload, userId); }
}

export const logger = new LoggerService();
