// src/pages/admin/FinancialReportPage.js - V200 (日期日结版)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../../config';
import '../AdminPageStyles.css'; 

const API_BASE_URL = `${API_ROOT}/api`;

const FinancialReportPage = () => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');
    
    // 默认选今天 (格式 YYYY-MM-DD)
    // 注意: new Date().toISOString() 是 UTC 时间，如果想要本地时间，需要手动处理
    // 这里用简单的方法获取本地 YYYY-MM-DD
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 获取报表数据
    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // 调用后端新接口
            const response = await axios.get(`${API_BASE_URL}/admin/reports/?date=${selectedDate}`, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to load report.');
        }
        setLoading(false);
    }, [selectedDate, staffToken]);

    // 每次日期变化，自动刷新
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // 简单的 CSV 导出功能
    const downloadCSV = () => {
        if (!reportData) return;
        let csv = `Time,Type,Amount,Member,Staff\n`;
        
        const processList = (list) => {
            list.forEach(row => {
                // 处理逗号，防止 CSV 错位
                const cleanType = row.type.replace('CONSUME_', '').replace('REDEEM_', '');
                const cleanMember = (row.member_name || '').replace(',', ' ');
                const dateStr = new Date(row.date).toLocaleTimeString();
                csv += `${dateStr},${cleanType},${row.amount},${cleanMember},${row.staff_name}\n`;
            });
        };

        processList(reportData.recharges);
        processList(reportData.cash_income);
        processList(reportData.balance_usage);
        processList(reportData.voucher_usage);

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${selectedDate}.csv`;
        a.click();
    };

    return (
        <div className="admin-page-container">
            <h2 style={{color:'#D4AF37', marginBottom:'20px'}}>{t('Financial Daily Report')}</h2>

            {/* 1. 日期选择栏 */}
            <div style={{
                background:'#222', padding:'20px', borderRadius:'12px', 
                marginBottom:'20px', border:'1px solid #444',
                display:'flex', flexWrap:'wrap', gap:'15px', alignItems:'center', justifyContent:'space-between'
            }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <label style={{color:'#fff', fontWeight:'bold'}}>📅 {t('Date')}:</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding:'10px', borderRadius:'8px', border:'1px solid #666', 
                            background:'#333', color:'#fff', fontSize:'16px', fontFamily:'monospace'
                        }}
                    />
                    <button className="action-button edit" onClick={fetchReport} style={{padding:'10px 20px'}}>
                        🔄 {t('Refresh')}
                    </button>
                </div>
                
                <button className="action-button delete" onClick={downloadCSV} style={{background:'#0056b3'}}>
                    📥 Export CSV
                </button>
            </div>

            {loading && <p style={{color:'#aaa', textAlign:'center'}}>{t('Loading...')}</p>}
            {error && <p style={{color:'#e74c3c', textAlign:'center'}}>{error}</p>}

            {!loading && reportData && (
                <>
                    {/* 2. 当日汇总卡片 (Dashboard) */}
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'40px'}}>
                        {/* 充值收入 */}
                        <div style={{background:'#1b3a2b', padding:'20px', borderRadius:'10px', border:'1px solid #2ecc71', textAlign:'center'}}>
                            <div style={{color:'#aaa', fontSize:'13px', textTransform:'uppercase'}}>{t('Total Recharge')}</div>
                            <div style={{color:'#2ecc71', fontSize:'32px', fontWeight:'bold', marginTop:'5px'}}>
                                +${reportData.summary?.total_recharge || 0}
                            </div>
                            <div style={{color:'#2ecc71', fontSize:'12px'}}>Cash In</div>
                        </div>

                        {/* 现金消费收入 */}
                        <div style={{background:'#3e2723', padding:'20px', borderRadius:'10px', border:'1px solid #f39c12', textAlign:'center'}}>
                            <div style={{color:'#aaa', fontSize:'13px', textTransform:'uppercase'}}>{t('Total Cash Spend')}</div>
                            <div style={{color:'#f39c12', fontSize:'32px', fontWeight:'bold', marginTop:'5px'}}>
                                +${reportData.summary?.total_cash_income || 0}
                            </div>
                            <div style={{color:'#f39c12', fontSize:'12px'}}>Cash In</div>
                        </div>
                    </div>

                    {/* 3. 详细列表 (按类别) */}
                    <SectionTitle title={`💰 ${t('Recharges')} (${reportData.recharges.length})`} color="#2ecc71" />
                    <TransactionTable data={reportData.recharges} />

                    <SectionTitle title={`💳 ${t('Cash Spending')} (${reportData.cash_income.length})`} color="#f39c12" />
                    <TransactionTable data={reportData.cash_income} />
                    
                    <SectionTitle title={`📉 ${t('Balance Usage')} (${reportData.balance_usage.length})`} color="#e74c3c" />
                    <TransactionTable data={reportData.balance_usage} />

                    <SectionTitle title={`🎫 ${t('Voucher Usage')} (${reportData.voucher_usage.length})`} color="#D4AF37" />
                    <TransactionTable data={reportData.voucher_usage} />
                </>
            )}
        </div>
    );
};

// 子组件：标题分割线
const SectionTitle = ({ title, color }) => (
    <h3 style={{
        color: color, 
        borderBottom: `2px solid ${color}`, 
        paddingBottom: '10px', 
        marginTop: '40px', 
        fontSize: '18px',
        display: 'flex', alignItems: 'center', gap: '10px'
    }}>
        {title}
    </h3>
);

// 子组件：表格
const TransactionTable = ({ data }) => {
    if (!data || data.length === 0) return <p style={{color:'#555', fontStyle:'italic', padding:'10px'}}>No records.</p>;
    
    return (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{width:'15%'}}>Time</th>
                        <th style={{width:'35%'}}>Member</th>
                        <th style={{width:'20%'}}>Amount</th>
                        <th style={{width:'30%'}}>Staff</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(t => (
                        <tr key={t.id}>
                            <td style={{color:'#888', fontSize:'13px'}}>
                                {new Date(t.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td>{t.member_name}</td>
                            <td style={{
                                fontWeight:'bold', 
                                color: t.amount > 0 ? '#2ecc71' : (t.type.includes('CONSUME') ? '#e74c3c' : '#fff')
                            }}>
                                {t.amount > 0 ? '+' : ''}{t.amount}
                            </td>
                            <td style={{color:'#aaa', fontSize:'12px'}}>{t.staff_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FinancialReportPage;