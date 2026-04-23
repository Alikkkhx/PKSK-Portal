import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

/**
 * Auth Service v3.1 (SaaS Pro)
 * Clean abstraction over Firebase Authentication.
 */
export const authService = {
  
  /**
   * Преобразование телефона в служебный Email
   */
  _formatEmail: (phone) => {
    const clean = phone.replace(/\D/g, '');
    return `${clean}@pksk.kz`;
  },

  /**
   * Вход в систему
   */
  login: async (phone, password) => {
    const email = authService._formatEmail(phone);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Регистрация нового пользователя
   */
  register: async (phone, password) => {
    const email = authService._formatEmail(phone);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Выход из системы
   */
  logout: async () => {
    await signOut(auth);
  },

  /**
   * Подписка на изменение состояния аутентификации
   */
  onAuth: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};
