import axios from 'axios';

const PUBLIC_API = 'http://localhost:8000/api';

const getApiBase = () => {
  // Use VITE_BASE_API for production (e.g., https://api.example.com)
  if (import.meta.env.VITE_BASE_API) {
    return import.meta.env.VITE_BASE_API;
  }

  // Get tenantDomain from localStorage (e.g., school1_x12345.localhost)
  const tenantDomain = localStorage.getItem('tenantDomain');
  const hostname = window.location.host.split(':')[0];
  const port = import.meta.env.VITE_BACKEND_PORT || '8000';
  const protocol = window.location.protocol; // http: or https:

  // Use localhost for local development if no tenantDomain or hostname is localhost
  if (!tenantDomain && hostname === 'localhost') {
    return `${protocol}//localhost:${port}/api`;
  }

  const domain = tenantDomain || hostname;
  return `${protocol}//${domain}:${port}/api`;
};

export const API_BASE_URL = getApiBase();

export const signup = (data) => axios.post(`${PUBLIC_API}/signup/`, data);

export const login = (data) => axios.post(`${API_BASE_URL}/login/`, data);

export const createClass = (data, token) =>
  axios.post(`${API_BASE_URL}/classes/`, data, {
    headers: { Authorization: `Token ${token}` },
  });

export const getClasses = (token) =>
  axios.get(`${API_BASE_URL}/classes/`, {
    headers: { Authorization: `Token ${token}` },
  });