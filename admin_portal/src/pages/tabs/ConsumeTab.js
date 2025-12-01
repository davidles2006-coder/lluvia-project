// src/pages/tabs/ConsumeTab.js - V190 (POS 键盘版)
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../../config';
import NumPad from '../../components/NumPad'; // 导入大键盘

const API_BASE_URL = `${API_ROOT}/api`;

const ConsumeTab = ({ member, onSuccess }) => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');
    
    const [activeMode, setActiveMode] = useState('balance'); // 'balance' or 'cash'
    const [amount, setAmount] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 键盘输入处理
    const handleNumInput = (val) => {
        if (val === '.' && amount.includes('.')) return;
        if (amount.length > 8) return;
        setAmount(prev => prev + val);
    };

    const handleDelete = () => {
        setAmount(prev => prev.slice(0, -1));
    };

    const handleConfirm = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        const actionText = activeMode === 'balance' ? t('Consume Balance') : t('Track Cash Spend');
        if (!window.confirm(`${actionText}: $${amount}?`)) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        const endpoint = activeMode === 'balance' ? 'consume' : 'track';

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/${endpoint}/${member.memberId}/`, 
                { amount: amount },
                { headers: { 'Authorization': `Token ${staffToken}` } }
            );
            
            // 显示成功信息 (含积分)
            const pts = response.data.points_earned;
            setMessage({ type: 'success', text: `${t('Success')}! (+${pts} Pts)` });
            
            setAmount(''); 
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed' });
        }
        setLoading(false);
    };

    return (
        <div className="tab-inner-container">
            {/* 顶部切换按钮 */}
            <div style={{display:'flex', marginBottom:'20px', borderBottom:'1px solid #444'}}>
                <button 
                    onClick={() => {setActiveMode('balance'); setAmount(''); setMessage({});}}
                    style={{flex:1, padding:'15px', background: activeMode==='balance' ? '#e74c3c':'#222', color:'#fff', border:'none', fontSize:'16px', fontWeight:'bold'}}
                >
                    {t('Consume Balance')}
                </button>
                <button 
                    onClick={() => {setActiveMode('cash'); setAmount(''); setMessage({});}}
                    style={{flex:1, padding:'15px', background: activeMode==='cash' ? '#f39c12':'#222', color:'#fff', border:'none', fontSize:'16px', fontWeight:'bold'}}
                >
                    {t('Cash / Card')}
                </button>
            </div>

            {message.text && <div className={`message ${message.type}-message`} style={{textAlign:'center', marginBottom:'15px'}}>{message.text}</div>}
            
            {/* POS 显示屏 */}
            <div className="pos-display-screen" style={{color: activeMode==='balance' ? '#e74c3c' : '#f39c12', fontSize:'40px', marginBottom:'20px'}}>
                {amount ? `$${amount}` : <span className="placeholder">$0.00</span>}
            </div>

            {/* 数字键盘 */}
            <NumPad 
                onInput={handleNumInput} 
                onDelete={handleDelete} 
                onEnter={handleConfirm} 
                label={loading ? "..." : (activeMode==='balance' ? t('DEDUCT') : t('TRACK'))} 
            />
            
            {activeMode === 'balance' && (
                <p style={{textAlign:'center', color:'#666', marginTop:'10px', fontSize:'12px'}}>
                    {t('Current Balance')}: <span style={{color:'#2ecc71'}}>${member.balance}</span>
                </p>
            )}
        </div>
    );
};

export default ConsumeTab;