// src/api/auth.js
import axios from "axios";
import { getApiBase } from "../utils/getApiBase";
import api from "./apiClient";

// Public base (no tenant schema)
export const API_PUBLIC_BASE = getApiBase({ useTenant: false });

export const signup = (data) =>
  axios.post(`${API_PUBLIC_BASE}/signup/`, data);

export const login = (data) =>
  axios.post(`${API_PUBLIC_BASE}/login/`, data);



// ✅ Tenant endpoints (auto pick schema from apiClient)
export const getTeachers = () => api.get("/teachers/");
export const createClass = (data) => api.post("/classes/", data);
export const getClasses = () => api.get("/classes/");