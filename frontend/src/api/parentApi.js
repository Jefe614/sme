// parentApi.js
import apiClient from './apiClient';

export const parentApi = {
  // Parent Authentication (OTP-based)
  sendOTP: async (phoneNumber, schema) => {
    const response = await apiClient.post('/parent/send-otp/', {
      phone_number: phoneNumber,
      schema: schema
    });
    return response;
  },

  verifyOTP: async (phoneNumber, otpCode, schema) => {
    const response = await apiClient.post('/parent/verify-otp/', {
      phone_number: phoneNumber,
      otp_code: otpCode,
      schema: schema
    });
    return response;
  },

  // Parent Portal APIs
  getDashboard: async () => {
    const response = await apiClient.get('/parent/dashboard/');
    return response;
  },

  getStudents: async () => {
    const response = await apiClient.get('/parent/students/');
    return response;
  },

  getFees: async () => {
    const response = await apiClient.get('/parent/fees/');
    return response;
  },

  getResults: async () => {
    const response = await apiClient.get('/parent/results/');
    return response;
  },

  getAttendance: async () => {
    const response = await apiClient.get('/parent/attendance/');
    return response;
  },

  getAnnouncements: async () => {
    const response = await apiClient.get('/parent/announcements/');
    return response;
  },

  // Legacy Admin Notification functions
  getNotifications: async () => {
    const response = await apiClient.get('/notifications/');
    return response;
  },

  sendNotification: async (notificationData) => {
    // Expect notificationData to have student_ids instead of parent_ids
    const response = await apiClient.post('/notifications/send/', notificationData);
    return response;
  },

  sendFeeReminders: async () => {
    const response = await apiClient.post('/notifications/fee-reminders/');
    return response;
  },

  // Student functions for parent notifications
  getStudentsForNotification: async () => {
    const response = await apiClient.get('/students/');
    return response;
  }
};

export default parentApi;
