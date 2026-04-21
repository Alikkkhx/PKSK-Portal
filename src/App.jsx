import React, { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

// API & Service
import { firebaseApi } from './service/firebaseApi';
import { useStore } from './store';

// Layouts & Views
import { MainView } from './layouts/MainView';
import { LoginView } from './features/auth/LoginView';
import { RegisterView } from './features/auth/RegisterView';

// Locales
import ru from './locales/ru.json';
import kz from './locales/kz.json';
import en from './locales/en.json';

const locales = { ru, kz, en };

// --- CONTEXTS ---
const AuthContext = createContext();
const I18nContext = createContext();

export const useAuth = () => useContext(AuthContext);
export const useI18n = () => useContext(I18nContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('pksk_lang') || 'ru');
  const [isRegistering, setIsRegistering] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const { 
    messages, requests, setMessages, setRequests, 
    isLoading, addOlderMessages, addOlderRequests, 
    historyLoading, setHistoryLoading,
    hasMoreMessages, hasMoreRequests
  } = useStore();

  const t = (key) => locales[lang][key] || key;
  const toggleLang = () => {
    const next = lang === 'ru' ? 'kz' : lang === 'kz' ? 'en' : 'ru';
    setLang(next);
    localStorage.setItem('pksk_lang', next);
  };

  // Initial load & Auth Listener
  useEffect(() => {
    firebaseApi.getBuildings().then(setBuildings);
    
    // Professional session management
    const unsub = firebaseApi.onAuth(async (firebaseUser) => {
      if (firebaseUser) {
        // Map internal phone back from email if needed, or just fetch doc
        const phone = firebaseUser.email.split('@')[0];
        const userData = await firebaseApi.getUser(phone);
        if (userData) {
          setUser({ ...userData, uid: firebaseUser.uid });
          localStorage.setItem('pksk_user', JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem('pksk_user');
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Real-time data listeners (independent of Auth listener, but depends on user state)
  useEffect(() => {
    if (!user) return;
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const unsubMsgs = firebaseApi.listenMessages(buildingCtx, (data) => setMessages(data), 20);
    const unsubReqs = firebaseApi.listenRequests(buildingCtx, (data) => setRequests(data), 15);
    return () => { unsubMsgs(); unsubReqs(); };
  }, [user, setMessages, setRequests]);

  const logout = () => {
    firebaseApi.logout();
  };

  const sendMessage = async (text, role, name, buildingId, mode, recipient) => {
    await firebaseApi.sendMessage({ text, senderRole: role, senderName: name, buildingId, mode, recipientId: recipient });
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0 || historyLoading || !hasMoreMessages) return;
    setHistoryLoading(true);
    const lastDoc = messages[0]._doc;
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const older = await firebaseApi.fetchPreviousMessages(buildingCtx, lastDoc, 20);
    if (older.length > 0) {
      addOlderMessages(older);
    } else {
      useStore.setState({ hasMoreMessages: false });
    }
    setHistoryLoading(false);
  };

  const loadMoreRequests = async () => {
    if (requests.length === 0 || historyLoading || !hasMoreRequests) return;
    setHistoryLoading(true);
    const lastDoc = requests[requests.length - 1]._doc;
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId;
    const older = await firebaseApi.fetchPreviousRequests(buildingCtx, lastDoc, 15);
    if (older.length > 0) {
      addOlderRequests(older);
    } else {
      useStore.setState({ hasMoreRequests: false });
    }
    setHistoryLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, logout }}>
      <I18nContext.Provider value={{ t, lang, toggleLang }}>
        <div className="app-container">
          <AnimatePresence mode="wait">
            {!user ? (
              <div key="auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
                {isRegistering ? (
                  <RegisterView onRegister={handleLogin} onSwitchToLogin={() => setIsRegistering(false)} buildings={buildings} t={t} />
                ) : (
                  <LoginView onLogin={handleLogin} onSwitchToRegister={() => setIsRegistering(true)} t={t} lang={lang} toggleLang={toggleLang} />
                )}
              </div>
            ) : (
              <MainView 
                key="main" 
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
          </AnimatePresence>
          {showModal && <NewRequestModal user={user} onClose={() => setShowModal(false)} t={t} />}
        </div>
      </I18nContext.Provider>
    </AuthContext.Provider>
  );
}

// Internal Modal for now (can be separated too)
function NewRequestModal({ user, onClose, t }) {
  const [formData, setFormData] = useState({ category: 'ЖКХ / Тех. обслуживание', description: '', buildingId: user.buildingId, buildingName: user.buildingName, residentName: user.name });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = '';
    if (image) imageUrl = await firebaseApi.uploadImage(image);
    await firebaseApi.saveRequest({ ...formData, imageUrl, status: 'pending' });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>{t('new_appeal')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <select className="premium-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>ЖКХ / Тех. обслуживание</option>
            <option>Лифт</option>
            <option>Сантехника</option>
            <option>Электрика</option>
            <option>Уборка</option>
            <option>Прочее</option>
          </select>
          <textarea className="premium-input" style={{ minHeight: '100px' }} placeholder={t('description')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="glass-card" style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ImageIcon size={18} />
              <span style={{ fontSize: '12px' }}>{image ? 'Фото выбрано' : 'Добавить фото'}</span>
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setImage(e.target.files[0])} />
            </label>
            {image && <button type="button" onClick={() => setImage(null)} style={{ background: 'none', border: 'none', color: '#ff4757' }}><X size={18} /></button>}
          </div>
          <button className="premium-btn" style={{ padding: '16px' }} disabled={loading}>{loading ? '...' : t('send')}</button>
        </form>
      </motion.div>
    </div>
  );
}
