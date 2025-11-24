// src/pages/LoginPage.js - V25 (i18next) 修复版
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// V22/V25 修复：1. 导入 V16 真正的 Hook
import { useTranslation } from 'react-i18next';

// V11 视觉
import './LoginPage.css'; 

// V16 逻辑
import LanguageSwitcher from '../components/LanguageSwitcher'; 

// V13 逻辑 (Django API)
import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址 

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // V22/V25 修复：2. 使用 V16 的 Hook
  const { t } = useTranslation();

  // V13 的 handleLogin 逻辑 100% 保持不变
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || '登录失败'); }
      localStorage.setItem('authToken', data.token); 
      localStorage.setItem('memberNickname', data.nickname);
      navigate('/member/dashboard');
    } catch (err) {
      setError(err.message || '邮箱或密码不正确。');
    }
  };


  return (
    // V11 视觉 (黑金卡片)
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        {/* V16 逻辑 (你的组件) */}
        <div className="v11-lang-switcher">
          <LanguageSwitcher />
        </div>

        <h1 className="v11-login-title">LLUVIA</h1>
        
        {/* V22/V25 修复：3. 使用 t() 函数 (来自 i18n.js) */}
        <h2 className="v11-login-subtitle">{t('Member Portal Login')}</h2>

        <form onSubmit={handleLogin} className="v11-login-form">
          <div className="v11-input-group">
            <label htmlFor="email">{t('Email')}</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="v11-input-group">
            <label htmlFor="password">{t('Password')}</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="v11-error-message">{error}</p>}
          
          <button type="submit" className="btn-pill v11-login-button">
            {t('Secure Login')}
          </button>
        </form>

        <div className="v11-secondary-actions">
          <Link to="/register" className="link-independent">
            {t('No account? Register now')}
          </Link>
          <Link to="/forgot-password" className="link-independent" style={{marginTop: '10px'}}>
            {t('Forgot Password?')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;