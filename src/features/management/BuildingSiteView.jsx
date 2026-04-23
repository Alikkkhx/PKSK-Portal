import { buildingService } from '../../service/api/buildingService';

export function BuildingSiteView({ buildingId, userRole }) {
  const [siteData, setSiteData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buildingId) {
      setLoading(false);
      return;
    }
    buildingService.getBuildingSite(buildingId).then(data => {
      if (data) {
        setSiteData(data);
        setEditForm(data);
      }
      setLoading(false);
    });
  }, [buildingId]);

  const handleSave = async () => {
    try {
      await buildingService.updateSiteContent(buildingId, editForm);
      setSiteData(editForm);
      setIsEditing(false);
      alert("Данные сайта успешно обновлены!");
    } catch (e) {
      alert("Ошибка при сохранении: " + e.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><div className="pulse" style={{ width: '30px', height: '30px', background: 'var(--neon-blue)', borderRadius: '50%', margin: 'auto' }} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '80px' }}>
      
      {/* HERO SECTION */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px', background: 'var(--accent-gradient)', border: 'none' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>
          {isEditing ? (
            <input 
              className="premium-input" 
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid white', color: 'white' }}
              value={editForm.about} 
              onChange={e => setEditForm({...editForm, about: e.target.value})} 
            />
          ) : (siteData?.about || "Добро пожаловать!")}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Информационный портал вашего ЖК</p>
        
        {['admin', 'super_admin'].includes(userRole) && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}
          >
            <Edit3 size={14} /> Редактировать сайт
          </button>
        )}
      </div>

      {isEditing && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button className="premium-btn" style={{ flex: 1, padding: '12px' }} onClick={handleSave}><Save size={16} /> Сохранить</button>
          <button className="premium-btn" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsEditing(false)}><X size={16} /> Отмена</button>
        </div>
      )}

      {/* BLOCKS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        
        {/* CONTACTS */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--neon-blue)' }}>
            <Phone size={18} /> Важные контакты
          </h4>
          {isEditing ? (
            <textarea 
              className="premium-input" style={{ minHeight: '100px' }}
              value={editForm.contacts} onChange={e => setEditForm({...editForm, contacts: e.target.value})}
            />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontStyle: 'normal', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{siteData.contacts}</pre>
          )}
        </div>

        {/* TARIFFS */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--neon-blue)' }}>
            <FileText size={18} /> Тарифы и Услуги
          </h4>
          {isEditing ? (
            <textarea 
              className="premium-input" style={{ minHeight: '100px' }}
              value={editForm.tariffs} onChange={e => setEditForm({...editForm, tariffs: e.target.value})}
            />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontStyle: 'normal', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{siteData.tariffs}</pre>
          )}
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--neon-blue)' }}>
            <Megaphone size={18} /> Объявления ЖК
          </h4>
          {isEditing ? (
            <textarea 
              className="premium-input" style={{ minHeight: '100px' }}
              value={editForm.announcements} onChange={e => setEditForm({...editForm, announcements: e.target.value})}
            />
          ) : (
            <div style={{ padding: '12px', background: 'rgba(0,101,255,0.05)', borderRadius: '12px', border: '1px solid rgba(0,101,255,0.1)' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontStyle: 'normal', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{siteData.announcements}</pre>
            </div>
          )}
        </div>

      </div>

      <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
        <Info size={32} style={{ margin: 'auto' }} />
        <p style={{ fontSize: '11px', marginTop: '10px' }}>Smart PKSK Infrastructure v4.0 (Enterprise-Grade)</p>
      </div>

    </motion.div>
  );
}
