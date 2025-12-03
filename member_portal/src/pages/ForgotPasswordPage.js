// src/pages/ForgotPasswordPage.js - V202 (翻译修复 + 自动跳转)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 🚩 引入 useNavigate
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../pages/LoginPage.css'; 
import LanguageSwitcher from '../components/LanguageSwitcher'; 

import { API_BASE_URL as API_ROOT } from '../config'; 

const API_BASE_URL = API_ROOT;

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { t } = useTranslation();
  const navigate = useNavigate(); // 🚩 初始化导航

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/password/reset/`, { email });

      if (response.status === 200) {
        // 成功提示
        setMessage(t('reset.request_success'));
        
        // 🚩 优化体验：3秒后自动跳回登录页
        setTimeout(() => {
            navigate('/login');
        }, 3000);
        
      } else {
        throw new Error('Failed to send link.');
      }
    } catch (err) {
      setError(t('reset.request_failed'));
    }
    setIsLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        <div className="v11-lang-switch">
            <div className="compact-lang-switch" style={{textAlign: 'right'}}>
                 <LanguageSwitcher />
            </div>
        </div>

        <h1 className="v11-login-title">LLUVIA</h1>
        <h2 className="v11-login-subtitle">{t('Forgot Password?')}</h2>

        {!message ? (
            <>
                <p style={{color: '#aaa', marginBottom: '20px', fontSize: '14px', textAlign:'center'}}>
                    {t('reset.request_info')}
                </p>

                <form onSubmit={handleSubmit} className="v11-login-form">
                  <div className="v11-input-group">
                    <label>{t('Email')}</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@example.com"
                    />
                  </div>

                  {error && <p className="v11-error-msg">{error}</p>}
                  
                  <button type="submit" className="v11-login-btn" disabled={isLoading}>
                    {isLoading ? t('Loading...') : t('Send Reset Link')}
                  </button>
                </form>
            </>
        ) : (
            // 🚩 发送成功后的界面
            <div style={{textAlign: 'center', padding: '20px 0'}}>
                <div style={{fontSize: '40px', marginBottom: '10px'}}>📧</div>
                <p className="success-message" style={{color: '#2ecc71', fontSize: '16px', lineHeight: '1.5'}}>
                    {message}
                </p>
                <p style={{color: '#888', fontSize: '12px', marginTop: '10px'}}>
                    Redirecting to login...
                </p>
            </div>
        )}

        <div className="v11-login-footer" style={{justifyContent: 'center'}}>
          <Link to="/login" className="v11-link">{t('Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;