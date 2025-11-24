import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json'; 
import zhTranslation from './locales/zh.json'; 

const resources = {
  en: { translation: enTranslation },
  zh: { translation: zhTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 默认语言
    fallbackLng: 'en',
    debug: false, // 如果还有问题，可以改成 true 看看控制台日志
    interpolation: { escapeValue: false }
  });

export default i18n;