import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { authService } from '../../service/api/authService';

export function LoginView({ onLogin, onSwitchToRegister, t, lang, toggleLang }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    setError('');
    
    try {
      await authService.login(phone, password);
      // AppMain подхватит сессию через onAuth автоматически
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Неверный пароль.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Аккаунт не найден.');
      } else {
        setError('Ошибка входа. Проверьте данные.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '380px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--neon-blue)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 101, 255, 0.4)' }}>
          <Settings size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>{t('login_title')}</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '8px' }}>Smart PKSK Portal v4.0 (Enterprise-Grade)</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>{t('username')} (телефон)</label>
          <input className="premium-input" type="text" placeholder="8 777 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>{t('password')}</label>
          <input className="premium-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: '#ff4757', fontSize: '12px', textAlign: 'center' }}>{error}</p>}
        <button className="premium-btn" style={{ padding: '14px', fontSize: '16px', fontWeight: 700, marginTop: '10px' }} disabled={loading}>
          {loading ? '...' : t('login')}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontSize: '14px', cursor: 'pointer' }}>
          У меня нет аккаунта →
        </button>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={toggleLang} className="glass-card" style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
          {lang.toUpperCase()}
        </button>
      </div>
    </motion.div>
  );
}
