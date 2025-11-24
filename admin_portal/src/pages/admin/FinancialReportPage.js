// src/pages/admin/FinancialReportPage.js - V70 (月度查询功能版)
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './AdminPageStyles.css';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const FinancialReportPage = () => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [rawData, setRawData] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('recharge'); 
    
    const [timeFilter, setTimeFilter] = useState('month'); // 默认看本月
    
    // 🚩 V70 新增: 存储选中的月份 (默认为当前月份 YYYY-MM)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/reports/`, {
                    headers: { 'Authorization': `Token ${staffToken}` }
                });
                setRawData(response.data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, [staffToken]);

    // 🚩 V70 升级: 筛选逻辑
    const filteredData = useMemo(() => {
        if (!rawData) return null;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const filterList = (list) => {
            if (timeFilter === 'all') return list;
            
            return list.filter(item => {
                const itemDate = new Date(item.date);
                
                if (timeFilter === 'today') return itemDate >= startOfDay;
                if (timeFilter === 'month') return itemDate >= startOfMonth;
                if (timeFilter === 'year') return itemDate >= startOfYear;
                
                // 🚩 V70 新增: 指定月份筛选
                if (timeFilter === 'custom_month') {
                    // selectedMonth 格式是 "2025-11"
                    const [year, month] = selectedMonth.split('-');
                    return itemDate.getFullYear() === parseInt(year) && 
                           (itemDate.getMonth() + 1) === parseInt(month);
                }
                
                return true;
            });
        };

        return {
            recharges: filterList(rawData.recharges),
            balance_usage: filterList(rawData.balance_usage),
            voucher_usage: filterList(rawData.voucher_usage),
            cash_income: filterList(rawData.cash_income)
        };
    }, [rawData, timeFilter, selectedMonth]); // 依赖项加上 selectedMonth

    const stats = useMemo(() => {
        if (!filteredData) return { recharge: 0, balance: 0, voucher: 0, cash: 0 };
        const sum = (arr) => arr.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        return {
            recharge: sum(filteredData.recharges),
            balance: Math.abs(sum(filteredData.balance_usage)),
            voucher: Math.abs(sum(filteredData.voucher_usage)),
            cash: Math.abs(sum(filteredData.cash_income))
        };
    }, [filteredData]);

    // 🚩 V71 修复: 强制使用新加坡时间显示
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('zh-CN', { 
            timeZone: 'Asia/Singapore', // 强制时区
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24小时制
        });
    };

    if (loading) return <div className="admin-page-container" style={{color:'white'}}>Loading...</div>;
    if (!rawData) return <div className="admin-page-container" style={{color:'red'}}>Failed to load data</div>;

    const renderTable = (transactions) => (
        <div className="tab-content-real">
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{width: '25%'}}>{t('report.date')}</th>
                            <th style={{width: '25%'}}>{t('report.member')}</th>
                            <th style={{width: '25%'}}>{t('report.amount')}</th>
                            <th style={{width: '25%'}}>{t('report.points')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(txn => (
                            <tr key={txn.id}>
                                <td style={{color: '#888', fontSize:'13px'}}>{formatDate(txn.date)}</td>
                                <td>
                                    <div style={{color:'#fff'}}>{txn.member_name}</div>
                                    <div style={{fontSize:'12px', color:'#555'}}>{txn.member_email}</div>
                                </td>
                                <td style={{
                                    color: parseFloat(txn.amount) >= 0 ? '#2ecc71' : '#ff4d4f',
                                    fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace'
                                }}>
                                    {parseFloat(txn.amount) > 0 ? '+' : ''}{txn.amount}
                                </td>
                                <td style={{color: '#D4AF37'}}>{txn.points !== 0 ? txn.points : '-'}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr><td colSpan="4" style={{textAlign:'center', color:'#666', padding:'30px'}}>No records found in this period</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="admin-page-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{margin:0, border:0, padding:0}}>{t('sidebar.nav_finance')}</h2>
                
                {/* V70: 增强版时间筛选器 */}
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <label style={{color:'#aaa'}}>{t('report.Time Range')}:</label>
                    
                    {/* 如果选了按月查询，显示月份选择器 */}
                    {timeFilter === 'custom_month' && (
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{padding:'7px', borderRadius:'4px', background:'#2c2c2c', color:'white', border:'1px solid #1890ff'}}
                        />
                    )}

                    <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                        style={{padding:'8px', borderRadius:'4px', background:'#2c2c2c', color:'white', border:'1px solid #444'}}
                    >
                        <option value="today">{t('report.filter_today')}</option>
                        <option value="month">{t('report.filter_month')}</option>
                        <option value="year">{t('report.filter_year')}</option>
                        <option value="all">{t('report.filter_all')}</option>
                        <option value="custom_month">📅 {t('report.filter_custom_month')}</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card stat-green">
                    <div className="stat-title">{t('report.title_recharge')}</div>
                    <div className="stat-value">+${stats.recharge.toFixed(2)}</div>
                </div>
                <div className="stat-card stat-red">
                    <div className="stat-title">{t('report.title_balance')}</div>
                    <div className="stat-value">-${stats.balance.toFixed(2)}</div>
                </div>
                <div className="stat-card stat-gold">
                    <div className="stat-title">{t('report.title_voucher')}</div>
                    <div className="stat-value">-${stats.voucher.toFixed(2)}</div>
                </div>
                <div className="stat-card stat-blue">
                    <div className="stat-title">{t('report.title_cash')}</div>
                    <div className="stat-value">+${stats.cash.toFixed(2)}</div>
                </div>
            </div>

            <div style={{display: 'flex', gap: '10px', marginBottom: '0'}}>
                <button onClick={() => setActiveTab('recharge')} className={`submit-button ${activeTab==='recharge'?'':'secondary'}`} style={{background: activeTab==='recharge'?'#2ecc71':'#333', borderBottomLeftRadius:0, borderBottomRightRadius:0}}>
                    {t('report.tab_recharge')}
                </button>
                <button onClick={() => setActiveTab('balance')} className={`submit-button ${activeTab==='balance'?'':'secondary'}`} style={{background: activeTab==='balance'?'#ff4d4f':'#333', borderBottomLeftRadius:0, borderBottomRightRadius:0}}>
                    {t('report.tab_balance')}
                </button>
                <button onClick={() => setActiveTab('voucher')} className={`submit-button ${activeTab==='voucher'?'':'secondary'}`} style={{background: activeTab==='voucher'?'#D4AF37':'#333', borderBottomLeftRadius:0, borderBottomRightRadius:0}}>
                    {t('report.tab_voucher')}
                </button>
                <button onClick={() => setActiveTab('cash')} className={`submit-button ${activeTab==='cash'?'':'secondary'}`} style={{background: activeTab==='cash'?'#1890ff':'#333', borderBottomLeftRadius:0, borderBottomRightRadius:0}}>
                    {t('report.tab_cash')}
                </button>
            </div>

            <div style={{borderTop: '2px solid #333'}}>
                {activeTab === 'recharge' && renderTable(filteredData.recharges)}
                {activeTab === 'balance' && renderTable(filteredData.balance_usage)}
                {activeTab === 'voucher' && renderTable(filteredData.voucher_usage)}
                {activeTab === 'cash' && renderTable(filteredData.cash_income)}
            </div>

        </div>
    );
};

export default FinancialReportPage;