import React, { useState, useEffect, createContext, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MessageCircle, User, PlusCircle,
  ArrowLeft, Send, Languages, LayoutDashboard,
  ShieldCheck, LogOut, Clock, CheckCircle2,
  Phone, UserPlus, Key, Building2, Server, Eye, EyeOff
} from 'lucide-react'
import { storage } from './service/storage'
import { firebaseApi } from './service/firebaseApi'
import ru from './locales/ru.json'
import kz from './locales/kz.json'
import en from './locales/en.json'

const translations = { ru, kz, en }
const AuthContext = createContext()
const I18nContext = createContext()

export const useAuth = () => useContext(AuthContext)
export const useI18n = () => useContext(I18nContext)

// ==============================================================
// ADMIN CREDENTIALS (можно менять для клиента)
// ==============================================================
const ADMIN_PHONE = '+7 777 777 7777'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_NAME = 'Главный Админ'

// ==============================================================
// APP ROOT
// ==============================================================
function App() {
  const [user, setUser] = useState(storage.getUser())
  const [lang, setLang] = useState(storage.getLanguage() || 'ru')
  const [requests, setRequests] = useState([])
  const [messages, setMessages] = useState([])
  const [buildings, setBuildings] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)

  // Постоянно слушаем список зданий (нужен даже без авторизации — для регистрации)
  useEffect(() => {
    const unsub = firebaseApi.listenBuildings(setBuildings)
    return () => unsub()
  }, [])

  // Подписка на данные после входа
  useEffect(() => {
    if (!user) return
    const buildingCtx = user.role === 'admin' ? 'all' : user.buildingId
    const unsubMsgs = firebaseApi.listenMessages(buildingCtx, setMessages)
    const unsubReqs = firebaseApi.listenRequests(buildingCtx, setRequests)
    return () => { unsubMsgs(); unsubReqs() }
  }, [user])

  const t = (key) => translations[lang]?.[key] || key
  const toggleLang = () => {
    const next = lang === 'ru' ? 'kz' : lang === 'kz' ? 'en' : 'ru'
    setLang(next)
    storage.setLanguage(next)
  }

  const login = (userData) => {
    setUser(userData)
    storage.saveUser(userData)
  }

  const logout = () => {
    setUser(null)
    storage.logout()
  }

  const sendMessage = (text, senderRole, senderName, buildingId) => {
    const msg = {
      id: Date.now(),
      text,
      sender: senderRole,
      username: senderName,
      buildingId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    firebaseApi.sendMessage(msg)
  }

  if (!user) return (
    <I18nContext.Provider value={{ t, lang }}>
      <AnimatePresence mode="wait">
        {isRegistering
          ? <RegisterView key="reg" buildings={buildings} onSwitch={() => setIsRegistering(false)} onRegister={login} />
          : <LoginView key="login" onSwitch={() => setIsRegistering(true)} onLogin={login} toggleLang={toggleLang} lang={lang} />
        }
      </AnimatePresence>
    </I18nContext.Provider>
  )

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <I18nContext.Provider value={{ t, lang, toggleLang }}>
        <MainView
          requests={requests}
          setRequests={setRequests}
          messages={messages}
          sendMessage={sendMessage}
          buildings={buildings}
        />
      </I18nContext.Provider>
    </AuthContext.Provider>
  )
}

// ==============================================================
// LOGIN VIEW
// ==============================================================
function LoginView({ onLogin, onSwitch, toggleLang, lang }) {
  const [phone, setPhone] = useState('+7 ')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (val) => {
    if (!val.startsWith('+7')) val = '+7 ' + val.replace(/\D/g, '')
    setPhone(val)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cleanPhone = phone.replace(/\s/g, '')
      // Admin check
      if (cleanPhone === ADMIN_PHONE.replace(/\s/g, '')) {
        if (password !== ADMIN_PASSWORD) {
          setError('Неверный пароль администратора')
          setLoading(false)
          return
        }
        onLogin({ role: 'admin', phone: ADMIN_PHONE, name: ADMIN_NAME, username: 'admin', buildingId: 'all' })
        return
      }
      // Resident check
      const allUsers = await firebaseApi.getUsers()
      const found = allUsers.find(u => u.phone.replace(/\s/g, '') === cleanPhone)
      if (!found) { setError('Аккаунт не найден. Пройдите регистрацию.'); return }
      if (found.password !== password) { setError('Неверный пароль.'); return }
      onLogin(found)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card login-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', alignItems: 'center' }}>
          <ShieldCheck size={42} color="var(--neon-blue)" />
          <div className="avatar" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 700 }} onClick={toggleLang}>{lang.toUpperCase()}</div>
        </div>

        <h2 style={{ marginBottom: '6px' }}>Вход в систему</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '28px', fontSize: '13px' }}>Smart PKSK Messenger</p>

        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Phone size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="tel" style={{ paddingLeft: '44px' }} value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="+7 700 000 0000" required
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Key size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type={showPwd ? 'text' : 'password'} style={{ paddingLeft: '44px', paddingRight: '44px' }}
              placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required
            />
            <div onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-dim)' }}>
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </div>
          </div>

          {error && <p style={{ color: '#ff5c5c', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="premium-btn" style={{ width: '100%', marginBottom: '14px' }} disabled={loading}>
            {loading ? 'Проверяем...' : 'Авторизоваться'}
          </button>
          <button type="button" onClick={onSwitch} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontSize: '14px', padding: '8px 0' }}>
            Зарегистрировать новый аккаунт
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ==============================================================
// REGISTER VIEW
// ==============================================================
function RegisterView({ onRegister, onSwitch, buildings }) {
  const [formData, setFormData] = useState({ name: '', phone: '+7 ', password: '', buildingId: '', apartment: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.buildingId) { setError('Пожалуйста, выберите ЖК/Дом'); return }
    if (formData.password.length < 6) { setError('Пароль должен быть минимум 6 символов'); return }
    setLoading(true)
    try {
      // Check if phone already exists
      const allUsers = await firebaseApi.getUsers()
      if (allUsers.find(u => u.phone.replace(/\s/g, '') === formData.phone.replace(/\s/g, ''))) {
        setError('Аккаунт с таким номером уже существует')
        return
      }
      const selectedBuilding = buildings.find(b => b.id === formData.buildingId)
      const newUser = { ...formData, role: 'resident', username: formData.name, buildingName: selectedBuilding?.name || '' }
      await firebaseApi.saveUser(newUser)
      onRegister(newUser)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card login-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <UserPlus size={32} color="var(--neon-blue)" />
          <div>
            <h2 style={{ marginBottom: '2px' }}>Регистрация</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Создайте ваш аккаунт жильца</p>
          </div>
        </div>

        <form onSubmit={handleRegister}>
          <input placeholder="ФИО (полностью)" style={{ marginBottom: '12px' }} value={formData.name} onChange={e => update('name', e.target.value)} required />
          <input placeholder="Телефон (+7 700 000 0000)" style={{ marginBottom: '12px' }} type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)} required />

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input type={showPwd ? 'text' : 'password'} placeholder="Придумайте пароль (мин. 6 символов)" style={{ paddingRight: '44px' }} value={formData.password} onChange={e => update('password', e.target.value)} required />
            <div onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-dim)' }}>
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </div>
          </div>

          <select style={{ marginBottom: '12px' }} value={formData.buildingId} onChange={e => update('buildingId', e.target.value)} required>
            <option value="">— Выберите ваш ЖК/Дом —</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <input placeholder="№ Квартиры" style={{ marginBottom: '20px' }} value={formData.apartment} onChange={e => update('apartment', e.target.value)} required />

          {error && <p style={{ color: '#ff5c5c', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="premium-btn" style={{ width: '100%', marginBottom: '12px' }} disabled={loading}>
            {loading ? 'Создаём...' : 'Создать профиль'}
          </button>
          <button type="button" onClick={onSwitch} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px', padding: '8px 0' }}>
            Уже есть аккаунт → Войти
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ==============================================================
// MAIN SHELL
// ==============================================================
function MainView({ requests, setRequests, messages, sendMessage, buildings }) {
  const { user, logout } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'admin' : 'dashboard')
  const [showModal, setShowModal] = useState(false)

  const filteredRequests = user.role === 'admin' ? requests : requests.filter(r => r.buildingId === user.buildingId)
  const filteredMessages = user.role === 'admin' ? messages : messages.filter(m => m.buildingId === user.buildingId)

  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === 'pending').length,
    inProgress: filteredRequests.filter(r => r.status === 'progress').length,
    completed: filteredRequests.filter(r => r.status === 'completed').length
  }

  return (
    <>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ background: user.role === 'admin' ? 'var(--admin-gradient)' : 'var(--accent-gradient)' }}>
            {user.name?.[0] || 'U'}
          </div>
          <div>
            <h4 style={{ fontSize: '14px' }}>{user.name}</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Администратор' : user.buildingName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Languages size={20} style={{ cursor: 'pointer' }} onClick={toggleLang} />
          <LogOut size={20} style={{ cursor: 'pointer' }} onClick={logout} />
        </div>
      </div>

      {/* Page */}
      <AnimatePresence mode="wait">
        <main key={activeTab}>
          {activeTab === 'dashboard' && <ResidentDashboard t={t} requests={filteredRequests} setShowModal={setShowModal} stats={stats} />}
          {activeTab === 'admin' && <AdminDashboard t={t} requests={filteredRequests} stats={stats} />}
          {activeTab === 'chat' && <ChatView messages={filteredMessages} sendMessage={(txt) => sendMessage(txt, user.role, user.name, user.role === 'admin' ? 'all' : user.buildingId)} role={user.role} />}
          {activeTab === 'profile' && <ProfileView user={user} />}
          {activeTab === 'servers' && <AdminControlCenter buildings={buildings} />}
        </main>
      </AnimatePresence>

      {/* Tab Bar */}
      <div className="tab-bar">
        {user.role === 'admin' ? (
          <>
            <div className={`tab-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <LayoutDashboard size={24} /><span>Главная</span>
            </div>
            <div className={`tab-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={() => setActiveTab('servers')}>
              <Server size={24} /><span>Сервера</span>
            </div>
          </>
        ) : (
          <div className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Home size={24} /><span>Главная</span>
          </div>
        )}
        <div className={`tab-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={24} /><span>Чат</span>
        </div>
        <div className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={24} /><span>Профиль</span>
        </div>
      </div>

      {/* New Request Modal */}
      <AnimatePresence>
        {showModal && (
          <NewRequestModal
            onClose={() => setShowModal(false)}
            onSubmit={(req) => {
              const newReq = { ...req, buildingId: user.buildingId, buildingName: user.buildingName, residentName: user.name, phone: user.phone }
              firebaseApi.saveRequest(newReq)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ==============================================================
// RESIDENT DASHBOARD
// ==============================================================
function ResidentDashboard({ t, requests, setShowModal, stats }) {
  const statusLabel = { pending: 'В ожидании', progress: 'В работе', completed: 'Завершено' }
  const statusColor = { pending: '#ffab00', progress: 'var(--neon-blue)', completed: '#36b37e' }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', background: 'var(--accent-gradient)', color: 'white' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Сервис ПКСК</h3>
        <p style={{ fontSize: '13px', opacity: 0.85 }}>Прямая связь с управляющей компанией</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <button className="premium-btn" style={{ height: '110px', flexDirection: 'column', gap: '10px' }} onClick={() => setShowModal(true)}>
          <PlusCircle size={30} />
          <span style={{ fontSize: '13px' }}>Новая заявка</span>
        </button>
        <div className="glass-card stats-card">
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Активные</span>
          <span className="stats-value">{stats.pending + stats.inProgress}</span>
        </div>
      </div>

      <h3 style={{ marginBottom: '14px' }}>Ваши заявки</h3>
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <Clock size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>Активных заявок пока нет</p>
        </div>
      ) : (
        requests.map(req => (
          <div key={req.id} className="glass-card" style={{ padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700 }}>{req.category}</span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: statusColor[req.status] + '22', color: statusColor[req.status], fontWeight: 700 }}>
                {statusLabel[req.status]}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{req.description}</p>
          </div>
        ))
      )}
    </motion.div>
  )
}

// ==============================================================
// ADMIN DASHBOARD
// ==============================================================
function AdminDashboard({ t, requests, stats }) {
  const statusLabel = { pending: 'В ожидании', progress: 'В работе', completed: 'Завершено' }
  const statusColor = { pending: '#ffab00', progress: 'var(--neon-blue)', completed: '#36b37e' }

  const updateStatus = (id, newStatus) => {
    firebaseApi.updateRequestStatus(id, newStatus)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 style={{ marginBottom: '20px' }}>Панель управления</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[['Всего', stats.total, 'var(--text-primary)'], ['Активно', stats.pending, '#ffab00'], ['Готово', stats.completed, '#36b37e']].map(([label, val, color]) => (
          <div key={label} className="glass-card stats-card">
            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</span>
            <span className="stats-value" style={{ fontSize: '22px', ...(color !== 'var(--text-primary)' ? { background: 'none', WebkitTextFillColor: color } : {}) }}>{val}</span>
          </div>
        ))}
      </div>

      <h4 style={{ marginBottom: '12px' }}>Очередь заявок</h4>
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <CheckCircle2 size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>Заявок нет</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
          {requests.map((req, i) => (
            <div key={req.id} style={{ padding: '16px', borderBottom: i < requests.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{req.category}</span>
                  <p style={{ fontSize: '11px', color: 'var(--neon-blue)', marginTop: '2px' }}>{req.buildingName} {req.residentName ? `• ${req.residentName}` : ''}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: statusColor[req.status] + '22', color: statusColor[req.status], fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {statusLabel[req.status]}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>{req.description}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {req.status !== 'progress' && <button className="premium-btn" style={{ padding: '5px 14px', fontSize: '11px' }} onClick={() => updateStatus(req.id, 'progress')}>В работу</button>}
                {req.status !== 'completed' && <button className="premium-btn" style={{ padding: '5px 14px', fontSize: '11px', background: '#36b37e' }} onClick={() => updateStatus(req.id, 'completed')}>Завершить</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ==============================================================
// CHAT VIEW
// ==============================================================
function ChatView({ messages, sendMessage, role }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
    setText('')
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 168px)' }}>
      <h2 style={{ marginBottom: '14px' }}>Мессенджер</h2>
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>Начните переписку с администрацией</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ alignSelf: m.sender === role ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: m.sender === role ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding: '11px 16px', background: m.sender === role ? 'var(--accent-gradient)' : 'var(--bg-secondary)', borderRadius: m.sender === role ? '20px 20px 4px 20px' : '20px 20px 20px 4px', border: m.sender === role ? 'none' : '1px solid var(--glass-border)', boxShadow: '0 3px 12px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '10px', opacity: 0.75, display: 'block', marginBottom: '3px', fontWeight: 700 }}>{m.username}</span>
                <p style={{ fontSize: '14px', lineHeight: '1.45' }}>{m.text}</p>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '3px' }}>{m.timestamp}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
          <input
            type="text" placeholder="Написать сообщение..." value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button className="premium-btn" style={{ padding: '0 18px', flexShrink: 0 }} onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ==============================================================
// ADMIN CONTROL CENTER (SERVERS)
// ==============================================================
function AdminControlCenter({ buildings }) {
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' })
  const [loading, setLoading] = useState(false)

  const addBuilding = async () => {
    if (!newBuilding.name.trim()) return
    setLoading(true)
    const b = { id: Date.now().toString(), name: newBuilding.name.trim(), address: newBuilding.address.trim() }
    await firebaseApi.saveBuilding(b)
    setNewBuilding({ name: '', address: '' })
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: '20px' }}>Управление Серверами (ЖК)</h2>
      <div className="glass-card" style={{ padding: '22px', marginBottom: '22px' }}>
        <h4 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} /> Создать новый ЖК
        </h4>
        <input placeholder="Название (например: ЖК «Орбита»)" style={{ marginBottom: '10px' }} value={newBuilding.name} onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })} />
        <input placeholder="Основной адрес" style={{ marginBottom: '16px' }} value={newBuilding.address} onChange={e => setNewBuilding({ ...newBuilding, address: e.target.value })} />
        <button className="premium-btn admin" style={{ width: '100%' }} onClick={addBuilding} disabled={loading}>
          {loading ? 'Создаётся...' : 'Запустить сервер'}
        </button>
      </div>

      <h3 style={{ marginBottom: '14px' }}>Действующие серверы ({buildings.length})</h3>
      {buildings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <Server size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p>Серверов пока нет. Создайте первый ЖК!</p>
        </div>
      ) : buildings.map(b => (
        <div key={b.id} className="glass-card" style={{ padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700 }}>{b.name}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#36b37e', fontSize: '12px', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#36b37e', animation: 'pulse 2s infinite' }} />ONLINE
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ==============================================================
// PROFILE VIEW
// ==============================================================
function ProfileView({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ marginBottom: '20px' }}>Мой профиль</h2>
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center', marginBottom: '20px' }}>
        <div className="avatar" style={{ width: '90px', height: '90px', fontSize: '34px', margin: '0 auto 16px' }}>
          {user.name?.[0] || 'U'}
        </div>
        <h3 style={{ marginBottom: '4px' }}>{user.name}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{user.phone}</p>
      </div>
      <div className="glass-card" style={{ padding: '20px' }}>
        {[
          ['Роль', user.role === 'admin' ? 'Администратор' : 'Житель'],
          ['Привязанный дом', user.buildingName || (user.role === 'admin' ? 'Все серверы' : '-')],
          ['Квартира', user.apartment || '-'],
        ].map(([label, value]) => (
          <div key={label} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{label}</label>
            <p style={{ fontWeight: 600 }}>{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ==============================================================
// NEW REQUEST MODAL
// ==============================================================
function NewRequestModal({ onClose, onSubmit }) {
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('Сантехника')
  const categories = ['Сантехника', 'Электрика', 'Лифт', 'Уборка мест общего пользования', 'Отопление', 'Другое']

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '24px', display: 'flex', alignItems: 'center' }}
    >
      <div className="glass-card" style={{ width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
          <h2 style={{ marginLeft: '12px' }}>Новая заявка</h2>
        </div>
        <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Категория</label>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ marginTop: '8px', marginBottom: '18px' }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Описание проблемы</label>
        <textarea rows="4" style={{ marginTop: '8px', marginBottom: '20px' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Опишите проблему подробно..." />
        <button className="premium-btn" style={{ width: '100%' }} onClick={() => {
          if (!desc.trim()) return alert('Пожалуйста, опишите проблему')
          onSubmit({ id: Date.now(), category: cat, description: desc, status: 'pending', date: new Date().toISOString() })
          onClose()
        }}>
          Отправить заявку
        </button>
      </div>
    </motion.div>
  )
}

export default App
