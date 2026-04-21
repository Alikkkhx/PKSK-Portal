import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Info, CheckCircle2 } from 'lucide-react';
import { SkeletonCard } from '../../components/common/SkeletonCard';

const statusColor = { pending: '#ffab00', progress: '#0065ff', completed: '#36b37e' };
const statusLabel = { pending: 'Ожидание', progress: 'В работе', completed: 'Завершено' };

export function ResidentDashboard({ t, requests, setShowModal, stats, onLoadMore, loadingHistory, hasMore, isLoading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '80px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(0, 101, 255, 0.1), rgba(255, 255, 255, 0.02))' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('stats_total')}</p>
          <p style={{ fontSize: '24px', fontWeight: 800 }}>{stats.total}</p>
        </div>
        <div className="glass-card" style={{ padding: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('stats_pending')}</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neon-blue)' }}>{stats.pending}</p>
        </div>
      </div>

      <button className="premium-btn" style={{ width: '100%', marginBottom: '24px', padding: '16px' }} onClick={() => setShowModal(true)}>
        + {t('new_appeal')}
      </button>

      <h3 style={{ marginBottom: '14px' }}>Ваши заявки</h3>
      {isLoading && requests.length === 0 ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          <Clock size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>Активных заявок пока нет</p>
        </div>
      ) : (
        <>
          {requests.map(req => (
            <div key={req.id} className="glass-card" style={{ padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700 }}>{req.category}</span>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: statusColor[req.status] + '22', color: statusColor[req.status], fontWeight: 700 }}>
                  {statusLabel[req.status]}
                </span>
              </div>
              {req.imageUrl && (
                <div style={{ marginBottom: '12px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <img src={req.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => window.open(req.imageUrl, '_blank')} />
                </div>
              )}
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{req.description}</p>
            </div>
          ))}
          {hasMore && requests.length >= 15 && (
            <button 
              className="premium-btn" 
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', marginTop: '10px' }} 
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
