// 这是 src/pages/ProfileEditModal.js 文件的最终代码

import React, { useState } from 'react';
import axios from 'axios';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = API_ROOT; // 🚩 加上 /api/ 变成最终 API 地址

function ProfileEditModal({ profile, token, onClose, onUpdate }) {

    const [formData, setFormData] = useState({
        nickname: profile.nickname || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        flair: profile.flair || '',
    });
    const [avatarFile, setAvatarFile] = useState(null); 
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setAvatarFile(e.target.files[0]);
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;

        setUploading(true);
        setError('');

        const data = new FormData();
        data.append('avatar', avatarFile); 

        try {
            const response = await axios.post(`${API_URL}/profile/avatar/`, data, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });

            console.log('头像上传成功:', response.data.avatarUrl);
            return response.data.avatarUrl; 

        } catch (err) {
            console.error("Avatar upload error:", err.response);
            setError('头像上传失败。文件过大或格式错误。');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setUploading(true);

        let newAvatarUrl = profile.avatarUrl; 

        try {
            // 1. 如果选择了新头像，先上传头像
            if (avatarFile) {
                const uploadedUrl = await handleAvatarUpload();
                if (!uploadedUrl) {
                    setUploading(false);
                    return;
                }
                newAvatarUrl = uploadedUrl;
            }

            // 2. 调用 PATCH API 更新文本和 URL
            const response = await axios.patch(`${API_URL}/profile/`, 
                {
                    ...formData, 
                    avatarUrl: newAvatarUrl, 
                }, 
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );

            // 3. 成功!
            onUpdate(response.data); 
            onClose(); 

        } catch (err) {
            console.error("Profile update error:", err.response);
            const errors = err.response?.data ? Object.values(err.response.data).join(' / ') : '更新失败。';
            setError(errors);
        } finally {
            setUploading(false);
        }
    };

    // --- 渲染 (HTML/JSX) ---
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>编辑个人资料 (V8/V15)</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">

                    {/* 1. V8 头像区域 */}
                    <div className="avatar-section">
                        {/* V8 修复: 使用本地预览或昵称首字母 */}
                        {avatarFile ? (
                            <img src={URL.createObjectURL(avatarFile)} alt="预览" className="current-avatar modal" />
                        ) : profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="当前头像" className="current-avatar modal" />
                        ) : (
                            <span className="current-avatar modal text-fallback">
                                {profile.nickname.charAt(0)}
                            </span>
                        )}
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                    </div>

                    {/* 2. V15 文本字段 */}
                    <input name="nickname" type="text" placeholder="昵称" value={formData.nickname} onChange={handleChange} required />
                    <input name="phone" type="tel" placeholder="电话号码" value={formData.phone} onChange={handleChange} required />
                    <input name="dob" type="date" placeholder="出生日期" value={formData.dob} onChange={handleChange} required />
                    <input name="flair" type="text" placeholder="风格 / 角色" value={formData.flair} onChange={handleChange} />

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" disabled={uploading}>
                        {uploading ? '正在保存...' : '保存资料'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileEditModal;