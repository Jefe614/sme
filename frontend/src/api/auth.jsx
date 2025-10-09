// src/api/auth.js
import axios from "axios";
import { getApiBase } from "../utils/getApiBase";
import api from "./apiClient";

// Public base (no tenant schema)
export const API_PUBLIC_BASE = getApiBase({ useTenant: false });

export const signup = (data) =>
  axios.post(`${API_PUBLIC_BASE}/signup/`, data);

export const login = (data) =>
  axios.post(`${API_PUBLIC_BASE}/login/`, data, {
    headers: { "Content-Type": "application/json" },
  });




// ✅ Tenant endpoints (auto pick schema from apiClient)
export const getTeachers = () => api.get("/teachers/");
export const createClass = (data) => api.post("/classes", data);
export const getClasses = () => api.get("/classes");
export const getClassStudents = (classId) => api.get(`/students/?class_id=${classId}`);
export const deleteClass = (classId) => api.delete(`/classes/${classId}/`);
export const updateClassStatus = (classId, isActive) =>
  api.patch(`/classes/${classId}/`, { is_active: isActive });

export const getStaff = () => api.get("/staff/");
export const getStaffById = (id) => api.get(`/staff/${id}/`);
export const createStaff = (data) => api.post("/staff/", data);
export const updateStaff = (staffId, data) => api.patch(`/staff/${staffId}/`, data);
export const deleteStaff = (staffId) => api.delete(`/staff/${staffId}/`);
export const getSubjects = () => api.get("/subjects/");

