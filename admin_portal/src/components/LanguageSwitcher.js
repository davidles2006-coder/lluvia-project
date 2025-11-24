import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation();

  // 🚩 核心修复：使用 startsWith 而不是 ===
  // 这样才能识别 'zh-CN', 'zh-TW', 'zh-HK' 等等
  const isChinese = i18n.language && i18n.language.startsWith('zh');
  
  const toggleLanguage = () => {
    const newLang = isChinese ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage} 
      className={`language-switcher ${className}`}
      style={{ 
          backgroundColor: 'transparent',
          color: '#FF007F',
          border: '1px solid #FF007F',
          padding: '4px 6px',
          fontSize: '10px',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.3s'
      }}
    >
      {isChinese ? 'English' : '中文'}
    </button>
  );
};

export default LanguageSwitcher;