import { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export const useTenantApi = () => {
  const { user } = useContext(AuthContext);

  // Use tenant-specific API base if logged in, otherwise fallback to public
  const apiBase = user?.apiBase || 'http://localhost:8000/api';

  const post = (endpoint, data) => axios.post(`${apiBase}${endpoint}`, data);
  const get = (endpoint, config) => axios.get(`${apiBase}${endpoint}`, config);

  return { post, get };
};
