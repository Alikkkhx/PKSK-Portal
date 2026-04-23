import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, ChevronRight, User, Group, 
  MessageCircle, Info, Clock, CheckCheck 
} from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../service/api/chatService';

export function ChatView({ user, buildings, role }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  
  // Enterprise Optimization: Точечные селекторы для исключения лишних ререндеров
  const inbox = useChatStore(s => s.inbox);
  const activeChatMessages = useChatStore(s => s.activeChatMessages);
  const sendMessage = useChatStore(s => s.sendMessage);
  const subscribeToChat = useChatStore(s => s.subscribeToChat);

  // Авто-скролл при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatMessages]);

  const handleStartChat = async () => {
    if (!user.buildingId) {
      alert("Ошибка: У вашего профиля не привязано здание.");
      return;
    }
    const admin = await chatService.findBuildingAdmin(user.buildingId);
    if (!admin) {
      alert("Администрация вашего ЖК еще не подключена к системе чатов.");
      return;
    }
    await handleSelectChat(admin);
  };

  const handleSelectChat = async (targetUser) => {
    const chatId = chatService.getPrivateChatId(user.uid, targetUser.uid);
    const participants = [user.uid, targetUser.uid];
    
    // Создаем чат в базе, если его еще нет
    await chatService.getOrCreateChat(chatId, participants, {
      buildingId: user.buildingId,
      type: 'private'
    });

    setSelectedChat({ id: chatId, title: targetUser.name, participants });
    subscribeToChat(user.uid, chatId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedChat) return;
    
    await sendMessage(selectedChat.id, user.uid, text, selectedChat.participants);
    setText('');
  };

  return (
    <div className="glass-card" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedChat && (
            <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)' }}>
              <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
            {selectedChat ? selectedChat.title : 'Мессенджер Pro'}
          </h3>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* INBOX / CONTACTS LIST (If no chat selected) */}
        {!selectedChat && (
          <div style={{ width: '100%', overflowY: 'auto' }}>
            {inbox.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                <MessageCircle size={40} style={{ margin: 'auto', marginBottom: '10px' }} />
                <p>Нет активных диалогов</p>
                {role === 'resident' && (
                  <button 
                    className="premium-btn" 
                    style={{ marginTop: '20px', padding: '10px 20px' }}
                    onClick={handleStartChat}
                  >
                    Написать в ПКСК
                  </button>
                )}
              </div>
            ) : (
              inbox.map(chat => (
                <div 
                  key={chat.chatId} 
                  onClick={() => handleSelectChat({ uid: 'partner_uid', name: 'Собеседник' })} // Здесь должна быть логика поиска партнера
                  style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Диалог</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>Нажмите, чтобы открыть</div>
                    </div>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div style={{ background: '#ff4b2b', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '10px', height: '18px', fontWeight: 800 }}>
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* MESSAGES VIEW */}
        {selectedChat && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div ref={scrollRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeChatMessages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.senderId === user.uid ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'}`} 
                       style={{ padding: '10px 14px', borderRadius: '18px', background: msg.senderId === user.uid ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '14px' }}>{msg.text}</div>
                    <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.6 }}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      {msg.senderId === user.uid && <CheckCheck size={10} style={{ marginLeft: '4px' }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT */}
            <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
              <input 
                className="premium-input" 
                placeholder="Сообщение..." 
                value={text} 
                onChange={e => setText(e.target.value)} 
              />
              <button className="premium-btn" style={{ padding: '10px' }}><Send size={18} /></button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
