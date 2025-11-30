// src/pages/tabs/RechargeTab.js - V190 (卡片式美化版)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`;

const RechargeTab = ({ member, onSuccess }) => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');
    
    const [tiers, setTiers] = useState([]);
    const [selectedTier, setSelectedTier] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        // 获取充值档位
        const fetchTiers = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/tiers/`, {
                    headers: { 'Authorization': `Token ${staffToken}` }
                });
                setTiers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTiers();
    }, [staffToken]);

    const handleRecharge = async () => {
        if (!selectedTier) return;
        
        // 二次确认
        if (!window.confirm(`Confirm recharge $${selectedTier.amount}?`)) return;

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/recharge/${member.memberId}/`, 
                { tier_id: selectedTier.id },
                { headers: { 'Authorization': `Token ${staffToken}` } }
            );
            setSuccessMsg(response.data.success);
            setSelectedTier(null); // 重置选择
            if (onSuccess) onSuccess(); // 刷新父页面数据
        } catch (err) {
            setError(err.response?.data?.error || 'Recharge failed');
        }
        setLoading(false);
    };

    return (
        <div className="tab-inner-container">
            {/* 错误/成功提示 */}
            {error && <div className="message error-message">{error}</div>}
            {successMsg && <div className="message success-message">{successMsg}</div>}

            <p className="section-title">{t('Select Recharge Amount')}:</p>

            {/* 🚩 核心美化：卡片网格布局 */}
            <div className="recharge-grid">
                {tiers.map((tier) => (
                    <div 
                        key={tier.id} 
                        className={`recharge-card ${selectedTier?.id === tier.id ? 'active' : ''}`}
                        onClick={() => setSelectedTier(tier)}
                    >
                        <div className="tier-amount">${tier.amount}</div>
                        <div className="tier-bonus">
                            {tier.grantVoucherCount > 0 
                                ? `🎁 ${tier.grantVoucherCount}x Vouchers` 
                                : t('No Vouchers')}
                        </div>
                    </div>
                ))}
            </div>

            {/* 底部操作栏 */}
            <div className="action-bar">
                <button 
                    className="action-button confirm-btn"
                    disabled={!selectedTier || loading}
                    onClick={handleRecharge}
                    style={{width: '100%', marginTop: '20px', height: '50px', fontSize: '18px'}}
                >
                    {loading ? t('Processing...') : (selectedTier ? `${t('Confirm Charge')} $${selectedTier.amount}` : t('Please Select'))}
                </button>
            </div>
        </div>
    );
};

export default RechargeTab;