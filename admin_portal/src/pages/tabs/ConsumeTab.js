// src/pages/tabs/ConsumeTab.js - V56 (100% 汉化版)
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const ConsumeTab = ({ member, onMemberUpdate }) => {
    const { t } = useTranslation();
    
    // 独立状态
    const [balanceAmount, setBalanceAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    
    const [loading, setLoading] = useState(false);

    const staffToken = localStorage.getItem('staffToken');

    const handleOperation = async (type) => {
        const amount = type === 'consume' ? balanceAmount : cashAmount;
        
        if (!amount || amount <= 0) return;
        if (!window.confirm(`${t('Confirm')}? $${amount}`)) return;

        setLoading(true);
        
        const endpoint = type === 'consume' ? 'consume' : 'track';

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/${endpoint}/${member.memberId}/`, {
                amount: parseFloat(amount)
            }, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });

            // 成功提示
            alert(`${t('Success')}! (+${response.data.points_earned} Pts)`);
            
            if (type === 'consume') setBalanceAmount('');
            else setCashAmount('');
            
            onMemberUpdate(); 

        } catch (err) {
            alert(t('Failed') + ": " + (err.response?.data?.error || ""));
        }
        setLoading(false);
    };

    if (loading) return <div style={{color:'#aaa', textAlign:'center', marginTop:'20px'}}>{t('Processing...')}</div>;

    return (
        <div style={{padding: '20px'}}>
            
            {/* 1. 余额消费区 */}
            <div style={{marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '30px'}}>
                <h3 style={{color: '#fff', marginTop: 0, borderLeft: '4px solid #e74c3c', paddingLeft: '10px'}}>
                    {t('Consume (Deduct Balance)')}
                </h3>
                
                <p style={{color: '#aaa', fontSize: '14px', marginBottom: '10px'}}>
                    {t('Balance')}: <span style={{color: '#2ecc71', fontSize: '18px'}}>${member.balance}</span>
                </p>

                <div className="consume-form">
                    <div className="form-group" style={{marginBottom: '20px'}}>
                        <input 
                            type="number" 
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(e.target.value)}
                            placeholder="0.00"
                            className="admin-input" // 复用登录页样式
                            style={{
                                width: '100%', padding: '15px', fontSize: '24px', 
                                backgroundColor: '#2c2c2c', border: '2px solid #444', 
                                borderRadius: '8px', color: '#e74c3c', 
                                textAlign: 'center', fontWeight: 'bold', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => handleOperation('consume')} 
                        className="btn-action" 
                        style={{
                            backgroundColor: '#e74c3c', width: '100%', padding: '15px', 
                            fontSize: '18px', marginTop: '10px', color: 'white', 
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                        disabled={loading || member.balance <= 0}
                    >
                        {t('Confirm Deduct')}
                    </button>
                </div>
                <p style={{color: '#666', fontSize: '12px', marginTop: '10px'}}>
                    * {t('Note: Irreversible')} ({t('10% Discount')})
                </p>
            </div>

            {/* 2. 现金/刷卡追踪区 */}
            <div>
                {/* 🚩 修复翻译: Cash / Card Tracking */}
                <h3 style={{color: '#fff', marginTop: 0, borderLeft: '4px solid #f39c12', paddingLeft: '10px'}}>
                    {t('Cash / Card Tracking')}
                </h3>
                <div className="consume-form">
                    <div className="form-group">
                        <input 
                            type="number" 
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="0.00"
                            className="admin-input"
                            style={{
                                width: '100%', padding: '15px', fontSize: '24px', 
                                backgroundColor: '#2c2c2c', border: '2px solid #444', 
                                borderRadius: '8px', color: '#f39c12', 
                                textAlign: 'center', fontWeight: 'bold', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => handleOperation('track')} 
                        className="btn-action" 
                        style={{
                            backgroundColor: '#f39c12', width: '100%', padding: '15px', 
                            fontSize: '18px', marginTop: '10px', color: 'white', 
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                        disabled={loading}
                    >
                        {t('Confirm')}
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ConsumeTab;