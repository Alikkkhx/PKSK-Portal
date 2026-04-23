import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Globe, Trash2 } from 'lucide-react';
import { buildingService } from '../../service/api/buildingService';
import { CreateBuildingModal } from './CreateBuildingModal';

export function AdminControlCenter({ buildings, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (id, name) => {
    if (window.confirm(`ВНИМАНИЕ: Вы удаляете ЖК "${name}". Все данные сайта этого дома также будут стерты.`)) {
      try {
        await buildingService.deleteBuilding(id);
        alert("ЖК и его инфраструктура успешно удалены");
        onRefresh();
      } catch (error) {
        alert("Ошибка: " + error.message);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '80px' }}>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Settings size={18} color="var(--neon-blue)" /> Инфраструктура
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button 
            className="premium-btn" 
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
          >
            <Plus size={14} style={{ marginBottom: '4px' }} /> <br/> Новое ЖК
          </button>
          <button 
            className="premium-btn" 
            onClick={() => alert("Функционал глобальной рассылки будет доступен в v2.1")}
            style={{ padding: '12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
          >
            <Globe size={14} style={{ marginBottom: '4px' }} /> <br/> Рассылка
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ marginBottom: '12px' }}>Список ЖК ({buildings.length})</h4>
        {buildings.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', fontSize: '14px', padding: '20px' }}>Здания еще не добавлены</p>}
        {buildings.map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{b.name}</div>
              <div style={{ fontSize: '10px', opacity: 0.5 }}>ID: {b.id}</div>
            </div>
            <button 
              onClick={() => handleDelete(b.id, b.name)}
              style={{ background: 'none', border: 'none', color: '#ff4d4d', padding: '8px', cursor: 'pointer', opacity: 0.7 }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateBuildingModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={onRefresh}
        />
      )}
    </motion.div>
  );
}
