import React from 'react';
import { Button } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleToggle = () => {
    if (!isDarkMode) {
      toggleTheme(); // Only allow switching to dark mode
    }
  };

  return (
    <Button
      type="text"
      icon={<MoonOutlined />}
      onClick={handleToggle}
      className={`flex items-center justify-center ${className}`}
      disabled={isDarkMode}
      style={{
        color: isDarkMode ? '#a6a6a6' : '#ffffff',
        border: isDarkMode ? '1px solid #434343' : 'none',
        cursor: isDarkMode ? 'not-allowed' : 'pointer'
      }}
    >
      {isDarkMode ? 'Dark Mode Active' : 'Switch to Dark'}
    </Button>
  );
}
