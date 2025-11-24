// 这是 src/pages/admin/VoucherTypeAdminPage.js (100% 干净)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './AdminPageStyles.css';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const VoucherTypeAdminPage = () => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        value: 0.00,
        threshold: 0.00,
        expiryDays: 90,
        costOfGoods: 0.00,
        stockCount: null,
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/voucher-types/`, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            setItems(response.data);
        } catch (err) {
            setError(t('admin.vouchertype.error_fetch', 'Failed to fetch voucher types.'));
        }
        setLoading(false);
    }, [staffToken, t]); // 🚩 修复：保留 staffToken 依赖

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'stockCount' && value === '') {
             setFormData(prev => ({ ...prev, stockCount: null }));
             return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentItemId(null);
        setFormData({
            name: '',
            value: 0.00,
            threshold: 0.00,
            expiryDays: 90,
            costOfGoods: 0.00,
            stockCount: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = isEditing 
            ? `${API_BASE_URL}/admin/voucher-types/${currentItemId}/`
            : `${API_BASE_URL}/admin/voucher-types/`;
        
        const method = isEditing ? 'put' : 'post';

        // 🚩 终极修复：确保空字符串 ('') 被转换为 0 或 null
        const dataToSend = {
            ...formData,
            value: parseFloat(formData.value || 0),
            threshold: parseFloat(formData.threshold || 0),
            expiryDays: parseInt(formData.expiryDays || 0, 10),
            costOfGoods: parseFloat(formData.costOfGoods || 0),
            stockCount: (formData.stockCount === null || formData.stockCount === '') ? null : parseInt(formData.stockCount, 10)
        };

        try {
            await axios[method](url, dataToSend, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            resetForm();
            fetchItems(); 
        } catch (err) {
            setError(t('admin.vouchertype.error_submit', 'Failed to save voucher type.'));
        }
        setLoading(false);
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setCurrentItemId(item.id);
        setFormData({
            name: item.name,
            value: item.value,
            threshold: item.threshold,
            expiryDays: item.expiryDays,
            costOfGoods: item.costOfGoods || 0.00,
            stockCount: item.stockCount,
        });
        window.scrollTo(0, 0); 
    };

    const handleDeleteClick = async (itemId) => {
        if (window.confirm(t('admin.store.confirm_delete', 'Are you sure you want to delete this item?'))) {
            setLoading(true);
            try {
                await axios.delete(`${API_BASE_URL}/admin/voucher-types/${itemId}/`, {
                    headers: { 'Authorization': `Token ${staffToken}` }
                });
                fetchItems(); 
            } catch (err) {
                setError(t('admin.store.error_delete', 'Failed to delete item.'));
            }
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <h2>{t('sidebar.store_vouchertypes', 'Product & Voucher Management')}</h2>
            
            {error && <div className="message error-message">{error}</div>}

            <div className="tab-content-real">
                <h3>{isEditing ? t('admin.vouchertype.edit', 'Edit Product/Voucher') : t('admin.vouchertype.create', 'Create New Product/Voucher')}</h3>
                
                <form onSubmit={handleSubmit} className="tab-form">
                    
                    <div className="form-group">
                        <label htmlFor="name">{t('admin.store.name', 'Name')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="value">{t('admin.vouchertype.value', 'Value ($) (e.g., 50.00)')}</label>
                        <input type="number" name="value" value={formData.value} onChange={handleInputChange} step="0.01" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="threshold">{t('admin.vouchertype.threshold', 'Threshold ($) (e.g., 100.00)')}</label>
                        <input type="number" name="threshold" value={formData.threshold} onChange={handleInputChange} step="0.01" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="expiryDays">{t('admin.vouchertype.expiryDays', 'Expiry Days (e.g., 90)')}</label>
                        <input type="number" name="expiryDays" value={formData.expiryDays} onChange={handleInputChange} step="1" required />
                    </div>
                    
                    <hr className="divider" />
                    
                    <div className="form-group">
                        <label htmlFor="costOfGoods">{t('admin.vouchertype.costOfGoods', 'Cost of Goods ($) (For physical items)')}</label>
                        <input type="number" name="costOfGoods" value={formData.costOfGoods} onChange={handleInputChange} step="0.01" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="stockCount">{t('admin.vouchertype.stockCount', 'Stock Count (Leave blank for infinite)')}</label>
                        <input type="number" name="stockCount" value={formData.stockCount === null ? '' : formData.stockCount} onChange={handleInputChange} step="1" placeholder="Blank = Infinite Stock" />
                    </div>

                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? t('member.loading', 'Processing...') : (isEditing ? t('admin.store.update_button', 'Update Item') : t('admin.store.create_button', 'Create Item'))}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={resetForm} disabled={loading} className="submit-button" style={{ backgroundColor: '#6c757d' }}>
                            {t('admin.store.cancel_edit', 'Cancel Edit')}
                        </button>
                    )}
                </form>
            </div>

            <hr className="divider" />

            <h3>{t('admin.vouchertype.list', 'Product/Voucher List')}</h3>
            {loading && <p>{t('member.loading', 'Processing...')}</p>}
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.store.name', 'Name')}</th>
                            <th>{t('admin.vouchertype.value', 'Value')}</th>
                            <th>{t('admin.vouchertype.costOfGoods', 'Cost')}</th>
                            <th>{t('admin.vouchertype.stockCount', 'Stock')}</th>
                            <th>{t('admin.store.actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>${item.value}</td>
                                <td>${item.costOfGoods || '0.00'}</td>
                                <td>{item.stockCount === null ? '∞ (Infinite)' : item.stockCount}</td>
                                <td>
                                    <button onClick={() => handleEditClick(item)} className="action-button edit">
                                        {t('admin.store.edit', 'Edit')}
                                    </button>
                                    <button onClick={() => handleDeleteClick(item.id)} className="action-button delete">
                                        {t('admin.store.delete', 'Delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VoucherTypeAdminPage;