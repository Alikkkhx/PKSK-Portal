import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  MessageCircle, 
  User, 
  PlusCircle, 
  Megaphone, 
  ArrowLeft,
  Send,
  Camera,
  Languages,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserPlus,
  Key,
  ShieldPlus,
  Building2,
  Server
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

function App() {
  const [user, setUser] = useState(storage.getUser())
  const [lang, setLang] = useState(storage.getLanguage() || 'ru')
  const [requests, setRequests] = useState([])
  const [profile, setProfile] = useState(storage.getProfile())
  const [messages, setMessages] = useState([])
  const [buildings, setBuildings] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    // Слушаем список зданий даже без авторизации (для регистрации)
    const unsubBuildings = firebaseApi.listenBuildings(setBuildings)
    return () => unsubBuildings()
  }, [])

  useEffect(() => {
    if (!user) return
    const buildingContext = user.role === 'admin' ? 'all' : user.buildingId
    
    const unsubMsgs = firebaseApi.listenMessages(buildingContext, setMessages)
    const unsubReqs = firebaseApi.listenRequests(buildingContext, setRequests)
    
    return () => {
      unsubMsgs()
      unsubReqs()
    }
  }, [user])

  const t = (key) => translations[lang][key] || key

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
    const newMessage = {
      id: Date.now(),
      text,
      sender: senderRole,
      username: senderName,
      buildingId: buildingId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    firebaseApi.sendMessage(newMessage)
  }

  if (!user) return (
    <I18nContext.Provider value={{ t, lang }}>
      <AnimatePresence mode="wait">
        {isRegistering ? (
          <RegisterView key="register" buildings={buildings} onSwitch={() => setIsRegistering(false)} onRegister={login} />
        ) : (
          <LoginView key="login" onSwitch={() => setIsRegistering(true)} onLogin={login} toggleLang={toggleLang} />
        )}
      </AnimatePresence>
    </I18nContext.Provider>
  )

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <I18nContext.Provider value={{ t, lang, toggleLang }}>
        <MainView 
          requests={requests} 
          setRequests={setRequests} 
          profile={profile} 
          setProfile={setProfile} 
          messages={messages} 
          sendMessage={sendMessage} 
          buildings={buildings}
          setBuildings={setBuildings}
        />
      </I18nContext.Provider>
    </AuthContext.Provider>
  )
}

function LoginView({ onLogin, onSwitch, toggleLang }) {
  const { t, lang } = useI18n()
  const [phone, setPhone] = useState('+7 ')
  const [password, setPassword] = useState('')

  const handlePhoneChange = (val) => {
    if (!val.startsWith('+7')) {
      setPhone('+7 ' + val.replace(/\D/g, ''))
    } else {
      setPhone(val)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (phone === '+7 777 777 7777') {
      onLogin({ role: 'admin', username: 'admin', phone, name: 'Главный Админ', buildingId: 'all' })
    } else {
      const allUsers = await firebaseApi.getUsers()
      const found = allUsers.find(u => u.phone.replace(/\s/g, '') === phone.replace(/\s/g, ''))
      if (found) onLogin(found)
      else alert('Пользователь не найден. Пожалуйста, пройдите регистрацию.')
    }
  }

  return (
    <div className="login-container">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card login-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <ShieldCheck size={40} color="var(--neon-blue)" />
          <div className="avatar" style={{ cursor: 'pointer' }} onClick={toggleLang}>{lang.toUpperCase()}</div>
        </div>
        
        <h2 style={{ marginBottom: '8px' }}>Вход в систему</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '14px' }}>Smart PKSK Messenger</p>

        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              style={{ paddingLeft: '44px' }}
              value={phone} 
              onChange={e => handlePhoneChange(e.target.value)} 
              placeholder="+7 700 000 0000"
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <Key size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="password" 
              style={{ paddingLeft: '44px' }}
              placeholder="Пароль" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="premium-btn" style={{ width: '100%', marginBottom: '16px' }}>Авторизоваться</button>
          <button type="button" onClick={onSwitch} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontSize: '14px' }}>
            Зарегистрировать новый аккаунт
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function RegisterView({ onRegister, onSwitch, buildings }) {
  const [formData, setFormData] = useState({ name: '', phone: '+7 ', buildingId: '', apartment: '' })

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!formData.buildingId) return alert('Пожалуйста, выберите ЖК/Дом')
    const selectedBuilding = buildings.find(b => b.id === formData.buildingId)
    const newUser = { ...formData, role: 'resident', username: formData.name, buildingName: selectedBuilding?.name }
    await firebaseApi.saveUser(newUser)
    onLogin(newUser)
  }

  return (
    <div className="login-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card login-box">
        <h2 style={{ marginBottom: '8px' }}>Регистрация</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px', fontSize: '14px' }}>Выбор дома и личные данные</p>

        <form onSubmit={handleRegister}>
          <input 
            placeholder="ФИО" 
            style={{ marginBottom: '12px' }} 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            placeholder="Телефон (+7...)" 
            style={{ marginBottom: '12px' }} 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})}
            required
          />
          <select 
            style={{ marginBottom: '12px' }} 
            value={formData.buildingId} 
            onChange={e => setFormData({...formData, buildingId: e.target.value})}
            required
          >
            <option value="">Выберите ЖК/Дом</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input 
            placeholder="№ Квартиры" 
            style={{ marginBottom: '24px' }} 
            value={formData.apartment} 
            onChange={e => setFormData({...formData, apartment: e.target.value})}
            required
          />
          <button type="submit" className="premium-btn" style={{ width: '100%', marginBottom: '16px' }}>Создать профиль</button>
          <button type="button" onClick={onSwitch} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '14px' }}>
            У меня уже есть аккаунт
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function MainView({ requests, setRequests, profile, setProfile, messages, sendMessage, buildings, setBuildings }) {
  const { user, logout } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'admin' : 'dashboard')
  const [showModal, setShowModal] = useState(false)

  // Filter requests by building
  const filteredRequests = user.role === 'admin' ? requests : requests.filter(r => r.buildingId === user.buildingId)
  const filteredMessages = user.role === 'admin' ? messages : messages.filter(m => m.buildingId === user.buildingId)

  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === 'pending').length,
    completed: filteredRequests.filter(r => r.status === 'completed').length
  }

  return (
    <>
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
        <div style={{ display: 'flex', gap: '15px' }}>
          <Languages size={20} style={{ cursor: 'pointer' }} onClick={toggleLang} />
          <LogOut size={20} style={{ cursor: 'pointer' }} onClick={logout} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <main key={activeTab}>
          {activeTab === 'dashboard' && <ResidentDashboard t={t} requests={filteredRequests} setShowModal={setShowModal} stats={stats} />}
          {activeTab === 'admin' && <AdminDashboard t={t} requests={filteredRequests} stats={stats} setRequests={setRequests} messages={filteredMessages} sendMessage={(txt) => sendMessage(txt, 'admin', user.name, 'all')} />}
          {activeTab === 'chat' && <ChatView t={t} messages={filteredMessages} sendMessage={(txt) => sendMessage(txt, user.role, user.name, user.buildingId)} role={user.role} />}
          {activeTab === 'profile' && <ProfileView t={t} user={user} />}
          {activeTab === 'staff' && <AdminControlCenter t={t} buildings={buildings} setBuildings={setBuildings} />}
        </main>
      </AnimatePresence>

      <div className="tab-bar">
        {user.role === 'admin' ? (
          <>
            <div className={`tab-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <LayoutDashboard size={24} />
              <span>Главная</span>
            </div>
            <div className={`tab-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
              <Server size={24} />
              <span>Сервера</span>
            </div>
          </>
        ) : (
          <div className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Home size={24} />
            <span>Главная</span>
          </div>
        )}
        <div className={`tab-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={24} />
          <span>Мессенджер</span>
        </div>
        <div className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={24} />
          <span>Профиль</span>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <NewRequestModal t={t} onClose={() => setShowModal(false)} onSubmit={(req) => {
          const newReq = { ...req, buildingId: user.buildingId, buildingName: user.buildingName }
          firebaseApi.saveRequest(newReq)
        }} />}
      </AnimatePresence>
    </>
  )
}

function ResidentDashboard({ t, requests, setShowModal, stats }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'var(--accent-gradient)', color: 'white' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Сервис ПКСК</h3>
        <p style={{ fontSize: '13px', opacity: 0.8 }}>Прямая связь с вашим домом</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <button className="premium-btn" style={{ height: '120px', flexDirection: 'column' }} onClick={() => setShowModal(true)}>
          <PlusCircle size={32} />
          Новая заявка
        </button>
        <div className="glass-card stats-card">
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>В работе</span>
          <span className="stats-value">{stats.pending}</span>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Ваши обращения</h3>
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <Clock size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>Активных заявок пока нет</p>
        </div>
      ) : (
        requests.map(req => (
          <div key={req.id} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700 }}>{req.category}</span>
              <span className={`badge badge-${req.status}`}>{translations['ru']['status_'+req.status]}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>{req.description}</p>
          </div>
        ))
      )}
    </motion.div>
  )
}

function AdminDashboard({ t, requests, stats, setRequests, messages, sendMessage }) {
  const updateStatus = (id, newStatus) => {
    firebaseApi.updateRequestStatus(id, newStatus)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h2 style={{ marginBottom: '20px' }}>Общая панель</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="glass-card stats-card">
          <span style={{ fontSize: '10px' }}>Всего</span>
          <span className="stats-value" style={{ fontSize: '20px' }}>{stats.total}</span>
        </div>
        <div className="glass-card stats-card">
          <span style={{ fontSize: '10px' }}>Активно</span>
          <span className="stats-value" style={{ fontSize: '20px', color: '#ffab00', background: 'none', WebkitTextFillColor: 'unset' }}>{stats.pending}</span>
        </div>
        <div className="glass-card stats-card">
          <span style={{ fontSize: '10px' }}>Готово</span>
          <span className="stats-value" style={{ fontSize: '20px', color: '#36b37e', background: 'none', WebkitTextFillColor: 'unset' }}>{stats.completed}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
          <h4>Очередь по ЖК</h4>
        </div>
        {requests.map(req => (
          <div key={req.id} style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{req.category}</span>
                <p style={{ fontSize: '10px', color: 'var(--neon-blue)' }}>{req.buildingName}</p>
              </div>
              <span className={`badge badge-${req.status}`}>{translations['ru']['status_'+req.status]}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '12px' }}>{req.description}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="premium-btn" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => updateStatus(req.id, 'progress')}>В работу</button>
              <button className="premium-btn" style={{ padding: '6px 12px', fontSize: '11px', background: '#36b37e' }} onClick={() => updateStatus(req.id, 'completed')}>Завершить</button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ChatView({ t, messages, sendMessage, role }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text)
    setText('')
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 165px)' }}>
      <h2 style={{ marginBottom: '16px' }}>Мессенджер</h2>
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(m => (
            <div key={m.id} style={{ 
              alignSelf: m.sender === role ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === role ? 'flex-end' : 'flex-start'
            }}>
              <div className="glass-card" style={{ 
                padding: '12px 16px', 
                background: m.sender === role ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                borderRadius: m.sender === role ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                border: m.sender === role ? 'none' : '1px solid var(--glass-border)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginBottom: '4px', fontWeight: 800 }}>
                   {m.username}
                </span>
                <p style={{ fontSize: '14px', lineHeight: '1.4' }}>{m.text}</p>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px' }}>{m.timestamp}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Спросить админа..." 
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="premium-btn" style={{ padding: '12px' }} onClick={handleSend}><Send size={20} /></button>
        </div>
      </div>
    </motion.div>
  )
}

function AdminControlCenter({ t, buildings, setBuildings }) {
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' })

  const addBuilding = () => {
    if (!newBuilding.name) return
    const b = { id: Date.now().toString(), ...newBuilding }
    firebaseApi.saveBuilding(b)
    setNewBuilding({ name: '', address: '' })
    alert('Сервер ЖК создан!')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: '20px' }}>Управление Серверами (ЖК)</h2>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>Создать новый сервер для ЖК</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Название ЖК (например: ЖК 'Алма-Ата')" value={newBuilding.name} onChange={e => setNewBuilding({...newBuilding, name: e.target.value})} />
          <input placeholder="Основной адрес" value={newBuilding.address} onChange={e => setNewBuilding({...newBuilding, address: e.target.value})} />
        </div>
        <button className="premium-btn admin" style={{ width: '100%', marginTop: '16px' }} onClick={addBuilding}>Запустить сервер</button>
      </div>

      <h3>Действующие серверы</h3>
      <div style={{ marginTop: '16px' }}>
        {buildings.map(b => (
          <div key={b.id} className="glass-card" style={{ padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{b.name}</p>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.address}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#36b37e', fontSize: '12px', fontWeight: 700 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#36b37e' }}></div>
              ONLINE
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ProfileView({ t, user }) {
  return (
    <motion.div initial={{ opacity: 0 }}>
      <h2 style={{ marginBottom: '20px' }}>Мой профиль</h2>
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '36px', margin: '0 auto 20px auto' }}>
          {user.name?.[0]}
        </div>
        <h3>{user.name}</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>{user.phone}</p>
        
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Привязанный дом</label>
            <p>{user.buildingName || 'Все серверы (Админ)'}</p>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Квартира</label>
            <p>{user.apartment || '-'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function NewRequestModal({ t, onClose, onSubmit }) {
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('Сантехника')

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '24px', display: 'flex', alignItems: 'center' }}
    >
      <div className="glass-card" style={{ width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={24} onClick={onClose} />
          <h2 style={{ marginLeft: '12px' }}>Новая заявка</h2>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Категория</label>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ marginTop: '8px' }}>
            <option>Сантехника</option>
            <option>Электрика</option>
            <option>Уборка</option>
            <option>Лифт</option>
          </select>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label>Описание проблемы</label>
          <textarea rows="4" style={{ marginTop: '8px' }} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <button className="premium-btn" style={{ width: '100%' }} onClick={() => {
          const newReq = { id: Date.now(), category: cat, description: desc, status: 'pending', date: new Date().toISOString() }
          onSubmit(newReq)
          onClose()
        }}>
          Отправить мастеру
        </button>
      </div>
    </motion.div>
  )
}

export default App
