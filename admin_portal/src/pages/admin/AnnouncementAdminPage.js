// src/pages/admin/AnnouncementAdminPage.js - V61 (补全 Content 字段)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './AdminPageStyles.css';

import { API_BASE_URL as API_ROOT } from '../../config';

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

const AnnouncementAdminPage = () => {
    const { t } = useTranslation();
    const staffToken = localStorage.getItem('staffToken');

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imageUrlPreview, setImageUrlPreview] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);

    // 🚩 V61: 状态里加上 content
    const [formData, setFormData] = useState({
        title: '',
        content: '', // 新增
        actionUrl: '',
        displayOrder: 0,
        isActive: true,
        expiryDate: '',
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/announcements/`, {
                headers: { 'Authorization': `Token ${staffToken}` }
            });
            setItems(response.data);
        } catch (err) {
            setError(t('admin.announcement.error_fetch', 'Failed to fetch announcements.'));
        }
        setLoading(false);
    }, [staffToken, t]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

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
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentItemId(null);
        setImageFile(null);
        setImageUrlPreview('');
        // 🚩 V61: 重置 content
        setFormData({
            title: '',
            content: '', 
            actionUrl: '',
            displayOrder: 0,
            isActive: true,
            expiryDate: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = isEditing 
                ? `${API_BASE_URL}/admin/announcements/${currentItemId}/`
                : `${API_BASE_URL}/admin/announcements/`;
            
            const method = isEditing ? 'put' : 'post';

            const dataToSend = new FormData();
            dataToSend.append('title', formData.title);
            // 🚩 V61: 发送 content
            dataToSend.append('content', formData.content); 
            dataToSend.append('actionUrl', formData.actionUrl);
            dataToSend.append('displayOrder', parseInt(formData.displayOrder || 0, 10));
            dataToSend.append('isActive', formData.isActive);
            
            if (formData.expiryDate) {
                dataToSend.append('expiryDate', formData.expiryDate);
            }

            if (imageFile) {
                dataToSend.append('image', imageFile);
            }

            await axios[method](url, dataToSend, {
                headers: { 'Authorization': `Token ${staffToken}` } 
                // 让 axios 自动处理 Content-Type
            });
            
            resetForm();
            fetchItems(); 

        } catch (err) {
            console.error(err);
            setError(t('admin.store.error_submit', 'Failed to save.'));
        }
        setLoading(false);
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setCurrentItemId(item.id);
        
        const formattedExpiryDate = item.expiryDate 
            ? item.expiryDate.substring(0, 10) 
            : '';

        setImageFile(null); 
        
        // 处理图片预览 (兼容后端返回的格式)
        const imgPreview = item.image || item.imageUrl;
        setImageUrlPreview(imgPreview); 
        
        // 🚩 V61: 加载 content 到表单
        setFormData({
            title: item.title,
            content: item.content || '', // 防止 null
            imageUrl: imgPreview, 
            actionUrl: item.actionUrl,
            displayOrder: item.displayOrder,
            isActive: item.isActive,
            expiryDate: formattedExpiryDate,
        });
        window.scrollTo(0, 0); 
    };

    const handleDeleteClick = async (itemId) => {
        if (window.confirm(t('admin.store.confirm_delete'))) {
            setLoading(true);
            try {
                await axios.delete(`${API_BASE_URL}/admin/announcements/${itemId}/`, {
                    headers: { 'Authorization': `Token ${staffToken}` }
                });
                fetchItems(); 
            } catch (err) {
                setError(t('admin.store.error_delete'));
            }
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <h2>{t('sidebar.content_announcements', 'Announcement Management')}</h2>
            
            {error && <div className="message error-message">{error}</div>}

            <div className="tab-content-real">
                <h3>{isEditing ? t('admin.announcement.edit') : t('admin.announcement.create')}</h3>
                
                <form onSubmit={handleSubmit} className="tab-form">
                    
                    {/* 图片上传 */}
                    <div className="form-group image-upload-group">
                        <label>{t('admin.announcement.image_upload', 'Banner Image')}</label>
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                        
                        {imageUrlPreview && (
                            <div className="image-preview-container">
                                <img src={imageUrlPreview} alt="Preview" className="image-preview" />
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>{t('admin.announcement.title', 'Title')}</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>

                    {/* 🚩 V61: 内容输入框 (Textarea) */}
                    <div className="form-group">
                        <label>{t('admin.announcement.content', 'Content (Details)')}</label>
                        <textarea 
                            name="content" 
                            value={formData.content} 
                            onChange={handleInputChange} 
                            placeholder="Enter details here..."
                            style={{minHeight: '100px'}}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('admin.announcement.actionUrl', 'Action URL')}</label>
                        <input type="text" name="actionUrl" value={formData.actionUrl} onChange={handleInputChange} placeholder="http://..." />
                    </div>

                    <div className="form-group">
                        <label>{t('admin.announcement.displayOrder', 'Order')}</label>
                        <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleInputChange} step="1" />
                    </div>

                    <div className="form-group">
                        <label>{t('admin.announcement.expiryDate', 'Expiry Date')}</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} />
                    </div>

                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <label>{t('admin.store.isActive', 'Is Active?')}</label>
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} style={{ width: 'auto' }} />
                    </div>

                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? t('member.loading') : (isEditing ? t('admin.store.update_button') : t('admin.store.create_button'))}
                    </button>
                    
                    {isEditing && (
                        <button type="button" onClick={resetForm} className="submit-button" style={{ backgroundColor: '#6c757d' }}>
                            {t('admin.store.cancel_edit')}
                        </button>
                    )}
                </form>
            </div>

            <hr className="divider" />

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.announcement.title')}</th>
                            {/* 🚩 V61: 表格标题加一列 Content */}
                            <th>{t('admin.announcement.content', 'Content')}</th>
                            <th>{t('admin.announcement.displayOrder')}</th>
                            <th>{t('admin.store.isActive')}</th>
                            <th>{t('admin.store.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.title}</td>
                                {/* 🚩 V61: 显示内容摘要 (超过30字显示...) */}
                                <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                    {item.content ? (item.content.length > 30 ? item.content.substring(0, 30) + '...' : item.content) : '-'}
                                </td>
                                <td>{item.displayOrder}</td>
                                <td>{item.isActive ? '✅' : '❌'}</td>
                                <td>
                                    <button onClick={() => handleEditClick(item)} className="action-button edit">{t('admin.store.edit')}</button>
                                    <button onClick={() => handleDeleteClick(item.id)} className="action-button delete">{t('admin.store.delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnnouncementAdminPage;