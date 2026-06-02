// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchMe, setAuthToken } from '../services/api';
import * as store from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await store.get('innk_token');
        if (saved) {
          setAuthToken(saved);
          const me = await fetchMe(saved);
          setToken(saved);
          setUser(me);
        }
      } catch {
        await store.del('innk_token');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { token: t, user: u } = await loginUser(email, password);
    await store.set('innk_token', t);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  };

  const register = async (name, email, password) => {
    const { token: t, user: u } = await registerUser(name, email, password);
    await store.set('innk_token', t);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await store.del('innk_token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
