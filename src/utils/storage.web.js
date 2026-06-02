// src/utils/storage.web.js
export const get = async (k) => localStorage.getItem(k);
export const set = async (k, v) => localStorage.setItem(k, v);
export const del = async (k) => localStorage.removeItem(k);
