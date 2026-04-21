import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { firebaseApi } from '../../service/firebaseApi';

const statusColor = { pending: '#ffab00', progress: '#0065ff', completed: '#36b37e' };
const statusLabel = { pending: 'Ожидание', progress: 'В работе', completed: 'Завершено' };

export function AdminDashboard({ t, requests, stats, onLoadMore, loadingHistory, hasMore, isLoading }) {
  const updateStatus = async (id, status) => {
    await firebaseApi.updateRequestStatus(id, status);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{t('stats_pending')}</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: statusColor.pending }}>{stats.pending}</p>
        </div>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>В работе</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: statusColor.progress }}>{stats.inProgress}</p>
        </div>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{t('stats_completed')}</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: statusColor.completed }}>{stats.completed}</p>
        </div>
      </div>

      <h4 style={{ marginBottom: '12px' }}>Очередь заявок</h4>
      {isLoading && requests.length === 0 ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <CheckCircle2 size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>Заявок нет</p>
        </div>
      ) : (
        <>
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
                
                {req.imageUrl && (
                  <div style={{ marginBottom: '10px', height: '100px', width: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                    <img src={req.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => window.open(req.imageUrl, '_blank')} />
                  </div>
                )}
                
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>{req.description}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {req.status !== 'progress' && <button className="premium-btn" style={{ padding: '5px 14px', fontSize: '11px' }} onClick={() => updateStatus(req.id, 'progress')}>В работу</button>}
                  {req.status !== 'completed' && <button className="premium-btn" style={{ padding: '5px 14px', fontSize: '11px', background: '#36b37e' }} onClick={() => updateStatus(req.id, 'completed')}>Завершить</button>}
                </div>
              </div>
            ))}
          </div>
          {hasMore && requests.length >= 15 && (
            <button 
              className="premium-btn" 
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', marginBottom: '20px' }} 
              onClick={onLoadMore} 
              disabled={loadingHistory}
            >
              {loadingHistory ? '...' : t('load_more')}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
