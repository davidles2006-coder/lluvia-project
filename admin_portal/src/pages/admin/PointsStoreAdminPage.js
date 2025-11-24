// 这是 src/pages/admin/PointsStoreAdminPage.js (100% 干净)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './AdminPageStyles.css';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const UPLOAD_URL = `${API_BASE_URL}/admin/store/points/upload/`; 

const PointsStoreAdminPage = () => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [items, setItems] = useState([]); 
    const [voucherTypes, setVoucherTypes] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrlPreview, setImageUrlPreview] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        pointsCost: 0,
        linkedVoucherType: '',
        isActive: true
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/store/points/`, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            setItems(response.data);
        } catch (err) {
            setError(t('admin.store.error_fetch_items', 'Failed to fetch items.'));
        }
        setLoading(false);
    }, [staffToken, t]); // 🚩 修复：保留 staffToken 依赖

    const fetchVoucherTypes = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/voucher-types/`, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            setVoucherTypes(response.data);
        } catch (err) {
            setError(t('admin.store.error_fetch_vouchertypes', 'Failed to fetch voucher types.'));
        }
    }, [staffToken, t]);

    useEffect(() => {
        fetchItems();
        fetchVoucherTypes();
    }, [fetchItems, fetchVoucherTypes]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImageUrlPreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentItemId(null);
        setImageFile(null);
        setImageUrlPreview('');
        setFormData({
            name: '',
            description: '',
            imageUrl: '',
            pointsCost: 0,
            linkedVoucherType: '',
            isActive: true
        });
    };

    const uploadImage = async () => {
        if (!imageFile) return formData.imageUrl;

        setUploading(true);
        setError(null);
        const uploadData = new FormData();
        uploadData.append('image', imageFile);

        try {
            const response = await axios.post(UPLOAD_URL, uploadData, {
                headers: { 
                    'Authorization': `Token ${staffToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploading(false);
            return response.data.imageUrl;
        } catch (err) {
            setUploading(false);
            throw new Error(t('admin.announcement.upload_failed', 'Image upload failed.'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const finalImageUrl = await uploadImage(); 

            const url = isEditing 
                ? `${API_BASE_URL}/admin/store/points/${currentItemId}/`
                : `${API_BASE_URL}/admin/store/points/`;
            
            const method = isEditing ? 'put' : 'post';

            // 🚩 终极修复：确保空字符串 ('') 被转换为 0 或 null
            const dataToSend = {
                ...formData,
                imageUrl: finalImageUrl,
                pointsCost: parseInt(formData.pointsCost || 0, 10),
                linkedVoucherType: formData.linkedVoucherType ? parseInt(formData.linkedVoucherType, 10) : null
            };

            await axios[method](url, dataToSend, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            
            resetForm();
            fetchItems(); 

        } catch (err) {
            const submitError = err.message || t('admin.store.error_submit', 'Failed to save item.');
            setError(submitError);
        }
        setLoading(false);
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setCurrentItemId(item.id);
        setImageFile(null);
        setImageUrlPreview(item.imageUrl);
        setFormData({
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            pointsCost: item.pointsCost,
            linkedVoucherType: item.linkedVoucherType, 
            isActive: item.isActive
        });
        window.scrollTo(0, 0); 
    };

    const handleDeleteClick = async (itemId) => {
        if (window.confirm(t('admin.store.confirm_delete', 'Are you sure you want to delete this item?'))) {
            setLoading(true);
            try {
                await axios.delete(`${API_BASE_URL}/admin/store/points/${itemId}/`, {
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
            <h2>{t('sidebar.store_points', 'Points Store Management')}</h2>
            
            {error && <div className="message error-message">{error}</div>}

            <div className="tab-content-real">
                <h3>{isEditing ? t('admin.store.edit_item', 'Edit Item') : t('admin.store.create_item', 'Create New Item')}</h3>
                <form onSubmit={handleSubmit} className="tab-form">
                    
                    <div className="form-group">
                        <label htmlFor="name">{t('admin.store.name', 'Name')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pointsCost">{t('admin.store.pointsCost', 'Points Cost')}</label>
                        <input type="number" name="pointsCost" value={formData.pointsCost} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkedVoucherType">{t('admin.store.voucher_type', 'Linked Voucher Type (The Product)')}</label>
                        <select name="linkedVoucherType" value={formData.linkedVoucherType} onChange={handleInputChange} required>
                            <option value="">{t('admin.store.select_voucher', '--- Select Voucher ---')}</option>
                            {voucherTypes.map(vt => (
                                <option key={vt.id} value={vt.id}>
                                    {vt.name} (Stock: {vt.stockCount === null ? '∞' : vt.stockCount})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">{t('admin.store.description', 'Description')}</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} />
                    </div>

                    <div className="form-group image-upload-group">
                        <label>{t('admin.store.image_upload', 'Store Image Upload')}</label>
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                        
                        {imageUrlPreview && (
                            <div className="image-preview-container">
                                <img 
                                    src={imageUrlPreview} 
                                    alt="Store Item Preview" 
                                    className="image-preview" 
                                />
                            </div>
                        )}
                        <p className="image-url-text">URL: {formData.imageUrl || t('admin.announcement.no_image', 'No image selected')}</p>
                    </div>
                    
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="isActive">{t('admin.store.isActive', 'Is Active?')}</label>
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} style={{ width: 'auto' }} />
                    </div>

                    <button type="submit" disabled={loading || uploading} className="submit-button">
                         {uploading 
                            ? t('admin.announcement.uploading', 'Uploading Image...') 
                            : loading ? t('member.loading', 'Processing...') : (isEditing ? t('admin.store.update_button', 'Update Item') : t('admin.store.create_button', 'Create Item'))}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={resetForm} disabled={loading || uploading} className="submit-button" style={{ backgroundColor: '#6c757d' }}>
                            {t('admin.store.cancel_edit', 'Cancel Edit')}
                        </button>
                    )}
                </form>
            </div>

            <hr className="divider" />

            <h3>{t('admin.store.item_list', 'Item List')}</h3>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.store.name', 'Name')}</th>
                            <th>{t('admin.store.pointsCost', 'Points Cost')}</th>
                            <th>{t('admin.store.voucher_type', 'Linked Voucher Type')}</th>
                            <th>{t('admin.store.isActive', 'Is Active?')}</th>
                            <th>{t('admin.store.actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.pointsCost}</td>
                                <td>{item.linkedVoucherType_name}</td> 
                                <td>{item.isActive ? '✅' : '❌'}</td>
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

export default PointsStoreAdminPage;