// src/pages/MemberPage.js - V51 (头像显示 + 深度翻译修复)
import React, { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './MemberPage.css'; 

// 🚩 1. 引入默认头像
import defaultAvatar from '../assets/default_avatar.png';

import RechargeTab from './tabs/RechargeTab';
import ConsumeTab from './tabs/ConsumeTab';
import RedeemTab from './tabs/RedeemTab'; 

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址 

const MemberPage = () => {
    const { memberId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [member, setMember] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recharge'); 
    const [refreshKey, setRefreshKey] = useState(0); 

    const staffToken = localStorage.getItem('staffToken');

    const handleMemberUpdate = () => {
        setError(null);
        setRefreshKey(prev => prev + 1); 
    };

    const fetchMemberData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        if (!memberId || !staffToken) {
            if (!staffToken) navigate('/login');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/search/`, {
                memberId: String(memberId).trim(), 
            }, {
                headers: { 'Authorization': `Token ${staffToken}` },
            });

            setMember(response.data.profile); 
            setVouchers(response.data.vouchers);
            
        } catch (err) {
            console.error(err);
            setError(t('Member not found'));
        } finally {
            setLoading(false);
        }
    }, [memberId, staffToken, navigate, t]); 

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData, refreshKey]); 

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'recharge': return <RechargeTab member={member} onMemberUpdate={handleMemberUpdate} />; 
            case 'consume': return <ConsumeTab member={member} onMemberUpdate={handleMemberUpdate} />; 
            case 'redeem': return <RedeemTab vouchers={vouchers} onMemberUpdate={handleMemberUpdate} />;
            default: return null;
        }
    };

    if (loading) return <div className="loading-message">{t('Loading...')}</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!member) return null;

    return (
        <div className="member-page-container">
            <button onClick={() => navigate('/search')} className="back-button">
                &larr; {t('Back to Search')}
            </button>

            <h1 className="page-title">{t('Member Details')}</h1>

            {/* 1. 会员信息卡 */}
            <div className="member-profile-card">
                
                {/* 🚩 V51 新增: 头像与昵称布局 */}
                <div className="profile-header-row" style={{display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '20px'}}>
                    <img 
                        src={member.avatarUrl ? member.avatarUrl : defaultAvatar} 
                        // 错误处理: 图片坏了就显示默认
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                        alt="Avatar" 
                        className="member-avatar-img"
                    />
                    <div style={{marginLeft: '20px'}}>
                        <h2 style={{margin: 0, color: '#fff'}}>{member.nickname}</h2>
                        <span style={{color: '#888', fontSize: '14px'}}>{member.email}</span>
                    </div>
                </div>

                <div className="profile-grid">
                    <div className="profile-item">
                        <span className="label">{t('Phone')}:</span>
                        <span className="value">{member.phone}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">{t('Level')}:</span>
                        {/* 🚩 V51 修复: 使用 t() 翻译等级名称 (Bronze -> 青铜会员) */}
                        <span className="value" style={{color: '#D4AF37'}}>
                            {t(member.level?.levelName || 'Bronze')}
                        </span>
                    </div>
                    <div className="profile-item">
                        <span className="label">{t('Balance')}:</span>
                        <span className="value highlight">${member.balance}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">{t('Loyalty Points')}:</span>
                        <span className="value">{member.loyaltyPoints}</span>
                    </div>
                </div>
            </div>

            {/* 2. 操作 Tab 导航 */}
            <div className="operation-tabs">
                <button className={activeTab === 'recharge' ? 'active' : ''} onClick={() => setActiveTab('recharge')}>{t('Recharge')}</button>
                <button className={activeTab === 'consume' ? 'active' : ''} onClick={() => setActiveTab('consume')}>{t('Consume')}</button>
                <button className={activeTab === 'redeem' ? 'active' : ''} onClick={() => setActiveTab('redeem')}>{t('Redeem Voucher')} ({vouchers.length})</button>
            </div>

            {/* 3. Tab 内容区 */}
            <div className="tab-content-wrapper">
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default MemberPage;