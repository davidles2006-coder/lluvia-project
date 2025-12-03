// src/pages/LoginPage.js - V195 (带显示密码功能)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 🚩 控制密码显示
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        {/* 语言切换 */}
        <div className="v11-lang-switch">
          <span onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</span>
          <span className="divider">|</span>
          <span onClick={() => changeLanguage('zh')} className={i18n.language === 'zh' ? 'active' : ''}>中文</span>
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
            {/* 🚩 核心修改：密码框包裹结构 */}
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} // 切换类型
                placeholder="******" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{paddingRight: '40px'}} // 给图标留位置
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