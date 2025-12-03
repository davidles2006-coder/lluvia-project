// src/pages/LoginPage.js - V201 (UI统一 + 翻译修复版)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import './LoginPage.css';
// 🚩 1. 引入统一的语言切换组件
import LanguageSwitcher from '../components/LanguageSwitcher';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(); // 移除 i18n，因为组件里处理了

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('memberId', data.memberId);
        navigate('/member/dashboard');
      } else {
        setError(t('Invalid Credentials'));
      }
    } catch (err) {
      setError(t('Network Error'));
    }
    setLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        {/* 🚩 2. 替换为统一的语言切换按钮 (和注册页保持一致) */}
        <div className="v11-lang-switch">
            <div className="compact-lang-switch" style={{textAlign: 'right'}}>
                 <LanguageSwitcher />
            </div>
        </div>

        <h2 className="v11-login-title">LLUVIA</h2>
        <p className="v11-login-subtitle">{t('Member Login')}</p>
        
        {error && <div className="v11-error-msg">{error}</div>}

        <form onSubmit={handleLogin} className="v11-login-form">
          <div className="v11-input-group">
            <label>{t('Email')}</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="v11-input-group">
            <label>{t('Password')}</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="******" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{paddingRight: '40px'}} 
              />
              <span 
                className="password-toggle-icon" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🔒'}
              </span>
            </div>
          </div>

          <button type="submit" className="v11-login-btn" disabled={loading}>
            {loading ? t('Loading...') : t('Login')}
          </button>
        </form>

        <div className="v11-login-footer">
          <Link to="/register" className="v11-link">{t('Create Account')}</Link>
          <Link to="/forgot-password" className="v11-link">{t('Forgot Password?')}</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;