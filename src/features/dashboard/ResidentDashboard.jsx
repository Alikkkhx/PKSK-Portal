import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useRequestStore } from '../../store/requestStore';

export function ResidentDashboard({ t, setShowModal }) {
  const { requests, isLoading } = useRequestStore();

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    active: requests.filter(r => r.status === 'progress').length,
    done: requests.filter(r => r.status === 'completed').length
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* QUICK STATS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', padding: '4px' }}>
        <MiniStat icon={<AlertCircle size={14}/>} count={stats.pending} label="Ожидают" color="#ff4b2b" />
        <MiniStat icon={<Clock size={14}/>} count={stats.active} label="В работе" color="var(--neon-blue)" />
        <MiniStat icon={<CheckCircle2 size={14}/>} count={stats.done} label="Выполнено" color="#00d2ff" />
      </div>

      {/* ACTION CARD */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', background: 'var(--accent-gradient)', border: 'none' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Нужна помощь?</h3>
        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '16px' }}>Создайте заявку, и администрация ЖК свяжется с вами в ближайшее время.</p>
        <button 
          onClick={() => setShowModal(true)}
          className="premium-btn" 
          style={{ background: 'white', color: 'black', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Оставить заявку
        </button>
      </div>

      {/* REQUEST LIST */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ marginBottom: '16px', fontWeight: 800 }}>Мои обращения</h4>
        
        {isLoading ? (
          <div className="pulse" style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
            <Info size={30} style={{ margin: 'auto', marginBottom: '10px' }} />
            <p style={{ fontSize: '13px' }}>У вас пока нет активных заявок</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(req => (
              <div 
                key={req.id} 
                style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{req.title}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(req.createdAt?.toDate ? req.createdAt.toDate() : Date.now()).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function MiniStat({ icon, count, label, color }) {
  return (
    <div className="glass-card" style={{ padding: '12px', minWidth: '100px', flex: 1, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color, marginBottom: '4px' }}>
        {icon} <span style={{ fontSize: '18px', fontWeight: 900 }}>{count}</span>
      </div>
      <div style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'rgba(255,75,43,0.1)', color: '#ff4b2b', text: 'Ждет' },
    progress: { bg: 'rgba(0,101,255,0.1)', color: 'var(--neon-blue)', text: 'В работе' },
    completed: { bg: 'rgba(0,210,255,0.1)', color: '#00d2ff', text: 'Готово' }
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', background: s.bg, color: s.color }}>
      {s.text}
    </span>
  );
}
