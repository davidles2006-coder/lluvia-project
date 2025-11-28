// src/pages/MonopolyData.js

// 定义格子类型
export const TILE_TYPES = {
  START: 'START',
  NORMAL: 'NORMAL',
  CHANCE: 'CHANCE',
  DESTINY: 'DESTINY',
  GAME: 'GAME',
  JAIL: 'JAIL',
  BOMB: 'BOMB',
  BACK: 'BACK',
  ASSEMBLY: 'ASSEMBLY' // 集结号
};

// 机会卡池 (Chance)
export const CHANCE_CARDS = [
  { text: "大冒险：给通讯录第 5 个人发 '我好寂寞'。不敢发？喝 2 杯。", type: 'punish' },
  { text: "照镜子：大家轮流扮鬼脸。第一个笑的人喝 2 杯。", type: 'game' },
  { text: "破财消灾：请全场每人一个 Shot，你自己再喝 2 个。", type: 'punish', highEnergy: true },
  { text: "神经病：大喊三声 '我是骚零/猛1'。不敢喊？喝 2 杯。", type: 'punish' },
  { text: "连坐：你和左右两边的人，一起喝 1 杯。", type: 'punish' },
  { text: "幸运儿：指定全场酒量最好的人，喝 2 杯。", type: 'benefit' }
];

// 命运卡池 (Destiny)
export const DESTINY_CARDS = [
  { text: "免死金牌：抵消一次惩罚 (炸弹除外)。", type: 'buff' },
  { text: "反弹卡：把 1 杯以内的惩罚反弹给指定人。", type: 'buff' },
  { text: "指定杀：立即指定一人喝 2 杯。", type: 'attack' },
  { text: "厕所通行证：只有你有这张卡，别人才能去厕所。", type: 'buff' },
  { text: "国王体验卡：下一轮内，你可以命令任何人喝 1 口。", type: 'buff' }
];

// 28格地图数据 (isHighEnergy: true 会触发红色警报)
export const BOARD_MAP = [
  { id: 0, type: TILE_TYPES.START, label: '🏁 开局', text: '全员举杯，干半杯！', color: '#2ecc71' },
  { id: 1, type: TILE_TYPES.NORMAL, label: '👉 就是你', text: '别看别人，喝 1 杯。', color: '#fff' },
  { id: 2, type: TILE_TYPES.CHANCE, label: '❓ 机会', text: '触发随机事件...', color: '#f1c40f' },
  { id: 3, type: TILE_TYPES.GAME, label: '🎲 逛三园', text: '水果/动物/品牌接龙。', punishment: '输家喝 1 杯。', color: '#3498db' },
  { id: 4, type: TILE_TYPES.NORMAL, label: '👓 眼镜党', text: '戴眼镜的人喝 1 杯！(没人戴你自己喝半杯)', color: '#fff' },
  { id: 5, type: TILE_TYPES.DESTINY, label: '🔮 命运', text: '抽取一张功能卡...', color: '#9b59b6' },
  { id: 6, type: TILE_TYPES.NORMAL, label: '👈 左边', text: '你左手边的人，替你喝 1 杯。', color: '#fff' },
  
  // 高能
  { id: 7, type: TILE_TYPES.JAIL, label: '🚔 进局子', text: '暂停 2 轮。每轮喝 1 杯保释酒。', color: '#95a5a6', isHighEnergy: true },
  
  { id: 8, type: TILE_TYPES.NORMAL, label: '👩 单身狗', text: '现场单身的人，喝 1 杯。', color: '#fff' },
  { id: 9, type: TILE_TYPES.CHANCE, label: '❓ 机会', text: '触发随机事件...', color: '#f1c40f' },
  
  // 高能
  { id: 10, type: TILE_TYPES.ASSEMBLY, label: '1️⃣ 1号集结', text: '全场所有 1 号，起立喝 1 杯！(不承认罚 2 杯)', color: '#fff', isHighEnergy: true },
  
  { id: 11, type: TILE_TYPES.GAME, label: '🖐️ 逢七过', text: '报数含7或7倍数拍手。', punishment: '输家喝 1 杯。', color: '#3498db' },
  { id: 12, type: TILE_TYPES.NORMAL, label: '❤️ 找对象', text: '选一个你喜欢的，和你喝 1 杯交杯酒。', color: '#fff' },
  { id: 13, type: TILE_TYPES.NORMAL, label: '👉 右边', text: '你右手边的人，替你喝 1 杯。', color: '#fff' },
  { id: 14, type: TILE_TYPES.NORMAL, label: '🅿️ 休息', text: '免费停车，全场休息一轮。', color: '#2ecc71' },
  { id: 15, type: TILE_TYPES.NORMAL, label: '🔋 谁最满', text: '手机电量最高的人，喝 1 杯！', color: '#fff' },
  { id: 16, type: TILE_TYPES.DESTINY, label: '🔮 命运', text: '抽取一张功能卡...', color: '#9b59b6' },
  
  // 高能
  { id: 17, type: TILE_TYPES.ASSEMBLY, label: '0️⃣ 0号集结', text: '全场所有 0 号/0.5，起立喝 1 杯！', color: '#fff', isHighEnergy: true },
  
  { id: 18, type: TILE_TYPES.GAME, label: '📏 猜大小', text: '你和庄家比大小。', punishment: '输了喝 1 杯。', color: '#3498db' },
  { id: 19, type: TILE_TYPES.NORMAL, label: '🍻 陪酒', text: '指定一个你顺眼的人，陪你喝半杯。', color: '#fff' },
  { id: 20, type: TILE_TYPES.CHANCE, label: '❓ 机会', text: '触发随机事件...', color: '#f1c40f' },
  
  // 超高能
  { id: 21, type: TILE_TYPES.BOMB, label: '💣 深水炸弹', text: '喝掉桌上所有玩家酒杯里剩下的酒！', color: '#e74c3c', isHighEnergy: true },
  
  { id: 22, type: TILE_TYPES.NORMAL, label: '👕 黑衣人', text: '穿黑色上衣的人，喝 1 杯。', color: '#fff' },
  { id: 23, type: TILE_TYPES.GAME, label: '📷 照妖镜', text: '做鬼脸合影！大家投票。', punishment: '偶像包袱重的喝 1 杯。', color: '#3498db' },
  { id: 24, type: TILE_TYPES.DESTINY, label: '🔮 命运', text: '抽取一张功能卡...', color: '#9b59b6' },
  { id: 25, type: TILE_TYPES.NORMAL, label: '🤐 禁言令', text: '直到下次轮到你，说一个字喝一口。', color: '#fff' },
  { id: 26, type: TILE_TYPES.BACK, label: '🔙 梦回', text: '倒退回【1号集结】或【0号集结】(随机)，再罚一次！', color: '#e67e22', isHighEnergy: true },
  { id: 27, type: TILE_TYPES.NORMAL, label: '🎲 听天由命', text: '掷一颗骰子：点数是几，就喝几口。', color: '#fff' },
];