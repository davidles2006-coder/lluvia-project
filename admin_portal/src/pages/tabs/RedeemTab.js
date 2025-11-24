// src/pages/tabs/RedeemTab.js - V59 (翻译补全 + 手动输入金额版)
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

 import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const RedeemTab = ({ member, vouchers, onMemberUpdate }) => {
    const { t } = useTranslation();

    const [selectedVoucherId, setSelectedVoucherId] = useState(null); 
    const [billAmount, setBillAmount] = useState(''); 
    const [minBillAmount, setMinBillAmount] = useState('0.01'); 
    
    const [loading, setLoading] = useState(false);
    
    const staffToken = localStorage.getItem('staffToken');

    const handleSelectVoucher = (voucher) => {
        const isProductVoucher = (parseFloat(voucher.voucherType.value) === 0);
        
        setSelectedVoucherId(voucher.voucherId);
        
        // 🚩 修复逻辑：不管是什么券，都先清空输入框，让员工自己填
        setBillAmount(''); 
        
        if (isProductVoucher) {
            // 产品券: 最小值可以是 0
            setMinBillAmount('0'); 
        } else {
            // 折扣券: 设置最小值为门槛 (只做验证用，不自动填入)
            const threshold = voucher.voucherType.threshold || '0.01';
            setMinBillAmount(String(threshold)); 
        }
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!selectedVoucherId) return;
        
        if (!window.confirm(t('Confirm') + "?")) return;

        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/admin/redeem_voucher/`, {
                voucher_id: selectedVoucherId,
                // 如果输入框是空的，传 0 (针对产品券)，否则传输入的数值
                bill_amount: billAmount ? parseFloat(billAmount) : 0 
            }, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });

            alert(t('Success'));
            
            setSelectedVoucherId(null); 
            setBillAmount('');
            onMemberUpdate(); 

        } catch (err) {
            alert(t('Failed') + ": " + (err.response?.data?.detail || err.response?.data?.error || ""));
        }
        setLoading(false);
    };

    return (
        <div style={{padding: '20px'}}>
            <h3 style={{color: '#fff', marginTop: 0, marginBottom: '20px', borderLeft: '4px solid #0056b3', paddingLeft: '10px'}}>
                {t('Redeem Voucher')}
            </h3>
            
            {/* 1. 代金券列表 */}
            <div style={{marginBottom: '30px'}}>
                <h4 style={{color: '#aaa', marginBottom: '10px'}}>{t('Vouchers Available')} ({vouchers.length})</h4>
                
                {vouchers.length > 0 ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {vouchers.map((v) => (
                            <div 
                                key={v.voucherId}
                                onClick={() => handleSelectVoucher(v)}
                                style={{
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: selectedVoucherId === v.voucherId ? '2px solid #0056b3' : '1px solid #444',
                                    backgroundColor: selectedVoucherId === v.voucherId ? '#002140' : '#2c2c2c',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{color: '#D4AF37', fontWeight: 'bold', fontSize: '16px'}}>
                                    {v.voucherType.name}
                                </div>
                                <div style={{color: '#888', fontSize: '12px', marginTop: '5px'}}>
                                    {/* 🚩 修复翻译: 使用 t() */}
                                    {t('Value')}: ${v.voucherType.value} | {t('Threshold')}: ${v.voucherType.threshold}
                                </div>
                                <div style={{color: '#888', fontSize: '12px'}}>
                                    {/* 🚩 修复翻译: 使用 t() */}
                                    {t('Expires')}: {new Date(v.expiryDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{color: '#666'}}>{t('No vouchers available.')}</p>
                )}
            </div>

            {/* 2. 账单金额输入 (仅当选中券时显示) */}
            {selectedVoucherId && (
                <form onSubmit={handleRedeem} className="consume-form">
                    <div className="form-group">
                        <label style={{color: '#aaa', display: 'block', marginBottom: '5px'}}>
                            {/* 🚩 修复翻译 */}
                            {t('Bill Amount')}
                        </label>
                        <input
                            type="number"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            min={minBillAmount}
                            step="0.01"
                            // placeholder 显示最小值提示
                            placeholder={`Min: $${minBillAmount}`} 
                            required
                            className="admin-input"
                            style={{
                                width: '100%', padding: '15px', fontSize: '24px', 
                                backgroundColor: '#2c2c2c', border: '2px solid #444', 
                                borderRadius: '8px', color: '#fff', 
                                textAlign: 'center', fontWeight: 'bold', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn-action"
                        style={{
                            backgroundColor: '#0056b3', width: '100%', padding: '15px', 
                            fontSize: '18px', marginTop: '20px', color: 'white', 
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                        disabled={loading}
                    >
                        {loading ? t('Processing...') : t('Redeem')}
                    </button>
                </form>
            )}
        </div>
    );
};

export default RedeemTab;