// src/pages/PasswordResetConfirmPage.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../pages/LoginPage.css'; 

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

function PasswordResetConfirmPage() {
  const { uid, token } = useParams(); // 从 URL 获取 UID 和 Token
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError(t('reset.password_mismatch', 'Passwords do not match.'));
      setIsLoading(false);
      return;
    }

    try {
      // 🚩 V74: 调用后端 API 确认重置密码
      const response = await axios.post(`${API_BASE_URL}/api/auth/password/reset/confirm/`, {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword // Django 可能会要求两次输入
      });

      if (response.status === 200 || response.status === 204) {
        setMessage(t('reset.reset_success', 'Password reset successfully! Redirecting to login...'));
        setTimeout(() => navigate('/login'), 3000); // 3秒后跳转
      } else {
        throw new Error('Reset failed.');
      }
    } catch (err) {
      console.error(err);
      setError(t('reset.reset_failed', 'Reset failed. Link may be invalid or expired.'));
    }
    setIsLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        <h1 className="v11-login-title">LLUVIA</h1>
        <h2 className="v11-login-subtitle">{t('Set New Password')}</h2>

        <form onSubmit={handleSubmit} className="v11-login-form">
          <div className="v11-input-group">
            <label>{t('New Password')}</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="v11-input-group">
            <label>{t('Confirm Password')}</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          {message && <p className="success-message" style={{color: '#2ecc71', marginTop: '15px'}}>{message}</p>}
          {error && <p className="v11-error-message">{error}</p>}
          
          <button type="submit" className="btn-pill v11-login-button" disabled={isLoading}>
            {isLoading ? t('Processing...') : t('Set New Password')}
          </button>
        </form>

        <div className="v11-secondary-actions">
          <Link to="/login" className="link-independent">{t('Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;