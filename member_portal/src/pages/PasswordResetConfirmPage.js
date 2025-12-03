// src/pages/PasswordResetConfirmPage.js - V203 (翻译修复版)
import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import './LoginPage.css';
import LanguageSwitcher from '../components/LanguageSwitcher';

function PasswordResetConfirmPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // 确保引入了 t

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 🚩 翻译: 密码不匹配
    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match'));
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/password_reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        // 🚩 翻译: 成功消息
        setMessage(t('Reset Success'));
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // 🚩 翻译: 失败消息 (后端返回优先，否则显示默认)
        setError(data.error || t('Reset Failed'));
      }
    } catch (err) {
      // 🚩 翻译: 网络错误
      setError(t('Network Error'));
    }
    setLoading(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        <div className="v11-lang-switch">
            <div className="compact-lang-switch" style={{textAlign: 'right'}}>
                 <LanguageSwitcher />
            </div>
        </div>

        <h2 className="v11-login-title">LLUVIA</h2>
        {/* 🚩 翻译: 标题 */}
        <p className="v11-login-subtitle">{t('Set New Password')}</p>

        {message && <div className="message success-message" style={{color:'#2ecc71', border:'1px solid #2ecc71', padding:'10px', borderRadius:'5px', marginBottom:'20px', textAlign:'center'}}>{message}</div>}
        {error && <div className="v11-error-msg">{error}</div>}

        {!message && (
            <form onSubmit={handleSubmit} className="v11-login-form">
            
            <div className="v11-input-group">
                {/* 🚩 翻译: 标签 */}
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
                    <span className="password-toggle-icon" onClick={() => setShowPwd1(!showPwd1)}>
                        {showPwd1 ? '👁️' : '🔒'}
                    </span>
                </div>
            </div>

            <div className="v11-input-group">
                {/* 🚩 翻译: 标签 */}
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
                    <span className="password-toggle-icon" onClick={() => setShowPwd2(!showPwd2)}>
                        {showPwd2 ? '👁️' : '🔒'}
                    </span>
                </div>
            </div>

            <button type="submit" className="v11-login-btn" disabled={loading}>
                {/* 🚩 翻译: 按钮 */}
                {loading ? t('Processing...') : t('Reset Password')}
            </button>
            </form>
        )}

        <div className="v11-login-footer" style={{justifyContent:'center'}}>
          {/* 🚩 翻译: 链接 */}
          <Link to="/login" className="v11-link">{t('Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;