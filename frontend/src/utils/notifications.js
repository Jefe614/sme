import { notification } from 'antd';

/**
 * Reusable notification utility using Ant Design
 */
export const showNotification = {
  success: (message, description = '', duration = 4.5) => {
    notification.success({
      message,
      description,
      duration,
      placement: 'topRight',
    });
  },

  error: (message, description = '', duration = 4.5) => {
    notification.error({
      message,
      description,
      duration,
      placement: 'topRight',
    });
  },

  warning: (message, description = '', duration = 4.5) => {
    notification.warning({
      message,
      description,
      duration,
      placement: 'topRight',
    });
  },

  info: (message, description = '', duration = 4.5) => {
    notification.info({
      message,
      description,
      duration,
      placement: 'topRight',
    });
  },
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error.response?.data?.message ||
                  error.response?.data?.error ||
                  error.message ||
                  defaultMessage;
  showNotification.error('Error', message);
};

/**
 * Handle API success consistently
 */
export const handleApiSuccess = (message, description = '') => {
  showNotification.success(message, description);
};
