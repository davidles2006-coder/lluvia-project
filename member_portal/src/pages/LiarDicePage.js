// src/pages/LiarDicePage.js - V171 (大话骰完整版)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 引入翻译
import './LiarDicePage.css';

// 骰子点数显示 (使用 Unicode 字符，简单直接)
const DICE_ICONS = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
};

function LiarDicePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // 使用翻译钩子

  // --- State 状态管理 ---
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [isShaking, setIsShaking] = useState(false); // 摇动动画
  const [isCovered, setIsCovered] = useState(true);  // 盖子是否盖着
  const [roundId, setRoundId] = useState(1);         // 局数
  const [rollTime, setRollTime] = useState(null);    // 锁定时间
  const [gameState, setGameState] = useState('READY'); // READY (准备), ROLLED (已摇), STRAIGHT (顺子可重摇)
  const [message, setMessage] = useState("Ready");   // 提示文字

  // --- 1. 初始化: 防作弊检查 (Anti-Cheating) ---
  useEffect(() => {
    // 尝试从手机缓存读取上一局的数据
    const savedDice = localStorage.getItem('lluvia_dice_values');
    const savedTime = localStorage.getItem('lluvia_dice_time');
    const savedRound = localStorage.getItem('lluvia_dice_round');

    if (savedDice && savedTime) {
      setDice(JSON.parse(savedDice));
      setRollTime(savedTime);
      setRoundId(parseInt(savedRound || 1));
      setGameState('ROLLED'); // 恢复到“已摇”状态
      setMessage(t("Data restored (Anti-cheat)")); // "已恢复数据"
      setIsCovered(true); // 默认盖住
    } else {
        setMessage(t("Ready to roll"));
    }
  }, [t]);

  // --- 2. 核心功能: 摇骰子 ---
  const handleRoll = () => {
    // 如果已经摇过且不是顺子，禁止重摇
    if (gameState === 'ROLLED') return;

    setIsShaking(true);
    setMessage(t("Rolling..."));

    // 播放 0.8秒 动画
    setTimeout(() => {
      // A. 生成 5 个随机数 (1-6)
      const newDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6));
      
      // B. 顺子判定规则 (你的要求: 只有 23456 算顺子，12345 不算)
      const sortedStr = [...newDice].sort().join('');
      const isStraight = (sortedStr === '23456'); 

      // C. 更新状态
      setDice(newDice);
      const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false }); // 24小时制
      setRollTime(timeStr);
      setIsShaking(false);
      setIsCovered(true); // 摇完立刻盖住

      // D. 存入缓存 (锁死结果，刷新网页也没用)
      localStorage.setItem('lluvia_dice_values', JSON.stringify(newDice));
      localStorage.setItem('lluvia_dice_time', timeStr);
      localStorage.setItem('lluvia_dice_round', roundId);

      if (isStraight) {
        setGameState('STRAIGHT');
        setMessage(t("Straight! Free Reroll!")); // "顺子！免费重摇！"
      } else {
        setGameState('ROLLED');
        setMessage(t("Locked. Hold to peek.")); // "已锁定。按住查看。"
      }

    }, 800);
  };

  // --- 3. 下一局 (清除缓存) ---
  const handleNextRound = () => {
    if (!window.confirm(t("Start next round?"))) return;
    
    localStorage.removeItem('lluvia_dice_values');
    localStorage.removeItem('lluvia_dice_time');
    
    setRoundId(prev => prev + 1);
    setGameState('READY');
    setMessage(t("Ready to roll"));
    setRollTime(null);
    setIsCovered(true);
  };

  // --- 4. 交互: 按住查看 (Peek Logic) ---
  // 只有在“已摇”状态下，按住才能看
  const startPeek = () => { if (gameState !== 'READY') setIsCovered(false); };
  const endPeek = () => { setIsCovered(true); };

  return (
    <div className="dice-container">
      {/* 顶部信息栏 */}
      <div className="dice-header">
        <div className="round-badge">Round {roundId}</div>
        <div className="time-badge">
            {rollTime ? `${t('Time')}: ${rollTime}` : "--:--:--"}
        </div>
      </div>

      <h2 className="dice-title">🎲 {t('Liar\'s Dice')}</h2>

      {/* 骰盅区域 (核心交互区) */}
      <div 
        className={`dice-cup-area ${isShaking ? 'shaking' : ''}`}
        // 电脑端鼠标事件
        onMouseDown={startPeek} 
        onMouseUp={endPeek} 
        onMouseLeave={endPeek}
        // 手机端触摸事件
        onTouchStart={startPeek} 
        onTouchEnd={endPeek}
        // 禁止右键菜单干扰
        onContextMenu={(e)=>e.preventDefault()}
      >
        {/* 盖子 (Cover) - 增加把手结构 */}
        <div className={`dice-cup-cover ${isCovered ? 'visible' : 'hidden'}`}>
          <div className="cup-handle-outer">
            <div className="cup-handle-inner"></div>
          </div>
          <div className="cup-logo">LLUVIA</div>
          <div className="cup-hint">{gameState === 'READY' ? '' : t('Hold to Peek')}</div>
        </div>

        {/* 底部的骰子 (Dice) */}
        <div className="dice-grid">
          {dice.map((d, i) => (
            <div key={i} className={`single-dice dice-val-${d}`}>{DICE_ICONS[d]}</div>
          ))}
        </div>
      </div>

      <p className="status-text" style={{color: gameState === 'STRAIGHT' ? '#e74c3c' : '#888'}}>
          {message}
      </p>

      {/* 操作按钮 */}
      <div className="dice-actions">
        {/* 摇骰按钮 (准备好 或 顺子时 显示) */}
        { (gameState === 'READY' || gameState === 'STRAIGHT') && (
            <button className="btn-pill big-btn" onClick={handleRoll} disabled={isShaking}>
                {gameState === 'STRAIGHT' ? t('Reroll (Straight)') : t('Roll Dice')}
            </button>
        )}

        {/* 下一局按钮 (已锁定后 显示) */}
        { (gameState === 'ROLLED') && (
            <button className="btn-ghost" onClick={handleNextRound}>
                {t('Next Round')}
            </button>
        )}
        
        <div style={{marginTop: '30px'}}>
            <button className="link-text" onClick={() => navigate('/member/game-center')}>
                {t('Exit Game')}
            </button>
        </div>
      </div>
    </div>
  );
}

export default LiarDicePage;