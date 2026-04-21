import React from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../../contexts';

export function ProfileView({ user }) {
  const { logout } = useAuth();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--neon-blue)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <User size={40} color="white" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{user.name}</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>{user.phone}</p>
      
      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <MapPin size={18} color="var(--neon-blue)" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Адрес проживания</p>
            <p style={{ fontSize: '14px' }}>ЖК {user.buildingName}, кв. {user.apartment}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={18} color="var(--neon-blue)" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Статус</p>
            <p style={{ fontSize: '14px' }}>{user.role === 'admin' ? 'Администратор портала' : 'Житель (верифицирован)'}</p>
          </div>
        </div>
      </div>
      
      <button className="premium-btn" style={{ width: '100%', background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.2)' }} onClick={logout}>
        Выйти из аккаунта
      </button>
    </motion.div>
  );
}
