import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from './service/api/authService';
import { userService } from './service/api/userService';
import { buildingService } from './service/api/buildingService';
import { useChatStore } from './store/chatStore';
import { useRequestStore } from './store/requestStore';
import { useToast } from './components/common/Toast';
import { AuthContext, I18nContext } from './contexts';
import { logger } from './service/api/loggerService';

// Layouts & Views
import { MainView } from './layouts/MainView';
import { LoginView } from './features/auth/LoginView';
import { RegisterView } from './features/auth/RegisterView';
import { NewRequestModal } from './features/management/NewRequestModal';

// Locales
import ru from './locales/ru.json';
import kz from './locales/kz.json';
import en from './locales/en.json';

const locales = { ru, kz, en };

export function AppMain() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('pksk_lang') || 'ru');
  const [isRegistering, setIsRegistering] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toast = useToast();
  const showToast = toast ? toast.showToast : () => {};

  // Использование селекторов для предотвращения Infinite Loops
  const clearChat = useChatStore(s => s.clear);
  const subInbox = useChatStore(s => s.subscribeToInbox);
  const chatMessages = useChatStore(s => s.activeChatMessages);
  const unreadTotal = useChatStore(s => s.unreadTotal);

  const clearRequests = useRequestStore(s => s.clear);
  const subRequests = useRequestStore(s => s.subscribe);
  const requests = useRequestStore(s => s.requests);

  const isFirstLoad = useRef(true);

  const t = useCallback((key) => locales[lang][key] || key, [lang]);
  const toggleLang = () => {
    const next = lang === 'ru' ? 'kz' : lang === 'kz' ? 'en' : 'ru';
    setLang(next);
    localStorage.setItem('pksk_lang', next);
  };

  /**
   * Стабильная функция очистки
   */
  const performGlobalCleanup = useCallback(() => {
    logger.info("app_global_cleanup_stable");
    clearChat();
    clearRequests();
  }, [clearChat, clearRequests]);

  useEffect(() => {
    buildingService.getBuildings().then(setBuildings);
    
    const unsubAuth = authService.onAuth(async (firebaseUser) => {
      // Ставим загрузку только в первый раз или при смене юзера
      if (isFirstLoad.current) setIsLoading(true);

      try {
        if (firebaseUser) {
          const profile = await userService.syncProfile(firebaseUser);
          setUser(profile);
          
          logger.info("app_session_started", { uid: profile.uid });
          
          // Атомарные подписки (Stores v4.0.2 сами защищены от гонок)
          subInbox(profile.uid);
          
          const filters = profile.role === 'resident' 
            ? { residentUid: profile.uid } 
            : { buildingId: profile.buildingId };
            
          subRequests(filters);
        } else {
          setUser(null);
          performGlobalCleanup();
        }
      } catch (err) {
        logger.error("app_auth_lifecycle_fail", { error: err.message });
        performGlobalCleanup();
      } finally {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    });

    return () => {
      unsubAuth();
      performGlobalCleanup();
    };
  }, [subInbox, subRequests, performGlobalCleanup]);

  const handleLogin = (userData) => setUser(userData);
  
  const handleLogout = async () => {
    try {
      performGlobalCleanup();
      setUser(null);
      await authService.logout();
      showToast("Вы вышли");
    } catch (e) {
      logger.error("app_logout_error", { error: e.message });
    }
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, logout: handleLogout }}>
      <I18nContext.Provider value={{ t, lang, toggleLang }}>
        <div className="app-container" style={{ minHeight: '100vh', background: '#0a0e17', color: 'white' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
              <div className="pulse" style={{ width: '40px', height: '40px', background: 'var(--neon-blue)', borderRadius: '50%' }} />
              <p style={{ position: 'absolute', bottom: '20px', color: 'var(--text-dim)', fontSize: '10px' }}>
                Smart PKSK v4.0.2.5-stable (Production Gold)
              </p>
            </div>
          ) : !user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
              {isRegistering ? (
                <RegisterView onRegister={handleLogin} onSwitchToLogin={() => setIsRegistering(false)} buildings={buildings} t={t} />
              ) : (
                <LoginView t={t} lang={lang} toggleLang={toggleLang} onSwitchToRegister={() => setIsRegistering(true)} />
              )}
            </div>
          ) : (
            <MainView 
              user={user} 
              requests={requests} 
              messages={chatMessages} 
              unreadTotal={unreadTotal}
              buildings={buildings} 
              t={t} lang={lang} toggleLang={toggleLang} 
              logout={handleLogout}
              setShowModal={setShowModal}
              refreshBuildings={() => buildingService.getBuildings().then(setBuildings)}
            />
          )}
          {showModal && user && <NewRequestModal user={user} onClose={() => setShowModal(false)} t={t} />}
        </div>
      </I18nContext.Provider>
    </AuthContext.Provider>
  );
}
