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
                color: '#D4AF37',            // 🚩 改成金色
                border: '1px solid #D4AF37', // 🚩 改成金色边框
                padding: '4px 8px',          //稍微宽一点点
                fontSize: '11px',            // 字体稍微大一丢丢
                fontWeight: 'bold',
                borderRadius: '12px',        // 圆角更圆润
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',             // 确保文字居中
                alignItems: 'center',
                height: '24px'               // 固定一个小高度
            }}
        >
            {isChinese ? 'EN' : '中文'}     {/* 简写更整齐 */}
        </button>
    );

    
};

export default LanguageSwitcher;