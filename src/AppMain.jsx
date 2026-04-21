import React, { useState, useEffect } from 'react';
import { firebaseApi } from './service/firebaseApi';
import { useStore } from './store';
import { fcmService } from './service/fcm';
import { useToast } from './components/common/Toast';
import { AuthContext, I18nContext } from './contexts';

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

  const store = useStore();
  const toast = useToast();
  const showToast = toast ? toast.showToast : () => {};

  const { 
    messages, requests, setMessages, setRequests, 
    isLoading, setIsLoading, addOlderMessages, addOlderRequests, 
    historyLoading, setHistoryLoading,
    hasMoreMessages, hasMoreRequests
  } = store;

  const t = (key) => {
    if (!locales[lang]) return key;
    return locales[lang][key] || key;
  };

  const toggleLang = () => {
    const next = lang === 'ru' ? 'kz' : lang === 'kz' ? 'en' : 'ru';
    setLang(next);
    localStorage.setItem('pksk_lang', next);
  };

  useEffect(() => {
    firebaseApi.listenBuildings(setBuildings);
    const unsub = firebaseApi.onAuth(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const email = firebaseUser.email || '';
          const phone = email.includes('@') ? email.split('@')[0] : '';
          
          if (phone) {
            const userData = await firebaseApi.getUser(phone);
            if (userData) {
              setUser({ ...userData, uid: firebaseUser.uid });
              localStorage.setItem('pksk_user', JSON.stringify(userData));
              fcmService.requestPermission(phone);
            } else {
              // If auth exists but no Firestore data, logout to clear state
              firebaseApi.logout();
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem('pksk_user');
        }
      } catch (err) {
        console.error("Auth lifecycle error:", err);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [setIsLoading]);

  useEffect(() => {
    if (!user) return;
    const unsubFCM = fcmService.onForegroundMessage((payload) => {
      showToast(`${payload.notification.title}: ${payload.notification.body}`, 'info');
    });
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const unsubMsgs = firebaseApi.listenMessages(buildingCtx, (data) => setMessages(data), 20);
    const unsubReqs = firebaseApi.listenRequests(buildingCtx, (data) => setRequests(data), 15);
    return () => { unsubMsgs(); unsubReqs(); unsubFCM(); };
  }, [user, setMessages, setRequests, showToast]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pksk_user', JSON.stringify(userData));
  };

  const logout = () => firebaseApi.logout();

  const sendMessage = async (text, role, name, buildingId, mode, recipient) => {
    await firebaseApi.sendMessage({ text, senderRole: role, senderName: name, buildingId, mode, recipientId: recipient });
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0 || historyLoading || !hasMoreMessages) return;
    setHistoryLoading(true);
    const lastDoc = messages[0]._doc;
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const older = await firebaseApi.fetchPreviousMessages(buildingCtx, lastDoc, 20);
    if (older.length > 0) addOlderMessages(older);
    else useStore.setState({ hasMoreMessages: false });
    setHistoryLoading(false);
  };

  const loadMoreRequests = async () => {
    if (requests.length === 0 || historyLoading || !hasMoreRequests) return;
    setHistoryLoading(true);
    const lastDoc = requests[requests.length - 1]._doc;
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const older = await firebaseApi.fetchPreviousRequests(buildingCtx, lastDoc, 15);
    if (older.length > 0) addOlderRequests(older);
    else useStore.setState({ hasMoreRequests: false });
    setHistoryLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, logout }}>
      <I18nContext.Provider value={{ t, lang, toggleLang }}>
        <div className="app-container" style={{ minHeight: '100vh', background: '#0a0e17', color: 'white' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
              <div className="pulse" style={{ width: '40px', height: '40px', background: 'var(--neon-blue)', borderRadius: '50%' }} />
            </div>
          ) : !user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
              {isRegistering ? (
                <RegisterView onRegister={handleLogin} onSwitchToLogin={() => setIsRegistering(false)} buildings={buildings} t={t} />
              ) : (
                <LoginView onLogin={handleLogin} onSwitchToRegister={() => setIsRegistering(true)} t={t} lang={lang} toggleLang={toggleLang} />
              )}
            </div>
          ) : (
            <MainView 
              user={user} requests={requests} setRequests={setRequests} 
              messages={messages} setMessages={setMessages} 
              sendMessage={sendMessage} buildings={buildings} 
              t={t} lang={lang} toggleLang={toggleLang} 
              logout={logout} isLoading={isLoading} 
              setShowModal={setShowModal} loadingHistory={historyLoading}
              hasMoreMessages={hasMoreMessages} hasMoreRequests={hasMoreRequests}
              loadMoreMessages={loadMoreMessages} loadMoreRequests={loadMoreRequests}
            />
          )}
          {showModal && user && <NewRequestModal user={user} onClose={() => setShowModal(false)} t={t} />}
        </div>
      </I18nContext.Provider>
    </AuthContext.Provider>
  );
}
