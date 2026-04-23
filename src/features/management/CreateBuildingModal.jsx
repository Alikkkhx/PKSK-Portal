import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, Hash, MapPin } from 'lucide-react';
import { buildingService } from '../../service/api/buildingService';

export function CreateBuildingModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !id.trim() || !address.trim()) {
      alert("Пожалуйста, заполните все поля (Название, Адрес, ID)");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Проверяем существование
      const buildings = await buildingService.getBuildings();
      const exists = buildings.find(b => b.id.toString() === id.trim().toString());
      if (exists) throw new Error("ЖК с таким ID уже существует");

      // 2. Создаем здание через SaaS сервис
      await buildingService.createBuilding({
        id: id.trim(),
        name: name.trim(),
        address: address.trim()
      });
      
      alert(`ЖК "${name}" успешно создан! Теперь вы можете приглашать жильцов.`);
      onCreated();
      onClose();
    } catch (error) {
      console.error('Create building error:', error);
      alert("Ошибка при создании ЖК: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--neon-blue)" /> Новое ЖК
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="premium-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Название ЖК (например: ЖК 'Асыл Тау')" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="premium-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Адрес (ул. Сатпаева, 15)" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Hash size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="premium-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Уникальный ID (at777)" 
              value={id} 
              onChange={e => setId(e.target.value)} 
            />
          </div>
          
          <p style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
            * Этот ID пользователи будут вводить при регистрации, чтобы попасть именно в этот ЖК. Убедитесь, что он короткий и запоминающийся.
          </p>

          <button className="premium-btn" style={{ padding: '16px' }} disabled={loading}>
            {loading ? 'Инициализация инфраструктуры...' : 'Создать и развернуть ЖК'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
