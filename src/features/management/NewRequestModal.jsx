import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon } from 'lucide-react';
import { firebaseApi } from '../../service/firebaseApi';

export function NewRequestModal({ user, onClose, t }) {
  const [formData, setFormData] = useState({ 
    category: 'ЖКХ / Тех. обслуживание', 
    description: '', 
    buildingId: user?.buildingId || '', 
    buildingName: user?.buildingName || '', 
    residentName: user?.name || '',
    residentApartment: user?.apartment || ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    let imageUrl = '';
    try {
      if (image) {
        imageUrl = await firebaseApi.uploadImage(image);
        if (!imageUrl) throw new Error("Не удалось загрузить изображение");
      }
      await firebaseApi.saveRequest({ ...formData, imageUrl, status: 'pending' });
      alert("Заявка успешно отправлена!");
      onClose();
    } catch (error) {
      console.error('Submit request error:', error);
      alert("Ошибка при отправке: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>{t('new_appeal')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <select className="premium-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>ЖКХ / Тех. обслуживание</option>
            <option>Лифт</option>
            <option>Сантехника</option>
            <option>Электрика</option>
            <option>Уборка</option>
            <option>Прочее</option>
          </select>
          <textarea className="premium-input" style={{ minHeight: '100px' }} placeholder={t('description')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!image ? (
              <label className="glass-card" style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ImageIcon size={18} />
                <span style={{ fontSize: '12px' }}>Добавить фото</span>
                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setImage(e.target.files[0])} />
              </label>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <img src={URL.createObjectURL(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                <button type="button" onClick={() => setImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', color: 'white', padding: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
            )}
          </div>
          <button className="premium-btn" style={{ padding: '16px' }} disabled={loading}>{loading ? '...' : t('send')}</button>
        </form>
      </motion.div>
    </div>
  );
}
