import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, Filter, User, Calendar 
} from 'lucide-react';
import { useRequestStore } from '../../store/requestStore';

export function AdminDashboard({ t, user }) {
  const { requests, updateStatus, isLoading } = useRequestStore();
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    progress: requests.filter(r => r.status === 'progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  const handleStatusChange = async (reqId, newStatus) => {
    const note = window.prompt("Добавьте комментарий к изменению статуса:");
    if (note !== null) {
      await updateStatus(reqId, newStatus, user.uid, note);
      if (selectedRequest) setSelectedRequest(null);
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={<AlertCircle size={18}/>} label="Новые" count={stats.pending} color="#ff4b2b" />
        <StatCard icon={<Clock size={18}/>} label="В работе" count={stats.progress} color="var(--neon-blue)" />
        <StatCard icon={<CheckCircle2 size={18}/>} label="Завершено" count={stats.completed} color="#00d2ff" />
        <StatCard icon={<BarChart3 size={18}/>} label="Всего" count={stats.total} color="#ffffff" />
      </div>

      {/* TICKET LIST */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Очередь заявок</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
             <Filter size={16} style={{ opacity: 0.5 }} />
             <select 
               value={filter} 
               onChange={(e) => setFilter(e.target.value)}
               style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontSize: '12px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
             >
               <option value="all">Все</option>
               <option value="pending">Новые</option>
               <option value="progress">В работе</option>
               <option value="completed">Архив</option>
             </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }} className="pulse">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Заявок нет</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(req => (
              <div 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--neon-blue)', fontWeight: 800 }}>#{req.id.slice(-4)}</span>
                  <StatusBadge status={req.status} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{req.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} /> {req.residentName} (кв. {req.apartment})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AUDIT LOG MODAL (Simplified) */}
      <AnimatePresence>
        {selectedRequest && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 800 }}>История заявки #{selectedRequest.id.slice(-4)}</h3>
              <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.8 }}>{selectedRequest.description}</p>
              
              <div style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {selectedRequest.statusHistory?.map((log, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-blue)' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{log.status.toUpperCase()}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{new Date(log.updatedAt).toLocaleString()}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>{log.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="premium-btn" onClick={() => handleStatusChange(selectedRequest.id, 'progress')}>В работу</button>
                <button className="premium-btn" onClick={() => handleStatusChange(selectedRequest.id, 'completed')}>Завершить</button>
                <button className="premium-btn" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.05)' }} onClick={() => setSelectedRequest(null)}>Закрыть</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatCard({ icon, label, count, color }) {
  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ color, opacity: 0.8 }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 900, color }}>{count}</div>
      <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'rgba(255,75,43,0.1)', color: '#ff4b2b', text: 'Новая' },
    progress: { bg: 'rgba(0,101,255,0.1)', color: 'var(--neon-blue)', text: 'В работе' },
    completed: { bg: 'rgba(0,210,255,0.1)', color: '#00d2ff', text: 'Выполнено' }
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', background: s.bg, color: s.color, textTransform: 'uppercase' }}>
      {s.text}
    </span>
  );
}
