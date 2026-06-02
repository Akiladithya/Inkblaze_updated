// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const get = async (k) => AsyncStorage.getItem(k);
export const set = async (k, v) => AsyncStorage.setItem(k, v);
export const del = async (k) => AsyncStorage.removeItem(k);
