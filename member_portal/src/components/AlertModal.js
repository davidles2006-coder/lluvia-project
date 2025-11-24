// src/components/AlertModal.js
import React from 'react';
import { useTranslation } from 'react-i18next';

// 这是一个只有 "OK" 按钮的提示框
const AlertModal = ({ isOpen, title, message, onClose, type = 'success' }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // 根据类型决定标题颜色 (成功=金色/绿色，失败=红色)
  const titleColor = type === 'error' ? '#e74c3c' : '#D4AF37';

  return (
    <div className="v11-modal-overlay">
      <div className="v11-modal-content" style={{maxWidth: '350px'}}>
        <h3 className="v11-modal-title" style={{color: titleColor}}>
            {title || (type === 'error' ? t('Error') : t('Success'))}
        </h3>
        
        <div className="v11-modal-text">
          {message}
        </div>

        <div className="v11-modal-actions">
          <button 
            className="btn-pill" 
            onClick={onClose}
            style={{width: '100%'}} // 按钮占满宽度
          >
            {t('OK') || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;