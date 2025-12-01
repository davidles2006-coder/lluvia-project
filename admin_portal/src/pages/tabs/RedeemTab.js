// src/pages/tabs/RedeemTab.js - V190 (POS 键盘版)
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../../config';
import NumPad from '../../components/NumPad'; // 导入大键盘

const API_BASE_URL = `${API_ROOT}/api`;

const RedeemTab = ({ member, vouchers, onMemberUpdate }) => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [billAmount, setBillAmount] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 键盘处理
    const handleNumInput = (val) => {
        if (val === '.' && billAmount.includes('.')) return;
        if (billAmount.length > 8) return;
        setBillAmount(prev => prev + val);
    };
    const handleDelete = () => { setBillAmount(prev => prev.slice(0, -1)); };

    const handleRedeem = async () => {
        if (!selectedVoucher) return;
        
        // 检查金额 (如果是现金券)
        const isProductVoucher = parseFloat(selectedVoucher.voucherType.value) === 0;
        if (!isProductVoucher && (!billAmount || parseFloat(billAmount) <= 0)) return;

        if (!window.confirm(t('Confirm Redeem') + "?")) return;

        setLoading(true);
        setMessage({});

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/redeem_voucher/`, {
                voucher_id: selectedVoucher.voucherId,
                bill_amount: billAmount ? parseFloat(billAmount) : 0 
            }, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });

            setMessage({ type: 'success', text: response.data.success });
            setSelectedVoucher(null); // 重置
            setBillAmount('');
            onMemberUpdate(); 
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed' });
        }
        setLoading(false);
    };

    return (
        <div className="tab-inner-container">
            <h3 style={{color:'#aaa', fontSize:'14px', marginBottom:'15px'}}>{t('Select a Voucher to Redeem')}:</h3>
            
            {message.text && <div className={`message ${message.type}-message`} style={{textAlign:'center', marginBottom:'15px'}}>{message.text}</div>}

            {/* 1. 代金券列表 (选中高亮) */}
            <div className="v11-scroll-box" style={{maxHeight:'250px', overflowY:'auto', marginBottom:'20px', paddingRight:'5px'}}>
                {vouchers.length > 0 ? (
                    vouchers.map((v) => (
                        <div 
                            key={v.voucherId}
                            onClick={() => { setSelectedVoucher(v); setBillAmount(''); setMessage({}); }}
                            style={{
                                padding: '15px', marginBottom:'10px', borderRadius: '8px', cursor: 'pointer',
                                border: selectedVoucher?.voucherId === v.voucherId ? '2px solid #0056b3' : '1px solid #444',
                                backgroundColor: selectedVoucher?.voucherId === v.voucherId ? '#002140' : '#2c2c2c',
                                opacity: selectedVoucher && selectedVoucher.voucherId !== v.voucherId ? 0.5 : 1
                            }}
                        >
                            <div style={{color: '#D4AF37', fontWeight: 'bold'}}>{v.voucherType.name}</div>
                            <div style={{fontSize:'12px', color:'#888'}}>
                                {t('Value')}: ${v.voucherType.value} | Min: ${v.voucherType.threshold}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{color:'#666', textAlign:'center'}}>{t('No vouchers available.')}</p>
                )}
            </div>

            {/* 2. 键盘区域 (仅当选中券时显示) */}
            {selectedVoucher && (
                <div className="redeem-action-area" style={{borderTop:'1px solid #333', paddingTop:'20px'}}>
                    {/* 如果是现金券 ($50)，显示输入框和键盘 */}
                    {parseFloat(selectedVoucher.voucherType.value) > 0 ? (
                        <>
                            <p style={{textAlign:'center', color:'#aaa', marginBottom:'5px'}}>{t('Enter Total Bill Amount')}:</p>
                            <div className="pos-display-screen" style={{marginBottom:'15px'}}>
                                {billAmount ? `$${billAmount}` : <span className="placeholder">Min ${selectedVoucher.voucherType.threshold}</span>}
                            </div>
                            <NumPad 
                                onInput={handleNumInput} 
                                onDelete={handleDelete} 
                                onEnter={handleRedeem} 
                                label={loading ? "..." : t('REDEEM NOW')} 
                            />
                        </>
                    ) : (
                        /* 如果是产品券 (Free Drink)，直接显示按钮 */
                        <button 
                            className="numpad-submit-btn" 
                            onClick={handleRedeem} 
                            disabled={loading}
                            style={{background:'#2ecc71'}}
                        >
                            {loading ? "..." : t('REDEEM PRODUCT')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default RedeemTab;