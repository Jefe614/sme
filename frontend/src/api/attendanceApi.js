/**
 * Attendance API Client
 * Handles attendance-related API calls for both teachers and admins
 */

import apiClient from './apiClient';

// Teacher Attendance APIs (Mobile-ready)
export const teacherAttendanceApi = {
  // Get classes assigned to a teacher
  getTeacherClasses: (staffId, academicYearId = null) => {
    const params = new URLSearchParams({ staff_id: staffId });
    if (academicYearId) params.append('academic_year_id', academicYearId);

    return apiClient.get(`/teachers/classes/?${params}`);
  },

  // Get class attendance data for marking
  getClassAttendanceData: (classId, date = null, staffId) => {
    const params = new URLSearchParams({
      class_id: classId,
      staff_id: staffId
    });
    if (date) params.append('date', date);

    return apiClient.get(`/teachers/attendance/class-data/?${params}`);
  },

  // Mark attendance for a class
  markAttendance: (attendanceData) => {
    return apiClient.post('/teachers/attendance/mark/', attendanceData);
  },

  // Update specific attendance record (same-day only)
  updateAttendance: (recordId, updateData) => {
    return apiClient.put(`/teachers/attendance/mark/${recordId}/`, updateData);
  }
};

// Admin Attendance APIs (Read-only)
export const adminAttendanceApi = {
  // Get attendance dashboard statistics
  getAttendanceDashboard: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append('date', params.date);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.classId) queryParams.append('class_id', params.classId);
    if (params.academicYearId) queryParams.append('academic_year_id', params.academicYearId);
    if (params.termId) queryParams.append('term_id', params.termId);

    return apiClient.get(`/attendance/dashboard/?${queryParams}`);
  },

  // Get attendance reports (JSON/CSV export)
  getAttendanceReport: (params = {}) => {
    const queryParams = new URLSearchParams();

    queryParams.append('start_date', params.startDate);
    queryParams.append('end_date', params.endDate);
    if (params.format) queryParams.append('format', params.format);
    if (params.classId) queryParams.append('class_id', params.classId);
    if (params.studentId) queryParams.append('student_id', params.studentId);

    return apiClient.get(`/attendance/reports/?${queryParams}`);
  },

  // Get student attendance summary
  getStudentAttendanceSummary: (studentId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.academicYearId) queryParams.append('academic_year_id', params.academicYearId);
    if (params.termId) queryParams.append('term_id', params.termId);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    return apiClient.get(`/attendance/student/${studentId}/summary/?${queryParams}`);
  }
};

// Shared attendance utilities
export const attendanceUtils = {
  // Attendance status options
  STATUS_OPTIONS: [
    { value: 'present', label: 'Present', color: 'success' },
    { value: 'absent', label: 'Absent', color: 'error' },
    { value: 'late', label: 'Late', color: 'warning' },
    { value: 'excused', label: 'Excused', color: 'info' }
  ],

  // Get status display info
  getStatusInfo: (status) => {
    return attendanceUtils.STATUS_OPTIONS.find(option => option.value === status) || {
      label: status,
      color: 'default'
    };
  },

  // Calculate attendance rate
  calculateAttendanceRate: (present, total) => {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  },

  // Format attendance percentage
  formatAttendancePercentage: (rate) => {
    return `${rate}%`;
  }
};

export default {
  teacher: teacherAttendanceApi,
  admin: adminAttendanceApi,
  utils: attendanceUtils
};
