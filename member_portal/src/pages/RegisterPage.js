// src/pages/RegisterPage.js - V196 (合并版: 强制同意书 + 显示密码)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LoginPage.css'; 
import LanguageSwitcher from '../components/LanguageSwitcher';

import { API_BASE_URL as API_ROOT } from '../config'; 

const API_BASE_URL = API_ROOT;

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState(''); 
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  
  // 🚩 V196 新增: 控制密码显示
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // V73: 控制同意书弹窗
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1. 第一步：点击"下一步"，先校验表单，然后开弹窗
  const handlePreCheck = (e) => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError(t('Passwords do not match')); // 使用翻译
      return;
    }
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters')); // 建议加个翻译key
      return;
    }
    
    // 表单没问题，显示条款弹窗
    setShowTerms(true);
  };

  // 2. 第二步：点击"我同意"，发送请求
  const handleFinalRegister = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, nickname, dob, password, password2 }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = Object.values(data).flat().join(' ');
        throw new Error(errorMsg || t('Registration failed'));
      }
      
      // 成功
      alert(t('Registration successful!'));
      navigate('/login');

    } catch (err) {
      setShowTerms(false); // 关闭弹窗以便用户修改
      setError(err.message || t('Network Error'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="v11-login-container">
      <div className="v11-login-card">
        
        <div className="v11-lang-switcher">
          <div className="compact-lang-switch" style={{marginBottom: '10px', textAlign: 'right'}}>
             <LanguageSwitcher />
          </div>
        </div>

        <h1 className="v11-login-title">LLUVIA</h1>
        <h2 className="v11-login-subtitle">{t('Create New Account')}</h2>

        <form onSubmit={handlePreCheck} className="v11-login-form">
          <div className="v11-input-group"><label>{t('Email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="v11-input-group"><label>{t('Nickname')}</label><input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required /></div>
          <div className="v11-input-group"><label>{t('Phone')}</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          <div className="v11-input-group"><label>{t('Birthday')}</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></div>
          
          {/* 🚩 密码框 1 (带眼睛) */}
          <div className="v11-input-group">
            <label>{t('Password')}</label>
            <div className="password-wrapper">
                <input 
                    type={showPwd1 ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{paddingRight: '40px'}}
                />
                <span 
                    className="password-toggle-icon" 
                    onClick={() => setShowPwd1(!showPwd1)}
                    style={{position:'absolute', right:'10px', cursor:'pointer', color:'#888'}}
                >
                    {showPwd1 ? '👁️' : '🔒'}
                </span>
            </div>
          </div>

          {/* 🚩 密码框 2 (带眼睛) */}
          <div className="v11-input-group">
            <label>{t('Password')} (Confirm)</label>
            <div className="password-wrapper">
                <input 
                    type={showPwd2 ? "text" : "password"} 
                    value={password2} 
                    onChange={(e) => setPassword2(e.target.value)} 
                    required 
                    style={{paddingRight: '40px'}}
                />
                <span 
                    className="password-toggle-icon" 
                    onClick={() => setShowPwd2(!showPwd2)}
                    style={{position:'absolute', right:'10px', cursor:'pointer', color:'#888'}}
                >
                    {showPwd2 ? '👁️' : '🔒'}
                </span>
            </div>
          </div>
          
          {error && <p className="v11-error-message">{error}</p>}
          
          <button type="submit" className="btn-pill v11-login-button">
            {t('Register')} 
          </button>
        </form>

        <div className="v11-secondary-actions">
          <Link to="/login" className="link-independent">{t('Have an account? Login now')}</Link>
        </div>
      </div>

      {/* 条款弹窗 (保持不变) */}
      {showTerms && (
        <div className="v11-modal-overlay">
          <div className="v11-modal-content">
            <h3 className="v11-modal-title">{t('terms.title')}</h3>
            
            <div className="terms-scroll-box" style={{maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px', textAlign: 'left', color: '#ccc'}}>
               <h4 style={{color:'#D4AF37'}}>{t('terms.section1_title')}</h4>
               <p>{t('terms.section1_text')}</p>

               <h4 style={{color:'#D4AF37'}}>{t('terms.section2_title')}</h4>
               <p>{t('terms.section2_text1')}</p>
               <p>{t('terms.section2_text2')}</p>

               <h4 style={{color:'#D4AF37'}}>{t('terms.section3_title')}</h4>
               <p>{t('terms.section3_text1')}</p>
               <p>{t('terms.section3_text2')}</p>
               <p>{t('terms.section3_text3')}</p>

               <h4 style={{color:'#D4AF37'}}>{t('terms.section4_title')}</h4>
               <p>{t('terms.section4_text')}</p>
            </div>

            <div className="v11-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowTerms(false)}
                disabled={isSubmitting}
              >
                {t('Cancel')}
              </button>
              
              <button 
                className="btn-pill" 
                onClick={handleFinalRegister}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('Processing...') : t('terms.button_agree')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default RegisterPage;