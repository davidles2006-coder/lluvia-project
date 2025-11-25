// src/pages/LoginPage.js - V47 (暗夜模式 + 语言切换)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. 引入翻译 Hook
import './LoginPage.css';


// 2. 引入语言切换组件 (请确保路径正确)
import LanguageSwitcher from '../components/LanguageSwitcher';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // 3. 使用翻译
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.clear();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('staffToken', data.token);
      localStorage.setItem('staffName', data.nickname || 'Staff');
      localStorage.setItem('staffRole', data.role);

      console.log("Admin login successful, Role:", data.role);
      if (data.role === 'ACCOUNT_MANAGER') {
          navigate('/reports');
      } else if (data.role === 'STORE_MANAGER') {
          navigate('/store/points');
      } else {
          navigate('/search');
      }

    } catch (err) {
      console.error(err);
      setError(t('Staff Login Failed')); // 使用翻译后的错误信息
    }
    
    setIsLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        
        {/* 4. 放置语言切换按钮 (右上角) */}
        <div className="admin-lang-wrapper">
          <LanguageSwitcher />
        </div>

        {/* 标题 */}
        <h1 className="admin-title">LLUVIA ADMIN</h1>
        <p className="admin-subtitle">{t('Staff Portal')}</p>

        {/* 错误提示 */}
        {error && <div className="admin-error">{error}</div>}

        {/* 表单 */}
        <form onSubmit={handleLogin} className="admin-form">
          <div className="admin-input-group">
            <label>{t('Staff Email')}</label>
            <input 
              type="email" 
              placeholder={t('Enter Staff Email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              required
              autoFocus
            />
          </div>

          <div className="admin-input-group">
            <label>{t('Password')}</label>
            <input 
              type="password" 
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              required
            />
          </div>

          <button type="submit" className="admin-btn-primary" disabled={isLoading}>
            {isLoading ? t('Logging in...') : t('Login System')}
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginPage;