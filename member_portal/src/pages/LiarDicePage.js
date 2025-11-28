// src/pages/LiarDicePage.js - V173
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LiarDicePage.css';

// 骰子点数配置 (哪个位置有点)
// 0:无, 1:有
const PIP_MAP = {
  1: [[0,0,0], [0,1,0], [0,0,0]],
  2: [[1,0,0], [0,0,0], [0,0,1]],
  3: [[1,0,0], [0,1,0], [0,0,1]],
  4: [[1,0,1], [0,0,0], [1,0,1]],
  5: [[1,0,1], [0,1,0], [1,0,1]],
  6: [[1,0,1], [1,0,1], [1,0,1]]
};

// 单个骰子组件
const Dice = ({ value }) => {
  const pips = PIP_MAP[value];
  return (
    <div className={`real-dice dice-${value}`}>
      {pips.flat().map((hasPip, i) => (
        <div key={i} className={hasPip ? 'pip' : ''} />
      ))}
    </div>
  );
};

function LiarDicePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [isShaking, setIsShaking] = useState(false);
  const [isCovered, setIsCovered] = useState(true);
  const [roundId, setRoundId] = useState(1);
  const [rollTime, setRollTime] = useState(null);
  const [gameState, setGameState] = useState('READY'); 
  const [message, setMessage] = useState("");

  // 初始化：读取防作弊缓存
  useEffect(() => {
    const savedDice = localStorage.getItem('lluvia_dice_values');
    const savedTime = localStorage.getItem('lluvia_dice_time');
    const savedRound = localStorage.getItem('lluvia_dice_round');

    if (savedDice && savedTime) {
      setDice(JSON.parse(savedDice));
      setRollTime(savedTime);
      setRoundId(parseInt(savedRound || 1));
      setGameState('ROLLED');
      setMessage(t("game.data_restored")); // "数据已恢复"
    } else {
      setMessage(t("game.ready_to_roll")); // "准备开始"
    }
  }, [t]);

  const handleRoll = () => {
    if (gameState === 'ROLLED') return;

    setIsShaking(true);
    setMessage(t("game.rolling"));

    setTimeout(() => {
      const newDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6));
      const sortedStr = [...newDice].sort().join('');
      const isStraight = (sortedStr === '23456'); // 仅 23456 算顺子

      setDice(newDice);
      const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setRollTime(timeStr);
      setIsShaking(false);
      setIsCovered(true);

      // 存入缓存
      localStorage.setItem('lluvia_dice_values', JSON.stringify(newDice));
      localStorage.setItem('lluvia_dice_time', timeStr);
      localStorage.setItem('lluvia_dice_round', roundId);

      if (isStraight) {
        setGameState('STRAIGHT');
        setMessage(t("game.straight")); // "顺子！"
      } else {
        setGameState('ROLLED');
        setMessage(t("game.locked")); // "已锁定"
      }
    }, 800);
  };

  const handleNextRound = () => {
    // 下一局：保留局数，清除骰子缓存
    localStorage.removeItem('lluvia_dice_values');
    localStorage.removeItem('lluvia_dice_time');
    setRoundId(prev => prev + 1);
    setGameState('READY');
    setMessage(t("game.ready_to_roll"));
    setRollTime(null);
    setIsCovered(true);
    // 更新局数缓存
    localStorage.setItem('lluvia_dice_round', roundId + 1);
  };

  // 🚩 核心修复：退出时彻底清空
  const handleExit = () => {
    if (window.confirm(t("game.confirm_exit"))) {
        localStorage.removeItem('lluvia_dice_values');
        localStorage.removeItem('lluvia_dice_time');
        localStorage.removeItem('lluvia_dice_round');
        navigate('/member/game-center');
    }
  };

  const startPeek = () => { if (gameState !== 'READY') setIsCovered(false); };
  const endPeek = () => { setIsCovered(true); };

  return (
    <div className="dice-container">
      <div className="dice-header">
        <div className="round-badge">{t('game.round')} {roundId}</div>
        <div className="time-badge">
            {rollTime ? rollTime : "--:--:--"}
        </div>
      </div>

      <h2 className="dice-title">🎲 {t('game.title')}</h2>

      {/* 骰盅 */}
      <div 
        className={`dice-cup-area ${isShaking ? 'shaking' : ''}`}
        onMouseDown={startPeek} onMouseUp={endPeek} onMouseLeave={endPeek}
        onTouchStart={startPeek} onTouchEnd={endPeek}
        onContextMenu={(e)=>e.preventDefault()}
      >
        <div className={`dice-cup-cover ${isCovered ? 'visible' : 'hidden'}`}>
          <div className="cup-handle-outer"><div className="cup-handle-inner"></div></div>
          <div className="cup-logo">LLUVIA</div>
          <div className="cup-hint">{gameState === 'READY' ? '' : t('game.hold_to_peek')}</div>
        </div>

        {/* 真实 CSS 骰子 */}
        <div className="dice-grid">
          {dice.map((d, i) => <Dice key={i} value={d} />)}
        </div>
      </div>

      <p className="status-text" style={{color: gameState === 'STRAIGHT' ? '#e74c3c' : '#D4AF37'}}>
          {message}
      </p>

      <div className="dice-actions">
        { (gameState === 'READY' || gameState === 'STRAIGHT') && (
            <button className="btn-pill big-btn" onClick={handleRoll} disabled={isShaking}>
                {gameState === 'STRAIGHT' ? t('game.reroll') : t('game.roll')}
            </button>
        )}

        { (gameState === 'ROLLED') && (
            <button className="btn-ghost" onClick={handleNextRound} style={{borderColor:'#666', color:'#ccc'}}>
                {t('game.next_round')}
            </button>
        )}
        
        <div style={{marginTop: '30px'}}>
            <button className="link-text" onClick={handleExit}>
                {t('game.exit')}
            </button>
        </div>
      </div>
    </div>
  );
}

export default LiarDicePage;