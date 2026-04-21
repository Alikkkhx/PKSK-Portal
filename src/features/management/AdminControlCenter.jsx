import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Globe, CheckCircle2 } from 'lucide-react';

export function AdminControlCenter({ buildings }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '80px' }}>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Settings size={18} color="var(--neon-blue)" /> Инфраструктура
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="premium-btn" style={{ padding: '12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
            <Plus size={14} style={{ marginBottom: '4px' }} /> <br/> Новое ЖК
          </button>
          <button className="premium-btn" style={{ padding: '12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
            <Globe size={14} style={{ marginBottom: '4px' }} /> <br/> Рассылка
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ marginBottom: '12px' }}>Список ЖК ({buildings.length})</h4>
        {buildings.map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span>{b.name}</span>
            <span style={{ color: 'var(--neon-blue)', fontSize: '12px' }}>{b.id}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
