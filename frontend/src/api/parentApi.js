// parentApi.js
import apiClient from './apiClient';

export const parentApi = {
  // Notification functions - main functionality
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
