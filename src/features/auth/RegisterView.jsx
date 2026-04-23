import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../../service/api/authService';
import { userService } from '../../service/api/userService';

export function RegisterView({ onRegister, onSwitchToLogin, buildings, t }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', 
    buildingId: buildings[0]?.id || '', 
    buildingName: buildings[0]?.name || '',
    apartment: '', role: 'resident'
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.buildingId) return alert("Выберите ЖК для регистрации");
    
    setLoading(true);
    try {
      // 1. Создание Auth-аккаунта
      const user = await authService.register(formData.phone, formData.password);
      
      // 2. Создание SaaS-профиля
      const { password, ...profileData } = formData;
      await userService.saveProfile(user.uid, {
        ...profileData,
        email: user.email,
        createdAt: new Date().toISOString()
      });
      
      // AppMain подхватит профиль автоматически через onAuth
    } catch (err) {
      alert('Ошибка регистрации: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Создать аккаунт</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Присоединяйтесь к Smart PKSK</p>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input className="premium-input" placeholder="Ваше имя" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <input className="premium-input" placeholder="Телефон" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
        <input className="premium-input" type="password" placeholder="Пароль" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            className="premium-input" 
            value={formData.buildingId} 
            onChange={e => {
              const b = buildings.find(x => x.id === e.target.value);
              setFormData({...formData, buildingId: b.id, buildingName: b.name});
            }}
          >
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input className="premium-input" style={{ width: '80px' }} placeholder="Кв." value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})} required />
        </div>

        <button className="premium-btn" style={{ padding: '14px', marginTop: '10px' }} disabled={loading}>
          {loading ? '...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontSize: '14px', cursor: 'pointer' }}>
          ← Вернуться ко входу
        </button>
      </div>
    </motion.div>
  );
}
