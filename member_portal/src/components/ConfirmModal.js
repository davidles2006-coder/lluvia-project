// src/components/ConfirmModal.js
import React from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isDangerous }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="v11-modal-overlay">
      <div className="v11-modal-content">
        <h3 className="v11-modal-title">{title || t('Confirm')}</h3>
        
        <div className="v11-modal-text">
          {message}
        </div>

        <div className="v11-modal-actions">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
          >
            {cancelText || t('Cancel')}
          </button>
          
          <button 
            className="btn-pill" 
            onClick={onConfirm}
            style={isDangerous ? { backgroundColor: '#e74c3c', color: '#fff' } : {}}
          >
            {confirmText || t('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;