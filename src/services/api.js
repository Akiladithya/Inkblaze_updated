// src/services/api.js
import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { Accept: 'application/json' },
});

let _token = null;
export const setAuthToken = (t) => { _token = t; };

api.interceptors.request.use((config) => {
  if (_token) config.headers['Authorization'] = `Bearer ${_token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(new Error(
    err?.response?.data?.error || err?.message || 'Something went wrong.'
  ))
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser    = async (email, password)       => (await api.post('/auth/login',    { email, password })).data;
export const registerUser = async (name, email, password) => (await api.post('/auth/register', { name, email, password })).data;
export const fetchMe      = async (token) => (await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })).data;

// ── History ───────────────────────────────────────────────────────────────────
export const getHistory       = async ()    => (await api.get('/history')).data;
export const getHistoryItem   = async (id)  => (await api.get(`/history/${id}`)).data;
export const deleteHistoryItem = async (id) => (await api.delete(`/history/${id}`)).data;

// ── Processing ────────────────────────────────────────────────────────────────
export const highlightText = async (file, onProgress) => {
  const fd = new FormData();
  if (Platform.OS === 'web') {
    fd.append('file', file._webFile || file);
  } else {
    fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || _mime(file.name) });
  }
  const r = await api.post('/highlight-text', fd, {
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
  return r.data;
};

export const generateMCQs = async (file, n = 5) => {
  const fd = new FormData();
  if (Platform.OS === 'web') {
    fd.append('file', file._webFile || file);
  } else {
    fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || _mime(file.name) });
  }
  fd.append('num_questions', String(n));
  return (await api.post('/generate-mcqs', fd)).data;
};

export const getPdfUrl = (path) => {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}/${clean}`;
};

function _mime(fn) {
  const ext = fn?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')  return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

export default { highlightText, generateMCQs, getPdfUrl };
