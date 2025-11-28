// src/pages/DrunkMonopolyPage.js - V181 终极版
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DrunkMonopolyPage.css';
import { BOARD_MAP, CHANCE_CARDS, DESTINY_CARDS, TILE_TYPES } from './MonopolyData';

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

function DrunkMonopolyPage() {
  const navigate = useNavigate();
  
  // --- State ---
  const [setupMode, setSetupMode] = useState(true);
  const [inputName, setInputName] = useState('');
  const [players, setPlayers] = useState([]); 
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  
  // 弹窗相关
  const [modalInfo, setModalInfo] = useState(null); 
  const [showPunishment, setShowPunishment] = useState(false); // 小游戏翻转卡片用

  // --- 设置逻辑 ---
  const addPlayer = () => {
    if (!inputName.trim()) return;
    if (players.length >= 6) { alert('Max 6 players'); return; }
    setPlayers([...players, { name: inputName, color: PLAYER_COLORS[players.length], pos: 0 }]);
    setInputName('');
  };
  const startGame = () => {
    if (players.length < 2) { alert('Need 2+ players!'); return; }
    setSetupMode(false);
  };

  // --- 游戏逻辑 ---
  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    let count = 0;
    const interval = setInterval(() => {
        setDiceVal(Math.ceil(Math.random() * 6));
        count++;
        if (count > 8) {
            clearInterval(interval);
            finishRoll();
        }
    }, 80);
  };

  const finishRoll = () => {
    setIsRolling(false);
    const steps = Math.ceil(Math.random() * 6);
    setDiceVal(steps);
    movePlayer(steps);
  };

  const movePlayer = (steps) => {
    const currentPlayer = players[turnIndex];
    let newPos = (currentPlayer.pos + steps) % BOARD_MAP.length;

    // 特殊格：倒退 (ID 26 -> 随机去 10 或 17)
    if (BOARD_MAP[newPos].type === TILE_TYPES.BACK) {
        newPos = Math.random() > 0.5 ? 10 : 17; // 50% 去 1号集结，50% 去 0号集结
    }

    const updatedPlayers = [...players];
    updatedPlayers[turnIndex].pos = newPos;
    setPlayers(updatedPlayers);

    // 延迟一点弹出，让棋子先走到
    setTimeout(() => triggerTile(newPos), 300);
  };

  const triggerTile = (pos) => {
    const tile = BOARD_MAP[pos];
    let content = { ...tile }; // 复制一份数据
    setShowPunishment(false); // 重置小游戏翻转状态

    // 高能预警震动
    if (tile.isHighEnergy && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
    }

    // 处理抽卡
    if (tile.type === TILE_TYPES.CHANCE) {
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        content.title = "❓ 机会卡 (Chance)";
        content.text = card.text;
        if (card.highEnergy) content.isHighEnergy = true;
    } else if (tile.type === TILE_TYPES.DESTINY) {
        const card = DESTINY_CARDS[Math.floor(Math.random() * DESTINY_CARDS.length)];
        content.title = "🔮 命运卡 (Destiny)";
        content.text = card.text;
    }

    setModalInfo(content);
  };

  const nextTurn = () => {
    setModalInfo(null);
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  // --- 渲染 ---
  if (setupMode) {
    return (
      <div className="monopoly-setup">
        <h2 className="game-logo-text">🥃 酒鬼大富翁</h2>
        <p>输入酒鬼名字 (2-6人)</p>
        <div className="setup-input-area">
            <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Name..." onKeyPress={(e) => e.key === 'Enter' && addPlayer()} />
            <button className="btn-pill" onClick={addPlayer}>+</button>
        </div>
        <div className="player-list">
            {players.map((p, i) => <div key={i} className="player-tag" style={{borderLeft: `5px solid ${p.color}`}}>{p.name}</div>)}
        </div>
        {players.length >= 2 && <button className="btn-pill big-start-btn" onClick={startGame}>开始！(Start)</button>}
        <button className="link-text" onClick={() => navigate('/member/game-center')}>退出</button>
      </div>
    );
  }

  const currentPlayer = players[turnIndex];

  return (
    <div className={`monopoly-board-container ${modalInfo?.isHighEnergy ? 'bg-danger-flash' : ''}`}>
      
      {/* 顶部：当前玩家 */}
      <div className="monopoly-header">
        <div className="current-turn" style={{borderColor: currentPlayer.color, boxShadow: `0 0 15px ${currentPlayer.color}`}}>
            Turn: <span style={{color: currentPlayer.color, fontSize: '20px'}}>{currentPlayer.name}</span>
        </div>
      </div>

      {/* 简易棋盘列表 (适应手机) */}
      <div className="board-list-view">
        {BOARD_MAP.map((tile) => {
            const playersHere = players.filter(p => p.pos === tile.id);
            const isCurrent = playersHere.length > 0;
            return (
                <div key={tile.id} className={`list-tile ${isCurrent ? 'active' : ''} ${tile.isHighEnergy ? 'danger-tile' : ''}`}>
                    <div className="tile-id">{tile.id}</div>
                    <div className="tile-content">
                        <div className="tile-title" style={{color: tile.color}}>{tile.label}</div>
                    </div>
                    <div className="tile-avatars">
                        {playersHere.map((p, i) => (
                            <div key={i} className="p-dot" style={{background: p.color}}></div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>

      {/* 底部控制 */}
      <div className="control-panel">
         <div className="dice-box">{diceVal}</div>
         <button className="btn-pill roll-btn" onClick={handleRoll} disabled={isRolling || modalInfo}>
            {isRolling ? '...' : '🎲 ROLL'}
         </button>
      </div>

      {/* 弹窗 (核心交互) */}
      {modalInfo && (
        <div className="monopoly-modal-overlay">
           <div className={`monopoly-modal ${modalInfo.isHighEnergy ? 'modal-danger' : ''}`}>
              
              {modalInfo.isHighEnergy && <div className="warning-banner">⚠️ 高能预警 ⚠️</div>}
              
              <h1 style={{color: modalInfo.color}}>{modalInfo.title}</h1>
              
              <div className="modal-body-text">
                  {modalInfo.text}
              </div>

              {/* 小游戏专用：查看惩罚 */}
              {modalInfo.type === TILE_TYPES.GAME && (
                  <div className="game-punishment-box">
                      {!showPunishment ? (
                          <button className="btn-ghost small-btn" onClick={() => setShowPunishment(true)}>
                              ☠️ 查看输家惩罚
                          </button>
                      ) : (
                          <div className="punish-reveal shake-anim">
                              {modalInfo.punishment}
                          </div>
                      )}
                  </div>
              )}

              <button className="btn-pill next-btn" onClick={nextTurn}>
                  {modalInfo.type === TILE_TYPES.GAME ? '游戏结束，下一位' : '执行完毕，下一位'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default DrunkMonopolyPage;