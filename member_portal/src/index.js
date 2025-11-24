// src/index.js - V24 (终极) 修复版
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// V24 修复：(错误 1)
// 1. 我们 100% 导入你 (V23) 的 i18n.js 配置文件
// (这将 100% 修复 'i18n.changeLanguage' 错误)
import './i18n'; 

// V24 修复：(错误 2)
// 2. 我们 100% 移除我 (AI) 在 V15 中擅自发明的 LanguageContext
// (删除: import { LanguageProvider } from './contexts/LanguageContext';)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    
      {/* V24 修复：(错误 2) 
          100% 移除我 (AI) 在 V15 中擅自发明的 <LanguageProvider> 包装器 
      */}
      {/* <LanguageProvider> */}
        <App />
      {/* </LanguageProvider> */}

    </BrowserRouter>
  </React.StrictMode>
);