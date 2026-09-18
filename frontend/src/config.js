import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};
