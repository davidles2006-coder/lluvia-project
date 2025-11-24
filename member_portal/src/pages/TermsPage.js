// src/pages/TermsPage.js - V2 (国际化版)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. 引入翻译 Hook
import './LoginPage.css'; 
import LanguageSwitcher from '../components/LanguageSwitcher'; // 2. 引入语言切换按钮

const TermsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // 3. 使用 Hook

  return (
    <div className="v11-login-container" style={{alignItems: 'flex-start', paddingTop: '50px', height: 'auto', minHeight: '100vh'}}>
      <div className="v11-login-card" style={{maxWidth: '800px', textAlign: 'left', position: 'relative'}}>
        
        {/* 右上角放个语言切换，方便用户看懂条款 */}
        <div style={{position: 'absolute', top: '20px', right: '20px'}}>
            <LanguageSwitcher />
        </div>

        <h1 className="v11-login-title" style={{textAlign: 'center', marginBottom: '30px', marginTop: '20px'}}>
          {t('terms.title')}
        </h1>
        
        <div style={{color: '#ddd', lineHeight: '1.8', fontSize: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
          
          <h3 style={{color: '#D4AF37'}}>{t('terms.section1_title')}</h3>
          <p>{t('terms.section1_text')}</p>

          <h3 style={{color: '#D4AF37'}}>{t('terms.section2_title')}</h3>
          <p>2.1 <strong>{t('terms.section2_text1')}</strong></p>
          <p>2.2 {t('terms.section2_text2')}</p>

          <h3 style={{color: '#D4AF37'}}>{t('terms.section3_title')}</h3>
          <p>3.1 <strong>{t('terms.section3_text1')}</strong></p>
          <p>3.2 {t('terms.section3_text2')}</p>
          <p>3.3 {t('terms.section3_text3')}</p>

          <h3 style={{color: '#D4AF37'}}>{t('terms.section4_title')}</h3>
          <p>{t('terms.section4_text')}</p>
        </div>

        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-pill v11-login-button" 
            style={{width: '200px'}}
          >
            {t('terms.button_agree')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;