// utils/notifications.js

const DEFAULT_DURATION = 4500; // 4.5 seconds

// Create container for notifications
let container = document.getElementById('toast-container');
if (!container) {
  container = document.createElement('div');
  container.id = 'toast-container';
  container.style.position = 'fixed';
  container.style.top = '24px'; // same as antd
  container.style.right = '24px';
  container.style.zIndex = 1000;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '16px';
  document.body.appendChild(container);
}

/**
 * AntD-like colors
 */
const TYPE_COLORS = {
  success: '#f6ffed',
  successBorder: '#b7eb8f',
  successText: '#389e0d',
  error: '#fff2f0',
  errorBorder: '#ffccc7',
  errorText: '#cf1322',
  warning: '#fffbe6',
  warningBorder: '#ffe58f',
  warningText: '#d48806',
  info: '#e6f7ff',
  infoBorder: '#91d5ff',
  infoText: '#096dd9',
};

/**
 * Create a toast
 */
function createToast(type, title, message, duration = DEFAULT_DURATION) {
  const toast = document.createElement('div');
  toast.style.minWidth = '300px';
  toast.style.padding = '16px 24px';
  toast.style.borderRadius = '4px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.borderLeft = `6px solid ${TYPE_COLORS[type + 'Border']}`;
  toast.style.background = TYPE_COLORS[type];
  toast.style.color = TYPE_COLORS[type + 'Text'];
  toast.style.fontFamily = 'Roboto, sans-serif';
  toast.style.position = 'relative';
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  toast.style.transition = 'all 0.4s ease';

  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '8px';
  closeBtn.style.right = '12px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.color = TYPE_COLORS[type + 'Text'];
  closeBtn.addEventListener('click', () => removeToast(toast));
  toast.appendChild(closeBtn);

  // Title
  const titleElem = document.createElement('div');
  titleElem.textContent = title;
  titleElem.style.fontWeight = '600';
  titleElem.style.fontSize = '16px';
  titleElem.style.marginBottom = message ? '4px' : '0';
  toast.appendChild(titleElem);

  // Message
  if (message) {
    const messageElem = document.createElement('div');
    messageElem.textContent = message;
    messageElem.style.fontSize = '14px';
    toast.appendChild(messageElem);
  }

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto-remove timer
  let removeTimeout = setTimeout(() => removeToast(toast), duration);

  // Pause on hover
  toast.addEventListener('mouseenter', () => clearTimeout(removeTimeout));
  toast.addEventListener('mouseleave', () => {
    removeTimeout = setTimeout(() => removeToast(toast), duration);
  });
}

/**
 * Remove a toast with animation
 */
function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  toast.addEventListener('transitionend', () => {
    toast.remove();
  });
}

export const showNotification = {
  success: (title, message, duration) => createToast('success', title, message, duration),
  error: (title, message, duration) => createToast('error', title, message, duration),
  warning: (title, message, duration) => createToast('warning', title, message, duration),
  info: (title, message, duration) => createToast('info', title, message, duration),
};

/**
 * Handle API errors
 */
export const handleApiError = (err, defaultMessage = 'An error occurred') => {
  const description =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    defaultMessage;

  showNotification.error('Error', description);
  console.log('Notification triggered:', description);
};

/**
 * Handle API success
 */
export const handleApiSuccess = (message, description = '') => {
  showNotification.success('Success', message || description);
};
