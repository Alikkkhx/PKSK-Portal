import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MessageCircle, User, Settings, Info, Plus } from 'lucide-react';
import { ResidentDashboard } from '../features/dashboard/ResidentDashboard';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { ChatView } from '../features/chat/ChatView';
import { ProfileView } from '../features/dashboard/ProfileView';
import { AdminControlCenter } from '../features/management/AdminControlCenter';

export function MainView({ 
  user, requests, setRequests, messages, setMessages, 
  sendMessage, buildings, t, lang, toggleLang, logout, 
  isLoading, setShowModal, loadingHistory, 
  hasMoreMessages, hasMoreRequests, 
  loadMoreMessages, loadMoreRequests 
}) {
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'admin' : 'dashboard');

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass-card" style={{ margin: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--neon-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800 }}>Aqyldy PKSK</h1>
            <p style={{ fontSize: '10px' }}>ЖК {user.buildingName}</p>
          </div>
        </div>
        <button onClick={toggleLang} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '12px' }}>
          {lang.toUpperCase()}
        </button>
      </header>

      {/* Page Content */}
      <div style={{ flex: 1, padding: '16px', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.main key={activeTab}>
            {activeTab === 'dashboard' && (
              <ResidentDashboard 
                t={t} requests={requests} setShowModal={setShowModal} 
                stats={stats} onLoadMore={loadMoreRequests} 
                loadingHistory={loadingHistory} hasMore={hasMoreRequests} 
                isLoading={isLoading} 
              />
            )}
            {activeTab === 'admin' && (
              <AdminDashboard 
                t={t} requests={requests} stats={stats} 
                onLoadMore={loadMoreRequests} loadingHistory={loadingHistory} 
                hasMore={hasMoreRequests} isLoading={isLoading} 
              />
            )}
            {activeTab === 'chat' && (
              <ChatView 
                user={user} buildings={buildings} messages={messages} 
                sendMessage={sendMessage} role={user.role} 
                onLoadMore={loadMoreMessages} loadingHistory={loadingHistory} 
                hasMore={hasMoreMessages} 
              />
            )}
            {activeTab === 'profile' && <ProfileView user={user} />}
            {activeTab === 'servers' && <AdminControlCenter buildings={buildings} />}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <nav className="tab-bar">
        {user.role === 'resident' && (
          <button className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> <span style={{ fontSize: '10px' }}>{t('dashboard')}</span>
          </button>
        )}
        {user.role === 'admin' && (
          <button className={`tab-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <Settings size={20} /> <span style={{ fontSize: '10px' }}>Пульт</span>
          </button>
        )}
        <button className={`tab-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={20} /> <span style={{ fontSize: '10px' }}>Чат</span>
        </button>
        {user.role === 'admin' && (
          <button className={`tab-item ${activeTab === 'servers' ? 'active' : ''}`} onClick={() => setActiveTab('servers')}>
            <Settings size={20} /> <span style={{ fontSize: '10px' }}>Консоль</span>
          </button>
        )}
        <button className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={20} /> <span style={{ fontSize: '10px' }}>{t('profile')}</span>
        </button>
      </nav>
    </div>
  );
}
