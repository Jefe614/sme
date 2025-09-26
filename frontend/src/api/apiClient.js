// src/api/apiClient.js
import axios from "axios";
import { getApiBase } from "../utils/getApiBase";

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  const API_BASE_URL = getApiBase();

  config.baseURL = API_BASE_URL;

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

export default api;
