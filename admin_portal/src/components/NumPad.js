// src/components/NumPad.js
import React from 'react';
import './NumPad.css';

const NumPad = ({ onInput, onDelete, onEnter, label = "ENTER" }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="numpad-container">
      <div className="numpad-grid">
        {keys.map((key) => (
          <button 
            key={key} 
            className="numpad-btn" 
            onClick={(e) => { e.preventDefault(); onInput(key); }}
          >
            {key}
          </button>
        ))}
        {/* 删除键 */}
        <button 
            className="numpad-btn delete-btn" 
            onClick={(e) => { e.preventDefault(); onDelete(); }}
        >
            ⌫
        </button>
      </div>
      
      {/* 确认键 (占满底部) */}
      <button 
        className="numpad-submit-btn" 
        onClick={(e) => { e.preventDefault(); onEnter(); }}
      >
        {label}
      </button>
    </div>
  );
};

export default NumPad;
