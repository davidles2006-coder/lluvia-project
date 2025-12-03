// src/components/LanguageSwitcher.js (带调试日志版)
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = "" }) => {
    const { i18n } = useTranslation();

    // 调试日志 1：看看当前语言到底是什么
    console.log("Current Language Code:", i18n.language);

    // 判断逻辑
    const isChinese = i18n.language && i18n.language.startsWith('zh');
    
    const toggleLanguage = () => {
        const newLang = isChinese ? 'en' : 'zh';
        
        // 调试日志 2：看看我们打算切换成什么
        console.log(`Attempting to switch from ${i18n.language} to ${newLang}`);
        
        i18n.changeLanguage(newLang)
            .then(() => {
                console.log("Language changed successfully to:", newLang);
            })
            .catch((err) => {
                console.error("Failed to change language:", err);
            });
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
            {/* 按钮显示状态 */}
            {isChinese ? 'English' : '中文'}
        </button>
    );
};

export default LanguageSwitcher;