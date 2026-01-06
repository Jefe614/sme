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

export const forgotPassword = (data) =>
  axios.post(`${API_PUBLIC_BASE}/forgot-password/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const resetPassword = (uid, token, data) =>
  axios.post(`${API_PUBLIC_BASE}/reset-password/${uid}/${token}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ Tenant endpoints (auto pick schema from apiClient)

// Teachers
export const getTeachers = () => api.get("/teachers/");
export const createTeacher = (data) => api.post("/teachers/", data);

// Classes
export const getClasses = () => api.get("/classes");
export const createClass = (data) => api.post("/classes", data);
export const deleteClass = (classId) => api.delete(`/classes/${classId}/`);
export const updateClassStatus = (classId, isActive) =>
  api.patch(`/classes/${classId}/`, { is_active: isActive });

// Students
export const getStudents = () => api.get("/students");
export const getStudent = (studentId) => api.get(`/students/${studentId}/`);
export const getClassStudents = (classId) => api.get(`/students/?class_id=${classId}`);
export const createStudent = (data) => api.post("/students", data);
export const updateStudent = (studentId, data) => api.patch(`/students/${studentId}/`, data);
export const deleteStudent = (studentId) => api.delete(`/students/${studentId}/`);

// Staff
export const getStaff = () => api.get("/staff/");
export const getStaffById = (id) => api.get(`/staff/${id}/`);
export const createStaff = (data) => api.post("/staff/", data);
export const updateStaff = (staffId, data) => api.patch(`/staff/${staffId}/`, data);
export const deleteStaff = (staffId) => api.delete(`/staff/${staffId}/`);

// Subjects
export const getSubjects = () => api.get("/subjects/");
export const createSubject = (data) => api.post("/subjects/", data);

// Bulk operations
export const bulkImportStudents = (formData) =>
  api.post("/students/bulk-import/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const downloadStudentTemplate = () =>
  api.get("/students/download-template/", {
    responseType: 'blob'
  });

// Fee Management
export const getFeeStructures = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/fee-structures/?${queryString}`);
};

export const createFeeStructure = (data) => api.post("/fee-structures/", data);
export const updateFeeStructure = (id, data) => api.patch(`/fee-structures/${id}/`, data);
export const deleteFeeStructure = (id) => api.delete(`/fee-structures/${id}/`);

export const getFeePayments = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/fee-payments/?${queryString}`);
};

export const createFeePayment = (data) => api.post("/fee-payments/", data);
export const updateFeePayment = (id, data) => api.patch(`/fee-payments/${id}/`, data);
export const deleteFeePayment = (id) => api.delete(`/fee-payments/${id}/`);

export const getFeeDiscounts = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/fee-discounts/?${queryString}`);
};

export const createFeeDiscount = (data) => api.post("/fee-discounts/", data);
export const updateFeeDiscount = (id, data) => api.patch(`/fee-discounts/${id}/`, data);
export const deleteFeeDiscount = (id) => api.delete(`/fee-discounts/${id}/`);

export const getFeeReports = () => api.get("/fee-reports/");
