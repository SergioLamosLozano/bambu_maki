import { API_URL, API_BASE } from './config'
export const API_URL = import.meta.env.VITE_API_URL || `${API_URL}`;
export const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : `${API_BASE}`;
