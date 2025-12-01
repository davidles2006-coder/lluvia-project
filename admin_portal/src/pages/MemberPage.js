// src/pages/MemberPage.js (Admin Portal - V181 含权益弹窗)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './MemberPage.css'; // 复用样式
import { API_BASE_URL as API_ROOT } from '../config';

// 导入 Tabs 组件
import RechargeTab from './tabs/RechargeTab';
import ConsumeTab from './tabs/ConsumeTab';
import RedeemTab from './tabs/RedeemTab';

import defaultAvatar from '../assets/default_avatar.png';

const API_BASE_URL = `${API_ROOT}/api`;

const MemberPage = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [member, setMember] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [activeTab, setActiveTab] = useState('recharge');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 🚩 新增: 权益弹窗开关
    const [showBenefits, setShowBenefits] = useState(false);

    const fetchMemberData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. 获取会员详情
            const memberRes = await axios.post(`${API_BASE_URL}/admin/search/`, 
                { memberId: memberId },
                { headers: { 'Authorization': `Token ${staffToken}` } }
            );
            setMember(memberRes.data.profile);
            setVouchers(memberRes.data.vouchers);
        } catch (err) {
            setError('Member not found or error fetching data.');
        }
        setLoading(false);
    }, [memberId, staffToken]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    const getImageUrl = (url) => {
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `${API_ROOT}${url}`;
    };

    if (loading) return <div className="loading-text">{t('member.loading')}</div>;
    if (error) return <div className="error-text">{error} <button onClick={() => navigate('/search')}>{t('member.back')}</button></div>;

    return (
        <div className="member-page-container">
            {/* 顶部卡片 */}
            <div className="member-header">
                <div className="member-header-main">
                    <img 
                        src={member.avatarUrl ? getImageUrl(member.avatarUrl) : defaultAvatar} 
                        alt="Avatar" 
                        className="member-avatar-large"
                        onError={(e) => {e.target.src = defaultAvatar}}
                    />
                    <div className="member-header-info">
                        <h2>{member.nickname || 'No Name'}</h2>
                        <p className="member-id">ID: {member.phone || member.email}</p>
                        
                        <div className="member-badges">
                            <span className={`badge level-${(member.level?.levelName || 'bronze').toLowerCase()}`}>
                                {member.level?.levelName || 'Bronze'}
                            </span>
                            {/* 有效期显示 */}
                            <span className="badge" style={{background: '#333', border: '1px solid #555', fontSize: '12px'}}>
                                Exp: {member.levelExpiryDate || 'N/A'}
                            </span>
                        </div>

                        {/* 🚩 权益按钮 */}
                        <button 
                            onClick={() => setShowBenefits(true)}
                            style={{marginTop:'10px', background:'none', border:'none', color:'#D4AF37', textDecoration:'underline', cursor:'pointer', fontSize:'14px'}}
                        >
                            {t('View Benefits')}
                        </button>

                    </div>
                </div>
                <div className="member-stats">
                    <div className="stat-item">
                        <label>{t('member.balance')}</label>
                        <span className="stat-value balance">${member.balance}</span>
                    </div>
                    <div className="stat-item">
                        <label>{t('member.points')}</label>
                        <span className="stat-value points">{member.loyaltyPoints}</span>
                    </div>
                </div>
            </div>

            {/* 功能 Tabs */}
            <div className="member-tabs">
                <button className={`tab-btn ${activeTab === 'recharge' ? 'active' : ''}`} onClick={() => setActiveTab('recharge')}>{t('member.tab_recharge')}</button>
                <button className={`tab-btn ${activeTab === 'consume' ? 'active' : ''}`} onClick={() => setActiveTab('consume')}>{t('member.tab_consume')}</button>
                <button className={`tab-btn ${activeTab === 'redeem' ? 'active' : ''}`} onClick={() => setActiveTab('redeem')}>{t('member.tab_redeem')}</button>
            </div>

            <div className="tab-content-area">
                {activeTab === 'recharge' && <RechargeTab member={member} onSuccess={fetchMemberData} />}
                {activeTab === 'consume' && <ConsumeTab member={member} onSuccess={fetchMemberData} />}
                {activeTab === 'redeem' && <RedeemTab member={member} vouchers={vouchers} onSuccess={fetchMemberData} />}
            </div>

            {/* 🚩 权益说明弹窗 (复制自 Member Portal) */}
            {showBenefits && (
                <div className="v11-modal-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setShowBenefits(false)}>
                  <div className="v11-modal-content" onClick={e => e.stopPropagation()} style={{background:'#1e1e1e', padding:'30px', borderRadius:'15px', border:'1px solid #D4AF37', maxWidth:'500px', width:'90%', maxHeight:'80vh', overflowY:'auto'}}>
                    <h3 style={{color:'#D4AF37', borderBottom:'2px solid #D4AF37', paddingBottom:'10px', marginBottom:'20px', marginTop:0}}>
                       {t('Member Benefits')}
                    </h3>
                    
                    <div style={{textAlign: 'left', color: '#e0e0e0', lineHeight: '1.8', fontSize:'14px'}}>
                      <h4 style={{color:'#fff', fontSize:'16px', margin:'10px 0'}}>💰 {t('Recharge Privileges')}</h4>
                      <ul style={{paddingLeft:'20px', color:'#ccc'}}>
                        <li>{t('Recharge Rule 1')}</li>
                        <li>{t('Recharge Rule 2')}</li>
                        <li>{t('Recharge Rule 3')}</li>
                      </ul>

                      <h4 style={{color:'#fff', fontSize:'16px', margin:'10px 0'}}>💳 {t('Spending Privileges')}</h4>
                      <ul style={{paddingLeft:'20px', color:'#ccc'}}>
                        <li>{t('Balance Discount')}</li>
                        <li>{t('Voucher Rule')}</li>
                      </ul>

                      <h4 style={{color:'#fff', fontSize:'16px', margin:'10px 0'}}>🚀 {t('Level Multiplier')}</h4>
                      <p style={{color:'#888', marginBottom:'5px', fontStyle:'italic'}}>{t('Points Explain')}</p>
                      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'5px', background:'#111', padding:'10px', borderRadius:'8px'}}>
                        <div style={{color:'#cd7f32'}}>{t(Bronze)}: {t('Bronze Speed')}</div>
                        <div style={{color:'#C0C0C0'}}>{t(Silver)}: {t('Silver Speed')}</div>
                        <div style={{color:'#D4AF37'}}>{t(Gold)}: {t('Gold Speed')}</div>
                        <div style={{color:'#e5e4e2'}}>{t(Platinum)}: {t('Platinum Speed')}</div>
                        <div style={{color:'#b9f2ff'}}>{t(Diamond)}: {t('Diamond Speed')}</div>
                      </div>
                    </div>

                    <div style={{marginTop:'30px'}}>
                      <button onClick={() => setShowBenefits(false)} style={{width:'100%', padding:'12px', background:'#D4AF37', border:'none', borderRadius:'25px', fontWeight:'bold', cursor:'pointer'}}>
                        {t('Close')}
                      </button>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default MemberPage;