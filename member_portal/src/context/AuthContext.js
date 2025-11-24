// 这是新文件: src/context/AuthContext.js
// (已修复 V5 重构 - 100% 干净且顺序正确)
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

// 1. 创建 Context（上下文）
const AuthContext = createContext();

// 2. 创建 Provider（提供者）组件
export const AuthProvider = ({ children }) => {
    // --- 状态管理 ---
    const [token, setToken] = useState(localStorage.getItem('lluvia_member_token'));
    const [userLevel, setUserLevel] = useState(null);
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate();

    // --- 逻辑 (V5 修复：顺序已纠正) ---

    // 🚩 修复 1：我们必须在 useEffect *之前* 定义 handleLogout
    const handleLogout = useCallback((doNavigate = true) => {
        localStorage.removeItem('lluvia_member_token'); 
        setToken(null);
        setUserLevel(null);
        if (doNavigate) {
            navigate('/login'); // 导航到登录页
        }
    }, [navigate]);

    // (登录函数也移到上面，保持整洁)
    const handleLoginSuccess = useCallback((newToken) => {
        localStorage.setItem('lluvia_member_token', newToken);
        setToken(newToken);
        navigate('/'); // 导航到主页
    }, [navigate]);


    // 🚩 修复 2：现在 useEffect 可以安全地依赖 handleLogout
    // (当 token 改变时，获取用户等级)
    useEffect(() => {
        if (token) {
            setLoading(true);
            const fetchUserLevel = async () => {
                try {
                    const authHeaders = { headers: { 'Authorization': `Token ${token}` } };
                    const response = await axios.get(`${API_URL}/profile/`, authHeaders);
                    setUserLevel(response.data.level.levelName);
                } catch (err) {
                    // Token 过期或无效
                    handleLogout(false); // ⬅️ 现在调用是安全的
                }
                setLoading(false);
            };
            fetchUserLevel();
        } else {
            setUserLevel(null);
            setLoading(false); // 没有 token，加载完成
        }
    }, [token, handleLogout]); // ⬅️ 依赖项现在是安全的


    // 3. 将状态和函数“提供”给所有子组件
    const value = {
        token,
        userLevel,
        loading, // 应用程序是否在等待 token 验证
        handleLoginSuccess,
        handleLogout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. 创建一个自定义 Hook (钩子)，以便轻松使用
export const useAuth = () => {
    return useContext(AuthContext);
};