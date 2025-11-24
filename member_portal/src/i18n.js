// 这是 src/i18n.js (V5 最终修复版 - 成功加载 JSON)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 🚩 1. 导入我们之前创建的 JSON 文件
import enTranslation from './locales/en.json'; 
import zhTranslation from './locales/zh.json'; 

// 2. 组合资源对象
const resources = {
  en: {
    translation: enTranslation // ⬅️ 确保使用我们完整的 JSON 对象
  },
  zh: {
    translation: zhTranslation // ⬅️ 确保使用我们完整的 JSON 对象
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources, // 3. 使用组合后的资源
    lng: 'zh', // 4. 默认启动语言为中文
    fallbackLng: 'en',
    debug: false, 
    
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;