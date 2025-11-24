// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../pages/LoginPage.css'; // 复用登录页的黑金样式
import LanguageSwitcher from '../components/LanguageSwitcher'; // 引入语言切换

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      // 🚩 V74: 调用后端 API 请求重置链接
      const response = await axios.post(`${API_BASE_URL}/api/auth/password/reset/`, { email });

      if (response.status === 200) {
        setMessage(t('reset.request_success', 'Password reset link sent to your email.'));
      } else {
        throw new Error('Failed to send link.');
      }
    } catch (err) {
      // Django 通常会返回 200 OK，即使邮箱不存在，以防止信息泄露。
      // 所以我们这里只处理网络或 500 错误。
      setError(t('reset.request_failed', 'Could not send link. Check your email address or network.'));
    }
    setIsLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        <div className="v11-lang-switcher">
          <LanguageSwitcher />
        </div>

        <h1 className="v11-login-title">LLUVIA</h1>
        <h2 className="v11-login-subtitle">{t('Forgot Password?')}</h2>

        <p style={{color: '#aaa', marginBottom: '20px', fontSize: '14px'}}>{t('reset.request_info', 'Enter your email address to receive a password reset link.')}</p>

        <form onSubmit={handleSubmit} className="v11-login-form">
          <div className="v11-input-group">
            <label>{t('Email')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="v11-input"
              required 
            />
          </div>

          {message && <p className="success-message" style={{color: '#2ecc71', marginTop: '15px'}}>{message}</p>}
          {error && <p className="v11-error-message">{error}</p>}
          
          <button type="submit" className="btn-pill v11-login-button" disabled={isLoading}>
            {isLoading ? t('Processing...') : t('Send Reset Link')}
          </button>
        </form>

        <div className="v11-secondary-actions">
          <Link to="/login" className="link-independent">{t('Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;