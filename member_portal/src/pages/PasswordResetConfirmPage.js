// src/pages/PasswordResetConfirmPage.js - V200 (UI 升级版)
import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. 引入翻译
import { API_BASE_URL as API_ROOT } from '../config'; // 2. 引入配置
import './LoginPage.css'; // 3. 复用黑金样式
import LanguageSwitcher from '../components/LanguageSwitcher'; // 4. 引入语言切换

const API_BASE_URL = API_ROOT;

function PasswordResetConfirmPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🚩 控制密码显示的状态 (小眼睛)
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 前端校验
    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match')); // 确保这里有翻译 key
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 注意 URL: 这里对应后端的 PasswordResetConfirmView
      const response = await fetch(`${API_BASE_URL}/api/password_reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(t('Reset Success')); // "密码重置成功..."
        // 3秒后自动跳回登录页
        setTimeout(() => navigate('/login'), 3000); 
      } else {
        setError(data.error || t('Reset Failed'));
      }
    } catch (err) {
      setError(t('Network Error'));
    }
    setLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        {/* 1. 语言切换按钮 (右上角) */}
        <div className="v11-lang-switch">
            <div className="compact-lang-switch" style={{textAlign: 'right'}}>
                 <LanguageSwitcher />
            </div>
        </div>

        <h2 className="v11-login-title">LLUVIA</h2>
        <p className="v11-login-subtitle">{t('Reset Password')}</p>

        {message && <div className="message success-message" style={{color:'#2ecc71', border:'1px solid #2ecc71', padding:'10px', borderRadius:'5px', marginBottom:'20px', textAlign:'center'}}>{message}</div>}
        {error && <div className="v11-error-msg">{error}</div>}

        {!message && (
            <form onSubmit={handleSubmit} className="v11-login-form">
            
            {/* 2. 新密码框 (带眼睛) */}
            <div className="v11-input-group">
                <label>{t('New Password')}</label>
                <div className="password-wrapper">
                    <input
                        type={showPwd1 ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="******"
                        style={{paddingRight: '40px'}}
                    />
                    <span 
                        className="password-toggle-icon" 
                        onClick={() => setShowPwd1(!showPwd1)}
                    >
                        {showPwd1 ? '👁️' : '🔒'}
                    </span>
                </div>
            </div>

            {/* 3. 确认密码框 (带眼睛) */}
            <div className="v11-input-group">
                <label>{t('Confirm New Password')}</label>
                <div className="password-wrapper">
                    <input
                        type={showPwd2 ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="******"
                        style={{paddingRight: '40px'}}
                    />
                    <span 
                        className="password-toggle-icon" 
                        onClick={() => setShowPwd2(!showPwd2)}
                    >
                        {showPwd2 ? '👁️' : '🔒'}
                    </span>
                </div>
            </div>

            <button type="submit" className="v11-login-btn" disabled={loading}>
                {loading ? t('Processing...') : t('Reset Password')}
            </button>
            </form>
        )}

        <div className="v11-login-footer" style={{justifyContent:'center'}}>
          <Link to="/login" className="v11-link">{t('Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;