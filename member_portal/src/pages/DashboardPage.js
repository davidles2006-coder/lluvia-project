// src/pages/DashboardPage.js - V185 (最终完整版：含权益按钮)
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import './DashboardPage.css'; 

import defaultAvatar from '../assets/default_avatar.png'; 
import defaultBanner from '../assets/default_avatar.png'; 
import { API_BASE_URL as API_ROOT } from '../config';

const API_BASE_URL = API_ROOT;

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null); 
  const [vouchers, setVouchers] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation(); 

  // 弹窗状态
  const [showModal, setShowModal] = useState(false); // 编辑资料
  const [showBenefits, setShowBenefits] = useState(false); // 🚩 权益说明

  const [editForm, setEditForm] = useState({ nickname: '', phone: '', dob: '', email: '', password: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);

  const getBannerUrl = (url) => {
    if (!url) return defaultBanner;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const fetchAllData = useCallback(async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
      try {
        const headers = { 'Authorization': `Token ${token}` };
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/`, { headers });
        if (!profileRes.ok) throw new Error('Session invalid');
        setUserData(await profileRes.json());

        const vouchersRes = await fetch(`${API_BASE_URL}/api/profile/vouchers/`, { headers });
        if (vouchersRes.ok) setVouchers(await vouchersRes.json());

        const txnRes = await fetch(`${API_BASE_URL}/api/profile/transactions/`, { headers });
        if (txnRes.ok) setTransactions(await txnRes.json());

        const annRes = await fetch(`${API_BASE_URL}/api/announcements/`, { headers });
        if (annRes.ok) setAnnouncements(await annRes.json());

        setIsLoading(false);
      } catch (error) {
        navigate('/login');
      }
  }, [navigate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setAvatarFile(file); setPreviewUrl(URL.createObjectURL(file)); } };
  
  const handleSaveProfile = async (e) => { e.preventDefault(); setIsSaving(true); const token = localStorage.getItem('authToken'); const headers = { 'Authorization': `Token ${token}` }; try { if (avatarFile) { const formData = new FormData(); formData.append('avatar', avatarFile); await fetch(`${API_BASE_URL}/api/profile/avatar/`, { method: 'POST', headers: headers, body: formData }); } const textBody = { ...editForm }; if (!textBody.password) delete textBody.password; await fetch(`${API_BASE_URL}/api/profile/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(textBody) }); setShowModal(false); fetchAllData(); alert("Success"); } catch (error) { alert("Failed"); } setIsSaving(false); };

  const openEditModal = () => {
    setEditForm({ nickname: userData.nickname || '', phone: userData.phone || '', dob: userData.dob || '', email: userData.email || '', password: '' });
    setAvatarFile(null);
    setPreviewUrl(userData.avatarUrl || defaultAvatar); 
    setShowModal(true);
  };

  const getUserLevelClass = () => {
      if (!userData || !userData.level) return 'bronze';
      return userData.level.levelName.toLowerCase();
  };
  const levelClass = getUserLevelClass(); 

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        // 🚩 确保这里传了 onShowBenefits
        return <ProfileTab userData={userData} t={t} onEditClick={openEditModal} levelClass={levelClass} onShowBenefits={() => setShowBenefits(true)} />; 
      case 'vouchers':
        return <VouchersTab vouchers={vouchers} t={t} levelClass={levelClass} />; 
      case 'transactions':
        return <TransactionsTab transactions={transactions} t={t} levelClass={levelClass} />; 
      default:
        return <ProfileTab userData={userData} t={t} onEditClick={openEditModal} levelClass={levelClass} onShowBenefits={() => setShowBenefits(true)} />;
    }
  };

  if (isLoading || !userData) { return <div className="v11-dashboard-loading">{t('Loading...')}</div>; }

  return (
    <div className="v11-dashboard-container">
      <div className="v11-tabs">
        <span className={`link-independent ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>{t('My Profile')}</span>
        <span className={`link-independent ${activeTab === 'vouchers' ? 'active' : ''}`} onClick={() => setActiveTab('vouchers')}>{t('My Vouchers')}</span>
        <span className={`link-independent ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>{t('My Transactions')}</span>
      </div>

      <div className="v11-tab-content">
        {renderTabContent()}
      </div>
      
      {announcements.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '30px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
             <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '16px', fontFamily: 'serif' }}>📢 {t('Latest News')}</span>
           </div>
           <div className="v11-announcements-section">
             {announcements.map((ann) => (
               <div key={ann.id} className="v11-banner-item">
                 {ann.actionUrl ? (
                   <a href={ann.actionUrl} target="_blank" rel="noopener noreferrer" style={{display: 'block', width: '100%', height: '100%', textDecoration: 'none', position: 'relative'}}>
                      <img src={getBannerUrl(ann.imageUrl || ann.image)} alt={ann.title} className="v11-banner-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="v11-banner-caption">{ann.title}</div>
                   </a>
                 ) : (
                   <Link to={`/member/announcement/${ann.id}`} style={{display: 'block', width: '100%', height: '100%', textDecoration: 'none', position: 'relative'}}>
                      <img src={getBannerUrl(ann.imageUrl || ann.image)} alt={ann.title} className="v11-banner-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="v11-banner-caption">{ann.title}</div>
                   </Link>
                 )}
               </div>
             ))}
           </div>
        </div>
      )}

      {showModal && (
        <div className="v11-modal-overlay">
          <div className="v11-modal-content">
            <h3 className="v11-modal-title">{t('Edit Profile')}</h3>
            <form onSubmit={handleSaveProfile} className="v11-login-form">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <img src={previewUrl} alt="Preview" style={{width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37'}} />
                <br/>
                <label htmlFor="file-upload" className="link-independent" style={{cursor: 'pointer', fontSize: '14px', marginRight: '15px'}}>{t('Change Avatar')}</label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
              </div>
              <div className="v11-input-group"><label>{t('Nickname')}</label><input type="text" value={editForm.nickname} onChange={(e) => setEditForm({...editForm, nickname: e.target.value})} /></div>
              <div className="v11-input-group"><label>{t('Email')}</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
              <div className="v11-input-group"><label>{t('Phone')}</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div className="v11-input-group"><label>{t('Birthday')}</label><input type="date" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} /></div>
              <div className="v11-input-group"><label style={{color: '#D4AF37'}}>{t('New Password (optional)')}</label><input type="password" placeholder="******" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} /></div>
              <div className="v11-modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{t('Cancel')}</button><button type="submit" className="btn-pill" disabled={isSaving}>{isSaving ? t('Updating...') : t('Save')}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🚩 会员权益弹窗 (已更新文案结构) */}
      {showBenefits && (
        <div className="v11-modal-overlay" onClick={() => setShowBenefits(false)}>
          <div className="v11-modal-content" onClick={e => e.stopPropagation()} style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <h3 className="v11-modal-title" style={{color:'#D4AF37', borderBottom:'2px solid #D4AF37', paddingBottom:'10px', marginBottom:'20px'}}>
               {t('Member Benefits')}
            </h3>
            
            <div style={{textAlign: 'left', color: '#e0e0e0', lineHeight: '1.8', fontSize:'14px'}}>
              
              <h4 style={{color:'#fff', fontSize:'16px', margin:'20px 0 10px 0'}}>💰 {t('Recharge Privileges')}</h4>
              <ul style={{paddingLeft:'20px', color:'#ccc'}}>
                <li style={{marginBottom:'5px'}}>{t('Recharge Rule 1')}</li>
                <li style={{marginBottom:'5px'}}>{t('Recharge Rule 2')}</li>
                <li style={{marginBottom:'5px'}}>{t('Recharge Rule 3')}</li>
              </ul>

              <h4 style={{color:'#fff', fontSize:'16px', margin:'20px 0 10px 0'}}>💳 {t('Spending Privileges')}</h4>
              <ul style={{paddingLeft:'20px', color:'#ccc'}}>
                <li style={{marginBottom:'5px'}}>{t('Balance Discount')}</li>
                <li style={{marginBottom:'5px'}}>{t('Voucher Rule')}</li>
              </ul>

              <h4 style={{color:'#fff', fontSize:'16px', margin:'20px 0 10px 0'}}>🚀 {t('Level Multiplier')}</h4>
              <p style={{color:'#888', marginBottom:'5px', fontStyle:'italic'}}>{t('Points Explain')}</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'8px', background:'#111', padding:'15px', borderRadius:'8px', border:'1px solid #333'}}>
                <div style={{color:'#cd7f32', fontWeight:'bold'}}>Bronze: <span style={{color:'#fff', fontWeight:'normal'}}>{t('Bronze Speed')}</span></div>
                <div style={{color:'#C0C0C0', fontWeight:'bold'}}>Silver: <span style={{color:'#fff', fontWeight:'normal'}}>{t('Silver Speed')}</span></div>
                <div style={{color:'#D4AF37', fontWeight:'bold'}}>Gold: <span style={{color:'#fff', fontWeight:'normal'}}>{t('Gold Speed')}</span></div>
                <div style={{color:'#e5e4e2', fontWeight:'bold'}}>Platinum: <span style={{color:'#fff', fontWeight:'normal'}}>{t('Platinum Speed')}</span></div>
                <div style={{color:'#b9f2ff', fontWeight:'bold'}}>Diamond: <span style={{color:'#fff', fontWeight:'normal'}}>{t('Diamond Speed')}</span></div>
              </div>
            </div>

            <div className="v11-modal-actions" style={{marginTop:'30px'}}>
              <button className="btn-pill" onClick={() => setShowBenefits(false)} style={{width:'100%', fontWeight:'bold'}}>
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==================================================
// 子组件区域
// ==================================================

const ProfileTab = ({ userData, t, onEditClick, levelClass, onShowBenefits }) => { 
  const userLevel = userData.level ? userData.level.levelName : 'Bronze';
  const points = userData.lifetimePoints || 0;
  
  // 过期时间格式化
  const expiryDate = userData.levelExpiryDate 
      ? new Date(userData.levelExpiryDate).toLocaleDateString() 
      : t('No Expiry');

  let nextLevelPoints = 500; let isMaxLevel = false; let nextLevelName = 'Silver';
  if (points >= 6000) { nextLevelPoints = 6000; isMaxLevel = true; nextLevelName = 'Max'; } 
  else if (points >= 3000) { nextLevelPoints = 6000; nextLevelName = 'Diamond'; } 
  else if (points >= 1500) { nextLevelPoints = 3000; nextLevelName = 'Platinum'; } 
  else if (points >= 500) { nextLevelPoints = 1500; nextLevelName = 'Gold'; }
  
  const progressPercent = isMaxLevel ? 100 : Math.min((points / nextLevelPoints) * 100, 100);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => { setTimeout(() => setAnimatedWidth(progressPercent), 100); }, [progressPercent]);

  return (
    <div className="v11-profile-grid">
      <div className={`v11-card v11-avatar-card level-${levelClass}-frame`}>
        <div className="v11-avatar-wrapper">
          <img src={userData.avatarUrl ? userData.avatarUrl : defaultAvatar} onError={(e)=>{e.target.onerror=null;e.target.src=defaultAvatar}} alt="Avatar" className="v11-avatar" />
          <div className={`v11-avatar-border level-border-${levelClass}`}></div>
        </div>
        <h3 className="v11-username">{userData.nickname || '会员'}</h3>
        <span className={`v11-level-badge level-badge-${levelClass}`}>{t(userLevel)}</span>
        <div style={{marginTop: '10px', fontSize: '12px', color: '#888'}}>
            {t('Valid until')}: <span style={{color: '#D4AF37'}}>{expiryDate}</span>
        </div>
      </div>

      <div className={`v11-card v11-info-card level-${levelClass}-frame`}>
        <div className="v11-info-header"><h4>{t('My Profile')}</h4><button className="btn-ghost" onClick={onEditClick}>{t('Edit Profile')}</button></div>
        <div className="v11-info-grid"><div><strong>{t('Email')}:</strong> {userData.email}</div><div><strong>{t('Phone')}:</strong> {userData.phone || 'N/A'}</div><div><strong>{t('Balance')}:</strong> ${userData.balance || '0.00'}</div><div><strong>{t('Points')}:</strong> {userData.loyaltyPoints || 0}</div></div>
        <hr className="v11-divider" />
        
        {/* 🚩 确保这个按钮存在！ */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <h4 style={{margin:0}}>{t('Points Progress')} { !isMaxLevel && `(${t('Next')}: ${t(nextLevelName)})` }</h4>
            <button 
                onClick={onShowBenefits}
                style={{fontSize:'13px', color:'#D4AF37', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontWeight:'bold'}}
            >
                💎 {t('View Benefits')}
            </button>
        </div>

        <div className="v11-progress-bar"><div className="v11-progress-fill" style={{ width: `${animatedWidth}%` }}></div></div>
        <div className="v11-progress-text">
             <span>{points} / {isMaxLevel ? '∞' : nextLevelPoints} {t('XP')}</span>
        </div>
      </div>
    </div>
  );
};

const VouchersTab = ({ vouchers, t, levelClass }) => { 
  return (
    <div className={`v11-card level-${levelClass}-frame`}>
      <h4 style={{marginTop:0, marginBottom:'20px', color:'#D4AF37'}}>{t('My Vouchers')}</h4>
      {vouchers && vouchers.length > 0 ? (
        <div className="v11-store-grid v11-scroll-box"> 
          {vouchers.map((v) => (
             <div className="v11-voucher-ticket" key={v.voucherId}>
                <div className="ticket-header">
                    <h3 className="ticket-title">{v.voucherType.name}</h3>
                    <div className="ticket-value">{parseFloat(v.voucherType.value) > 0 ? `$${v.voucherType.value}` : 'GIFT'}</div>
                </div>
                <div className="ticket-divider"></div>
                <div className="ticket-body">
                    <p><strong>{t('Expires')}:</strong> {new Date(v.expiryDate).toLocaleDateString()}</p>
                    <div className={`ticket-status status-${v.status}`}>{v.status === 'unused' ? t('Unused') : v.status}</div>
                </div>
             </div>
          ))}
        </div>
      ) : (
        <div><p>{t('No vouchers available.')}</p><Link to="/member/points-store" className="btn-pill" style={{marginTop: '20px'}}>{t('Browse Store')}</Link></div>
      )}
    </div>
  );
};

const TransactionsTab = ({ transactions, t, levelClass }) => {
  return (
    <div className={`v11-card level-${levelClass}-frame`}>
      <h4 style={{marginTop:0, marginBottom:'20px', color:'#D4AF37'}}>{t('My Transactions')}</h4>
      {transactions && transactions.length > 0 ? (
        <div className="v11-scroll-box" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {transactions.map((txn, index) => {
            const isPositive = parseFloat(txn.amount) > 0;
            const amountColor = isPositive ? '#2ecc71' : (parseFloat(txn.amount) < 0 ? '#e74c3c' : '#ccc');
            const sign = isPositive ? '+' : '';
            return (
              <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginRight:'5px'}}>
                <div><div style={{color: '#fff', fontWeight: 'bold', fontSize: '16px'}}>{t(txn.type)}</div><div style={{color: '#888', fontSize: '12px', marginTop: '5px'}}>{new Date(txn.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Singapore', hour12: false })}</div></div>
                <div style={{textAlign: 'right'}}><div style={{color: amountColor, fontWeight: 'bold', fontSize: '18px'}}>{sign}${txn.amount}</div>{txn.pointsEarned !== 0 && (<div style={{color: '#D4AF37', fontSize: '12px', marginTop: '5px'}}>{txn.pointsEarned > 0 ? '+' : ''}{txn.pointsEarned} Pts</div>)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>{t('No transactions found.')}</p>
      )}
    </div>
  );
};

export default DashboardPage;