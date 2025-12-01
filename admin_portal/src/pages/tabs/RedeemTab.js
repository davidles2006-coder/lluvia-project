// src/pages/tabs/RedeemTab.js - V195 (修复回调函数命名错误)
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../../config';
import NumPad from '../../components/NumPad';

const API_BASE_URL = `${API_ROOT}/api`;

// 🚩 修复 1: 这里的参数必须是 onSuccess (和 MemberPage 传的一样)
const RedeemTab = ({ member, vouchers, onSuccess }) => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [billAmount, setBillAmount] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleNumInput = (val) => {
        if (val === '.' && billAmount.includes('.')) return;
        if (billAmount.length > 8) return;
        setBillAmount(prev => prev + val);
    };
    const handleDelete = () => { setBillAmount(prev => prev.slice(0, -1)); };

    const handleRedeem = async () => {
        if (!selectedVoucher) return;
        
        const isProductVoucher = parseFloat(selectedVoucher.voucherType.value) === 0;
        if (!isProductVoucher && (!billAmount || parseFloat(billAmount) <= 0)) {
            alert(t('Please enter bill amount'));
            return;
        }

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
            setSelectedVoucher(null);
            setBillAmount('');
            
            // 🚩 修复 2: 调用正确的函数名
            if (onSuccess) onSuccess(); 

        } catch (err) {
            console.error(err);
            let errorMsg = "Failed";
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (data.error) errorMsg = data.error;
                else if (data.detail) errorMsg = data.detail;
            }
            setMessage({ type: 'error', text: errorMsg });
        }
        setLoading(false);
    };

    return (
        <div className="tab-inner-container">
            <h3 style={{color:'#aaa', fontSize:'14px', marginBottom:'15px'}}>{t('Select a Voucher to Redeem')}:</h3>
            
            {message.text && <div className={`message ${message.type}-message`} style={{textAlign:'center', marginBottom:'15px'}}>{message.text}</div>}

            <div className="v11-scroll-box" style={{maxHeight:'300px', overflowY:'auto', marginBottom:'20px', paddingRight:'5px'}}>
                {vouchers.length > 0 ? (
                    vouchers.map((v) => (
                        <div 
                            key={v.voucherId}
                            onClick={() => { setSelectedVoucher(v); setBillAmount(''); setMessage({}); }}
                            style={{
                                padding: '15px', marginBottom:'10px', borderRadius: '8px', cursor: 'pointer',
                                border: selectedVoucher?.voucherId === v.voucherId ? '2px solid #D4AF37' : '1px solid #444',
                                backgroundColor: selectedVoucher?.voucherId === v.voucherId ? 'rgba(212, 175, 55, 0.1)' : '#2c2c2c',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={{color: '#fff', fontWeight: 'bold', fontSize:'16px'}}>{v.voucherType.name}</div>
                                <div style={{color: '#D4AF37', fontWeight:'bold'}}>
                                    {parseFloat(v.voucherType.value) > 0 ? `$${v.voucherType.value}` : 'FREE'}
                                </div>
                            </div>
                            <div style={{marginTop:'8px', fontSize:'12px', color:'#aaa', display:'flex', justifyContent:'space-between'}}>
                                <span>Min Spend: ${v.voucherType.threshold}</span>
                                <span style={{color: '#ff6b6b'}}>📅 {new Date(v.expiryDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{color:'#666', textAlign:'center', padding:'20px'}}>{t('No vouchers available.')}</p>
                )}
            </div>

            {selectedVoucher && (
                <div className="redeem-action-area" style={{borderTop:'1px solid #333', paddingTop:'20px'}}>
                    {parseFloat(selectedVoucher.voucherType.value) > 0 ? (
                        <>
                            <p style={{textAlign:'center', color:'#aaa', marginBottom:'5px'}}>{t('Enter Total Bill Amount')}:</p>
                            <div className="pos-display-screen" style={{marginBottom:'15px'}}>
                                {billAmount ? `$${billAmount}` : <span className="placeholder" style={{fontSize:'16px'}}>Min ${selectedVoucher.voucherType.threshold}</span>}
                            </div>
                            <NumPad 
                                onInput={handleNumInput} 
                                onDelete={handleDelete} 
                                onEnter={handleRedeem} 
                                label={loading ? "..." : t('REDEEM NOW')} 
                            />
                        </>
                    ) : (
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