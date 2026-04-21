import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Info, Clock, CheckCircle2, ChevronRight, User, Settings, Image as ImageIcon, Plus, X, Globe, MapPin, Search } from 'lucide-react';

export function ChatView({ user, buildings, messages, sendMessage, role, onLoadMore, loadingHistory, hasMore }) {
  const [msgInput, setMsgInput] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'resident'
  const [selectedBuilding, setSelectedBuilding] = useState(user.buildingId || (buildings[0]?.id || ''));
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeMessages = role === 'admin' 
    ? messages.filter(m => m.buildingId === selectedBuilding && (m.mode === activeTab))
    : messages;

  const handleSend = () => {
    if (!msgInput.trim()) return;
    sendMessage(msgInput, activeTab, recipientFilter);
    setMsgInput('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="status-dot pulse" />
          <h3 style={{ fontSize: '16px' }}>Чат {role === 'admin' ? '- Управление' : ''}</h3>
        </div>
        {role === 'admin' && (
          <select 
            className="premium-input" 
            style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Tabs for Admin */}
      {role === 'admin' && (
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
          <button 
            style={{ flex: 1, padding: '12px', background: activeTab === 'main' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'main' ? 'var(--neon-blue)' : 'var(--text-dim)', fontSize: '13px' }}
            onClick={() => setActiveTab('main')}
          >
            Общий чат
          </button>
          <button 
            style={{ flex: 1, padding: '12px', background: activeTab === 'resident' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'resident' ? 'var(--neon-blue)' : 'var(--text-dim)', fontSize: '13px' }}
            onClick={() => setActiveTab('resident')}
          >
            Личные (уведомления)
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} ref={scrollRef}>
        {hasMore && activeMessages.length >= 20 && (
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--neon-blue)', fontSize: '12px', padding: '10px', cursor: 'pointer' }}
            onClick={onLoadMore}
            disabled={loadingHistory}
          >
            {loadingHistory ? '...' : '↑ Загрузить историю'}
          </button>
        )}
        {activeMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            <MessageCircle size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>Нет сообщений</p>
          </div>
        )}
        {activeMessages.map((m, i) => (
          <div key={m.id || i} style={{ alignSelf: m.senderRole === role ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', marginLeft: m.senderRole === role ? '0' : '8px', textAlign: m.senderRole === role ? 'right' : 'left' }}>
              {m.senderName} • {m.createdAt?.toDate?.() ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            </div>
            <div style={{ 
              padding: '10px 14px', 
              borderRadius: '16px', 
              background: m.senderRole === role ? 'var(--neon-blue)' : 'rgba(255,255,255,0.08)',
              color: m.senderRole === role ? 'white' : 'var(--text-main)',
              fontSize: '14px',
              border: m.senderRole === role ? 'none' : '1px solid var(--glass-border)'
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
        <input 
          className="premium-input" 
          placeholder="Напишите сообщение..." 
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="premium-btn" style={{ padding: '0 16px' }} onClick={handleSend}>
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
