// src/pages/tabs/RechargeTab.js - V54 (消除未使用变量警告)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址 

const RechargeTab = ({ member, onMemberUpdate }) => {
    const { t } = useTranslation();
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);

    const staffToken = localStorage.getItem('staffToken');

    useEffect(() => {
        axios.get(`${API_BASE_URL}/admin/tiers/`, {
             headers: { 'Authorization': `Token ${staffToken}` }
        })
        .then(response => setTiers(response.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, [staffToken]);

    const handleRecharge = async (tierId, amount) => {
        if (!window.confirm(`${t('Confirm')}? $${amount}`)) return;
        
        setLoading(true);

        try {
            // 🚩 修复：移除 'const response ='，直接 await
            await axios.post(`${API_BASE_URL}/admin/recharge/${member.memberId}/`, {
                tier_id: tierId,
            }, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });

            alert(t('Success')); 
            onMemberUpdate(); 

        } catch (err) {
            alert(t('Failed') + ": " + (err.response?.data?.error || ""));
        }
        setLoading(false);
    };

    if (loading) return <div style={{color:'#aaa', textAlign:'center', marginTop:'20px'}}>{t('Processing...')}</div>;

    return (
        <div style={{padding: '20px'}}>
            <h3 style={{color: '#fff', marginTop: 0, marginBottom: '20px', borderLeft: '4px solid #1890ff', paddingLeft: '10px'}}>
                {t('Select Recharge Amount')}
            </h3>
            
            <div className="tiers-grid">
                {tiers.length > 0 ? (
                    tiers.map(tier => (
                        <button 
                            key={tier.id} 
                            className="tier-card" 
                            onClick={() => handleRecharge(tier.id, tier.amount)}
                            disabled={loading}
                        >
                            <div className="tier-amount">${tier.amount}</div>
                            <div className="tier-bonus">
                               + {tier.grantVoucherCount} Vouchers
                            </div>
                        </button>
                    ))
                ) : (
                    <p style={{color: '#888'}}>No tiers available</p>
                )}
            </div>
        </div>
    );
};

export default RechargeTab;